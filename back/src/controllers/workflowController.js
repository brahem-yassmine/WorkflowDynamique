// back/src/controllers/workflowController.js
const fs = require('fs');
const path = require('path');
const Workflow = require('../models/tenant/Workflow.js');
const notificationController = require('./notificationController');
const User = require('../models/tenant/User');
const { recordActivity } = require('../services/auditLogger');

// ============================================
// 1. LIST ALL WORKFLOWS
// ============================================
exports.getWorkflows = async (req, res) => {
  try {
    const { domain, status } = req.query;

    // Get models from tenant connection
    const Workflow = req.tenantConn.model('Workflow');
    const Project = req.tenantConn.model('Project');
    const user = req.user;

    const { projectId } = req.query;
    let query = {};

    // 1. Visibility for non-admin users
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      const domainsToMatch = [user.domain];
      if (user.domain === 'HR' || user.domain === 'RH') {
        domainsToMatch.push(user.domain === 'HR' ? 'RH' : 'HR');
      }

      // Simple Visibility: Show workflows in your domain
      query.domain = { $in: domainsToMatch };
    } else {
      // Admin/SuperAdmin sees everything, but can filter by projectId
      if (projectId) query.projectId = projectId;
      if (domain) query.domain = domain;
    }

    if (status) {
      query.status = status;
    }

    const workflows = await Workflow.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: workflows.length,
      data: workflows
    });

  } catch (error) {
    console.error('❌ getWorkflows Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
};

// ============================================
// 2. GET WORKFLOW BY ID
// ============================================
exports.getWorkflowById = async (req, res) => {
  try {
    const { workflowId } = req.params;

    const Workflow = req.tenantConn.model('Workflow');

    // REMOVE tenantId from filter
    const workflow = await Workflow.findById(workflowId);

    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found'
      });
    }

    res.json({
      success: true,
      data: workflow
    });

  } catch (error) {
    console.error('❌ getWorkflowById Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// ============================================
// 3. CREATE NEW WORKFLOW
// ============================================
exports.createWorkflow = async (req, res) => {
  try {
    const { name, description, domain, nodes, edges, projectId } = req.body;

    const Workflow = req.tenantConn.model('Workflow');

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Name is required'
      });
    }

    const workflowDomain = domain || req.user.domain;

    let workflowNodes = nodes || [];
    let workflowEdges = edges || [];

    // Process base64 attachments in nodes
    for (let node of workflowNodes) {
      if (node.data && node.data.attachments && Array.isArray(node.data.attachments)) {
        for (let i = 0; i < node.data.attachments.length; i++) {
          let att = node.data.attachments[i];
          if (att.url && att.url.startsWith('data:')) {
            const match = att.url.match(/^data:([^;]+);base64,(.+)$/);
            if (match) {
              const base64Data = match[2];
              const buffer = Buffer.from(base64Data, 'base64');
              const uniqueFilename = `${Date.now()}-${att.filename}`;
              const filePath = path.join(__dirname, '../../uploads', uniqueFilename);
              if (!fs.existsSync(path.join(__dirname, '../../uploads'))) {
                fs.mkdirSync(path.join(__dirname, '../../uploads'), { recursive: true });
              }
              fs.writeFileSync(filePath, buffer);
              node.data.attachments[i].url = `http://localhost:5000/uploads/${uniqueFilename}`;
            }
          }
        }
      }
    }

    // Default Graph if empty
    if (workflowNodes.length === 0) {
      const startId = 'node_start_' + Date.now();
      const endId = 'node_end_' + Date.now();

      workflowNodes = [
        {
          id: startId,
          type: 'start',
          position: { x: 100, y: 100 },
          data: { label: 'Start' }
        },
        {
          id: endId,
          type: 'end',
          position: { x: 100, y: 300 },
          data: { label: 'End' }
        }
      ];

      workflowEdges = [
        {
          id: 'edge_' + Date.now(),
          source: startId,
          target: endId,
          type: 'default'
        }
      ];
    }

    // ADD createdBy (user who creates the template)
    const workflow = new Workflow({
      name,
      description: description || '',
      domain: workflowDomain,
      nodes: workflowNodes,
      edges: workflowEdges,
      status: 'draft',
      createdBy: req.user.id
    });

    await workflow.save();

    // Trigger Notification for Admins
    const UserModel = req.tenantConn.model('User');
    const admins = await UserModel.find({ role: 'admin' });

    for (const admin of admins) {
      await notificationController.createInternalNotification(req.tenantConn, {
        recipient: admin._id,
        title: 'New Workflow Created',
        message: `A new workflow "${name}" has been drafted in domain ${workflowDomain}.`,
        type: 'workflow_created',
        link: `/admin/workflows?id=${workflow._id}`
      });
    }

    // Trigger Notification for Users in the same domain
    const searchDomains = [workflowDomain];
    if (workflowDomain === 'HR' || workflowDomain === 'RH') {
      searchDomains.push(workflowDomain === 'HR' ? 'RH' : 'HR');
    }

    const domainUsers = await UserModel.find({
      domain: { $in: searchDomains },
      role: { $ne: 'admin' } // admins already notified
    });

    for (const user of domainUsers) {
      // Don't notify the creator twice
      if (user._id.toString() === req.user.id.toString()) continue;

      await notificationController.createInternalNotification(req.tenantConn, {
        recipient: user._id,
        title: 'New Workflow Template',
        message: `A new template "${name}" is available in the ${workflowDomain} department.`,
        type: 'workflow_created',
        link: `/User/Workflows`
      });
    }

    // Log the activity
    await recordActivity(req, 'CREATE_WORKFLOW', {
      type: 'Workflow',
      id: workflow._id,
      name: workflow.name
    });

    res.status(201).json({
      success: true,
      message: 'Workflow created successfully',
      data: workflow
    });

  } catch (error) {
    console.error('❌ createWorkflow Error:', error);

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error: ' + errors.join(', '),
        errors: errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ============================================
// 4. UPDATE WORKFLOW
// ============================================
exports.updateWorkflow = async (req, res) => {
  try {
    const { workflowId } = req.params;
    const updates = req.body;

    const Workflow = req.tenantConn.model('Workflow');

    const workflow = await Workflow.findById(workflowId);

    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found'
      });
    }

    // Process base64 attachments in nodes
    if (updates.nodes && Array.isArray(updates.nodes)) {
      for (let node of updates.nodes) {
        if (node.data && node.data.attachments && Array.isArray(node.data.attachments)) {
          for (let i = 0; i < node.data.attachments.length; i++) {
            let att = node.data.attachments[i];
            if (att.url && att.url.startsWith('data:')) {
              const match = att.url.match(/^data:([^;]+);base64,(.+)$/);
              if (match) {
                const base64Data = match[2];
                const buffer = Buffer.from(base64Data, 'base64');
                const uniqueFilename = `${Date.now()}-${att.filename}`;
                const filePath = path.join(__dirname, '../../uploads', uniqueFilename);
                if (!fs.existsSync(path.join(__dirname, '../../uploads'))) {
                  fs.mkdirSync(path.join(__dirname, '../../uploads'), { recursive: true });
                }
                fs.writeFileSync(filePath, buffer);
                node.data.attachments[i].url = `http://localhost:5000/uploads/${uniqueFilename}`;
              }
            }
          }
        }
      }
    }

    // Implicit Mongoose validation for nodes/edges if provided
    if (updates.nodes) workflow.nodes = updates.nodes;
    if (updates.edges) workflow.edges = updates.edges;

    // REMOVE tenantId protection (no longer needed)
    Object.keys(updates).forEach(key => {
      if (key !== '_id') {
        workflow[key] = updates[key];
      }
    });

    await workflow.save();

    // Log the activity
    await recordActivity(req, 'UPDATE_WORKFLOW', {
      type: 'Workflow',
      id: workflow._id,
      name: workflow.name
    });

    // Trigger Notification for Admins and Team
    try {
      const UserModel = req.tenantConn.model('User');
      const workflowDomain = workflow.domain;

      // 1. Notify Admins
      const admins = await UserModel.find({ role: 'admin' });
      for (const admin of admins) {
        if (admin._id.toString() === req.user.id.toString()) continue;
        await notificationController.createInternalNotification(req.tenantConn, {
          recipient: admin._id,
          title: 'Workflow Configuration Updated',
          message: `The workflow "${workflow.name}" has been modified by ${req.user.email}.`,
          type: 'system',
          link: `/admin/workflows?id=${workflow._id}`
        });
      }

      // 2. Notify Domain Users
      const searchDomains = [workflowDomain];
      if (workflowDomain === 'HR' || workflowDomain === 'RH') {
        searchDomains.push(workflowDomain === 'HR' ? 'RH' : 'HR');
      }

      const domainUsers = await UserModel.find({
        domain: { $in: searchDomains },
        role: { $ne: 'admin' }
      });

      for (const user of domainUsers) {
        if (user._id.toString() === req.user.id.toString()) continue;
        await notificationController.createInternalNotification(req.tenantConn, {
          recipient: user._id,
          title: 'Workflow Template Updated',
          message: `The template "${workflow.name}" in ${workflowDomain} has been updated.`,
          type: 'system',
          link: `/User/Workflows`
        });
      }
    } catch (notifErr) {
      console.warn('Notification failed:', notifErr.message);
    }

    res.json({
      success: true,
      message: 'Workflow updated',
      data: workflow
    });

  } catch (error) {
    console.error('❌ updateWorkflow Error:', error);

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// ============================================
// 5. DELETE WORKFLOW
// ============================================
exports.deleteWorkflow = async (req, res) => {
  try {
    const { workflowId } = req.params;

    const Workflow = req.tenantConn.model('Workflow');
    const WorkflowInstance = req.tenantConn.model('WorkflowInstance');

    // Check if there are linked instances
    const instancesCount = await WorkflowInstance.countDocuments({ workflowId });

    if (instancesCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Deletion impossible: ${instancesCount} instance(s) exist. Archive first.`
      });
    }

    const workflow = await Workflow.findByIdAndDelete(workflowId);

    if (workflow) {
      // Log the activity
      await recordActivity(req, 'DELETE_WORKFLOW', {
        type: 'Workflow',
        id: workflow._id,
        name: workflow.name
      });

      // Trigger Notification for Admins and Team
      try {
        const UserModel = req.tenantConn.model('User');
        const workflowDomain = workflow.domain;

        // 1. Notify Admins
        const admins = await UserModel.find({ role: 'admin' });
        for (const admin of admins) {
          if (admin._id.toString() === req.user.id.toString()) continue;
          await notificationController.createInternalNotification(req.tenantConn, {
            recipient: admin._id,
            title: 'Workflow Permanently Deleted',
            message: `The workflow "${workflow.name}" was removed from the system.`,
            type: 'system'
          });
        }

        // 2. Notify Domain Users
        const searchDomains = [workflowDomain];
        if (workflowDomain === 'HR' || workflowDomain === 'RH') {
          searchDomains.push(workflowDomain === 'HR' ? 'RH' : 'HR');
        }

        const domainUsers = await UserModel.find({
          domain: { $in: searchDomains },
          role: { $ne: 'admin' }
        });

        for (const user of domainUsers) {
          if (user._id.toString() === req.user.id.toString()) continue;
          await notificationController.createInternalNotification(req.tenantConn, {
            recipient: user._id,
            title: 'Workflow Template Removed',
            message: `The template "${workflow.name}" is no longer available.`,
            type: 'system'
          });
        }
      } catch (notifErr) {
        console.warn('Notification failed:', notifErr.message);
      }
    }

    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found'
      });
    }

    res.json({
      success: true,
      message: 'Workflow deleted successfully',
      data: { id: workflowId }
    });

  } catch (error) {
    console.error('❌ deleteWorkflow Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// ============================================
// 6. EXECUTE WORKFLOW (CREATE INSTANCE)
// ============================================
exports.executeWorkflow = async (req, res) => {
  try {
    const { workflowId } = req.params;

    const Workflow = req.tenantConn.model('Workflow');
    const WorkflowInstance = req.tenantConn.model('WorkflowInstance');

    const workflow = await Workflow.findById(workflowId);

    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found'
      });
    }

    // Allow execution even if in draft for testing purposes
    /*
    if (workflow.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Workflow must be active to be executed'
      });
    }
    */

    // GRAPH INITIALIZATION
    // Find start node (type: 'start')
    const startNode = workflow.nodes.find(n => n.type === 'start');

    if (!startNode) {
      return res.status(400).json({
        success: false,
        message: 'Workflow has no start node (type: start)'
      });
    }

    const instance = new WorkflowInstance({
      workflowId: workflow._id,
      createdBy: req.user.id,
      title: req.body.title || `Instance de ${workflow.name}`,
      description: req.body.description || workflow.description, // Ajout description

      // Graph initialization
      currentNodes: [{
        nodeId: startNode.id,
        status: 'in_progress',
        startedAt: new Date(),
        responsibleUser: startNode.data?.assignedUser || (startNode.data?.assigneeSelectionType === 'user' ? (startNode.data.assigneeIds?.[0]) : null),
        responsibleDomain: startNode.data?.responsibleDomain || startNode.data?.domain || null,
        assignees: startNode.data?.assigneeIds || []
      }],

      variables: req.body.data || {}, // Initial variables

      executionPath: [{
        nodeId: startNode.id,
        nodeType: 'start',
        action: 'start',
        performedBy: req.user.id,
        comments: 'Workflow démarré',
        timestamp: new Date()
      }],

      status: 'in_progress',
      priority: req.body.priority || 'medium',
      dueDate: req.body.dueDate || null,
      timeStarted: new Date(),

      history: [{ // Legacy history
        action: 'instance_created',
        title: 'Démarrage',
        performedBy: req.user.id,
        comments: 'Instance créée'
      }]
    });

    await instance.save();

    // Trigger Notifications
    try {
      const currentNode = instance.currentNodes[0];
      const UserModel = req.tenantConn.model('User');

      // 1. Collect target users (direct and by role)
      const targetUsers = new Set();
      if (currentNode.responsibleUser) targetUsers.add(currentNode.responsibleUser.toString());
      if (currentNode.assignees && startNode.data?.assigneeSelectionType === 'user') {
        currentNode.assignees.forEach(id => targetUsers.add(id.toString()));
      }

      // If assigned by ROLE
      if (startNode.data?.assigneeSelectionType === 'role' && currentNode.assignees?.length > 0) {
        const RoleModel = req.tenantConn.model('Role');
        const rolesMatching = await RoleModel.find({ _id: { $in: currentNode.assignees } });
        const roleNames = rolesMatching.map(r => r.name);

        const roleUsers = await UserModel.find({
          $or: [
            { role: { $in: roleNames } }, // Match by role name string
            { role: { $in: currentNode.assignees.map(id => id.toString()) } } // Match by direct role ID string if applicable
          ]
        });
        roleUsers.forEach(u => targetUsers.add(u._id.toString()));
      }

      for (const userId of targetUsers) {
        await notificationController.createInternalNotification(req.tenantConn, {
          recipient: userId,
          title: 'New Task Assigned',
          message: `You have a new task "${startNode.data?.label || 'Step'}" in workflow "${instance.title}".`,
          type: 'task_assigned',
          link: `/Workflows/instances/${instance._id}`
        });
      }

      // 2. Notify Domain/Department
      if (currentNode.responsibleDomain) {
        const domain = currentNode.responsibleDomain;
        const searchDomains = [domain];
        if (domain === 'HR' || domain === 'RH') searchDomains.push(domain === 'HR' ? 'RH' : 'HR');

        const domainUsers = await UserModel.find({ domain: { $in: searchDomains } });
        for (const user of domainUsers) {
          if (targetUsers.has(user._id.toString())) continue;
          await notificationController.createInternalNotification(req.tenantConn, {
            recipient: user._id,
            title: 'New Department Task',
            message: `A new task for the ${domain} department is available in "${instance.title}".`,
            type: 'task_assigned',
            link: `/Workflows/instances/${instance._id}`
          });
        }
      }

      // 3. Notify Admins
      const admins = await UserModel.find({ role: 'admin' });
      for (const admin of admins) {
        await notificationController.createInternalNotification(req.tenantConn, {
          recipient: admin._id,
          title: 'New Workflow Instance',
          message: `An instance of "${workflow.name}" has been started by ${req.user.email}.`,
          type: 'system',
          link: `/Workflows/instances/${instance._id}`
        });
      }
    } catch (err) {
      console.error('Notification Error:', err);
    }

    res.status(201).json({
      success: true,
      message: 'Workflow executed successfully',
      data: {
        workflowId: workflow._id,
        instanceId: instance._id,
        status: instance.status,
        startedAt: instance.timeStarted,
        currentNodes: instance.currentNodes
      }
    });

  } catch (error) {
    console.error('❌ executeWorkflow Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// ============================================
// 7. CHANGE WORKFLOW STATUS
// ============================================
exports.changeWorkflowStatus = async (req, res) => {
  try {
    const { workflowId } = req.params;
    const { status } = req.body;

    const Workflow = req.tenantConn.model('Workflow');

    if (!status || !['draft', 'active', 'archived'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Accepted values: draft, active, archived'
      });
    }

    const workflow = await Workflow.findById(workflowId);

    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found'
      });
    }

    workflow.status = status;
    await workflow.save();

    // Trigger Notifications for Status Change
    try {
      const UserModel = req.tenantConn.model('User');
      const workflowDomain = workflow.domain;

      // 1. Notify Admins
      const admins = await UserModel.find({ role: 'admin' });
      for (const admin of admins) {
        if (admin._id.toString() === req.user.id.toString()) continue;
        await notificationController.createInternalNotification(req.tenantConn, {
          recipient: admin._id,
          title: `Workflow Status: ${status.toUpperCase()}`,
          message: `The workflow "${workflow.name}" is now set to ${status}.`,
          type: 'system',
          link: `/admin/workflows?id=${workflow._id}`
        });
      }

      // 2. Notify Domain Users (Publication or Archival)
      if (status === 'active' || status === 'archived') {
        const searchDomains = [workflowDomain];
        if (workflowDomain === 'HR' || workflowDomain === 'RH') {
          searchDomains.push(workflowDomain === 'HR' ? 'RH' : 'HR');
        }

        const domainUsers = await UserModel.find({
          domain: { $in: searchDomains },
          role: { $ne: 'admin' }
        });

        for (const user of domainUsers) {
          if (user._id.toString() === req.user.id.toString()) continue;
          await notificationController.createInternalNotification(req.tenantConn, {
            recipient: user._id,
            title: status === 'active' ? 'New Workflow Available' : 'Workflow Archived',
            message: status === 'active'
              ? `The template "${workflow.name}" is now ready for use.`
              : `The template "${workflow.name}" has been removed from active duty.`,
            type: 'system',
            link: status === 'active' ? `/User/Workflows` : null
          });
        }
      }
    } catch (notifErr) {
      console.warn('Status notification failed:', notifErr.message);
    }

    res.json({
      success: true,
      message: `Workflow status changed to "${status}"`,
      data: workflow
    });

  } catch (error) {
    console.error('❌ changeWorkflowStatus Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// ============================================
// 8. DUPLICATE WORKFLOW
// ============================================
exports.duplicateWorkflow = async (req, res) => {
  try {
    const { workflowId } = req.params;

    const Workflow = req.tenantConn.model('Workflow');

    const original = await Workflow.findById(workflowId);

    if (!original) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found'
      });
    }

    // Create a copy
    const duplicate = new Workflow({
      name: `${original.name} (copy)`,
      description: original.description,
      domain: original.domain,
      nodes: original.nodes.map(node => ({ ...node })), // Basic deep copy
      edges: original.edges.map(edge => ({ ...edge })), // Basic deep copy
      status: 'draft',
      createdBy: req.user.id
    });

    await duplicate.save();

    // Log the activity
    await recordActivity(req, 'CLONE_WORKFLOW', {
      type: 'Workflow',
      id: duplicate._id,
      name: duplicate.name
    }, { originalWorkflowId: workflowId });

    res.status(201).json({
      success: true,
      message: 'Workflow duplicated successfully',
      data: duplicate
    });

  } catch (error) {
    console.error('❌ duplicateWorkflow Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

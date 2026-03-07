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
      status: req.body.status || 'draft',
      projectId: projectId || null,
      createdBy: req.user.id
    });

    await workflow.save();

    // IF status is active, automatically start an instance
    if (workflow.status === 'active') {
      try {
        await _internalStartInstance(req.tenantConn, workflow, req.user, {
          title: `Auto-start: ${workflow.name}`,
          description: workflow.description,
          priority: 'medium'
        });
      } catch (execErr) {
        console.error('❌ Auto-start failed during creation:', execErr.message);
      }
    }

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
    const oldStatus = workflow.status;
    const newStatus = updates.status || oldStatus;

    Object.keys(updates).forEach(key => {
      if (key !== '_id') {
        workflow[key] = updates[key];
      }
    });

    await workflow.save();

    // IF status becomes active, automatically start an instance (only if it was draft)
    if (newStatus === 'active' && oldStatus === 'draft') {
      try {
        await _internalStartInstance(req.tenantConn, workflow, req.user, {
          title: `Auto-start: ${workflow.name}`,
          description: workflow.description,
          priority: 'medium'
        });
      } catch (execErr) {
        console.error('❌ Auto-start failed during update:', execErr.message);
      }
    }

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
    const workflow = await Workflow.findById(workflowId);

    if (!workflow) {
      return res.status(404).json({ success: false, message: 'Workflow not found' });
    }

    const instance = await _internalStartInstance(req.tenantConn, workflow, req.user, {
      title: req.body.title,
      description: req.body.description,
      priority: req.body.priority,
      dueDate: req.body.dueDate,
      data: req.body.data
    });

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
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

/**
 * INTERNAL FUNCTION: Start a workflow execution instance
 */
async function _internalStartInstance(tenantConn, workflow, user, options = {}) {
  const WorkflowInstance = tenantConn.model('WorkflowInstance');
  const UserModel = tenantConn.model('User');
  const RoleModel = tenantConn.model('Role');

  // GRAPH INITIALIZATION
  // Find start node (type: 'start')
  const startNode = workflow.nodes.find(n => n.type === 'start');

  if (!startNode) {
    const error = new Error('Workflow has no start node (type: start)');
    error.status = 400;
    throw error;
  }

  // Skip the Start node: Find the next nodes automatically
  const nextEdges = workflow.edges.filter(e => e.source === startNode.id);
  const initialNodes = [];

  nextEdges.forEach(edge => {
    const targetNode = workflow.nodes.find(n => n.id === edge.target);
    if (targetNode) {
      const data = targetNode.data || {};
      const selType = data.assigneeSelectionType || data.validatorType || 'role';
      const ids = data.assigneeIds || data.validatorIds || [];

      initialNodes.push({
        nodeId: targetNode.id,
        status: 'in_progress',
        startedAt: new Date(),
        responsibleUser: selType === 'user' ? (ids[0]) : null,
        responsibleDomain: data.responsibleDomain || null,
        assignees: ids
      });
    }
  });

  // If no next nodes, we might as well just end or start with Start (fallback)
  // but following user's request, we expect at least one next node.
  const finalInitialNodes = initialNodes.length > 0 ? initialNodes : [{
    nodeId: startNode.id,
    status: 'in_progress',
    startedAt: new Date(),
    responsibleUser: startNode.data?.assignedUser || null,
    responsibleDomain: startNode.data?.responsibleDomain || null,
    assignees: startNode.data?.assigneeIds || []
  }];

  const instance = new WorkflowInstance({
    workflowId: workflow._id,
    createdBy: user.id,
    title: options.title || `Instance de ${workflow.name}`,
    description: options.description || workflow.description,

    // Start with the nodes AFTER the start node
    currentNodes: finalInitialNodes,

    variables: options.data || {},

    executionPath: [
      {
        nodeId: startNode.id,
        nodeType: 'start',
        action: 'completed',
        performedBy: user.id,
        comments: 'Workflow démarré (Start sauté)',
        timestamp: new Date()
      },
      ...finalInitialNodes.map(n => ({
        nodeId: n.nodeId,
        nodeType: workflow.nodes.find(wn => wn.id === n.nodeId)?.type || 'action',
        action: 'activated',
        timestamp: new Date()
      }))
    ],

    status: 'in_progress',
    priority: options.priority || 'medium',
    dueDate: options.dueDate || null,
    timeStarted: new Date(),

    history: [{
      action: 'instance_created',
      title: 'Démarrage automatique',
      performedBy: user.id,
      comments: `Instance créée - ${finalInitialNodes.length} nœuds activés`
    }]
  });

  await instance.save();

  // Trigger Notifications for all active nodes
  try {
    const UserModel = tenantConn.model('User');
    const RoleModel = tenantConn.model('Role');

    for (const currentNode of instance.currentNodes) {
      const nodeDef = workflow.nodes.find(n => n.id === currentNode.nodeId);

      // 1. Collect target users (direct and by role)
      const targetUsers = new Set();
      if (currentNode.responsibleUser) targetUsers.add(currentNode.responsibleUser.toString());
      if (currentNode.assignees) {
        currentNode.assignees.forEach(id => targetUsers.add(id.toString()));
      }

      // If assigned by ROLE
      if (nodeDef?.data?.assigneeSelectionType === 'role' && currentNode.assignees?.length > 0) {
        const rolesMatching = await RoleModel.find({ _id: { $in: currentNode.assignees } });
        const roleNames = rolesMatching.map(r => r.name);

        const roleUsers = await UserModel.find({
          $or: [
            { role: { $in: roleNames } },
            { role: { $in: currentNode.assignees.map(id => id.toString()) } }
          ]
        });
        roleUsers.forEach(u => targetUsers.add(u._id.toString()));
      }

      for (const userId of targetUsers) {
        await notificationController.createInternalNotification(tenantConn, {
          recipient: userId,
          title: 'New Task Assigned',
          message: `You have a new task "${nodeDef?.data?.label || 'Step'}" in workflow "${instance.title}".`,
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
          await notificationController.createInternalNotification(tenantConn, {
            recipient: user._id,
            title: 'New Department Task',
            message: `A new task for the ${domain} department is available in "${instance.title}".`,
            type: 'task_assigned',
            link: `/Workflows/instances/${instance._id}`
          });
        }
      }
    }

    // 3. Notify Admins (once per instance)
    const admins = await UserModel.find({ role: 'admin' });
    for (const admin of admins) {
      await notificationController.createInternalNotification(tenantConn, {
        recipient: admin._id,
        title: 'New Workflow Instance',
        message: `An instance of "${workflow.name}" has been started by ${user.email}.`,
        type: 'system',
        link: `/Workflows/instances/${instance._id}`
      });
    }
  } catch (err) {
    console.error('Notification Error:', err);
  }

  return instance;
}

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
// 10. GET WORKFLOW MEMBERS (ADMIN VIEW)
// ============================================
exports.getWorkflowMembers = async (req, res) => {
  try {
    const { workflowId } = req.params;
    const Workflow = req.tenantConn.model('Workflow');
    const WorkflowInstance = req.tenantConn.model('WorkflowInstance');
    const User = req.tenantConn.model('User');

    const workflow = await Workflow.findById(workflowId);
    if (!workflow) return res.status(404).json({ success: false, message: 'Workflow not found' });

    // 1. Get users assigned in Template
    const templateUserIds = new Set();
    workflow.nodes.forEach(node => {
      if (node.data?.assigneeIds) {
        node.data.assigneeIds.forEach(id => templateUserIds.add(id.toString()));
      }
      if (node.data?.assignedUser) templateUserIds.add(node.data.assignedUser.toString());
    });

    // 2. Get users assigned in Instances
    const instances = await WorkflowInstance.find({ workflowId, status: 'in_progress' });
    const instanceUserIds = new Set();
    const userTasks = {}; // userId -> array of tasks

    instances.forEach(inst => {
      inst.currentNodes.forEach(node => {
        const ids = [];
        if (node.responsibleUser) ids.push(node.responsibleUser.toString());
        if (node.assignees) node.assignees.forEach(id => ids.push(id.toString()));

        ids.forEach(uid => {
          instanceUserIds.add(uid);
          if (!userTasks[uid]) userTasks[uid] = [];
          userTasks[uid].push({
            instanceId: inst._id,
            instanceTitle: inst.title,
            nodeId: node.nodeId,
            nodeLabel: workflow.nodes.find(n => n.id === node.nodeId)?.data?.label || 'Step',
            status: node.status,
            startedAt: node.startedAt
          });
        });
      });
    });

    // 3. Combine and Fetch User Details
    const allUserIds = Array.from(new Set([...templateUserIds, ...instanceUserIds]));
    const users = await User.find({ _id: { $in: allUserIds } }).select('name email role domain avatar');

    const members = users.map(user => {
      const uid = user._id.toString();
      return {
        ...user.toObject(),
        isTemplateMember: templateUserIds.has(uid),
        isActiveMember: instanceUserIds.has(uid),
        tasks: userTasks[uid] || []
      };
    });

    res.json({
      success: true,
      data: members
    });

  } catch (error) {
    console.error('❌ getWorkflowMembers Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
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

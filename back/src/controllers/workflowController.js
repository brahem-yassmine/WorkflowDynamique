// back/src/controllers/workflowController.js
const fs = require('fs');
const path = require('path');
const notificationController = require('./notificationController');
const { recordActivity } = require('../services/auditLogger');

// ============================================
// 1. LIST ALL WORKFLOWS
// ============================================
exports.getWorkflows = async (req, res) => {
  try {
    const { domain, status, projectId } = req.query;

    const Workflow = req.tenantConn.model('Workflow');
    const user = req.user;

    let query = {};

    // 1. Visibility for non-admin users
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      const domainsToMatch = [user.domain];
      if (user.domain === 'HR' || user.domain === 'RH') {
        domainsToMatch.push(user.domain === 'HR' ? 'RH' : 'HR');
      }
      query.domain = { $in: domainsToMatch };
    } else {
      if (projectId) query.projectId = projectId;
      if (domain) query.domain = domain;
    }

    if (status) query.status = status;

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
    const { name, description, domain, nodes, edges, projectId, status } = req.body;
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
        { id: startId, type: 'start', position: { x: 100, y: 100 }, data: { label: 'Start' } },
        { id: endId, type: 'end', position: { x: 100, y: 300 }, data: { label: 'End' } }
      ];
      workflowEdges = [
        { id: 'edge_' + Date.now(), source: startId, target: endId, type: 'default' }
      ];
    }

    const workflow = new Workflow({
      name,
      description: description || '',
      domain: workflowDomain,
      nodes: workflowNodes,
      edges: workflowEdges,
      status: status || 'draft',
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

    // 🚀 AUTOMATIC CHECKLIST GENERATION
    await _triggerAutomaticChecklist(req, workflow);

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
      role: { $ne: 'admin' }
    });

    for (const user of domainUsers) {
      if (user._id.toString() === req.user.id.toString()) continue;
      await notificationController.createInternalNotification(req.tenantConn, {
        recipient: user._id,
        title: 'New Workflow Template',
        message: `A new template "${name}" is available in the ${workflowDomain} department.`,
        type: 'workflow_created',
        link: `/User/Workflows`
      });
    }

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
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
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
      return res.status(404).json({ success: false, message: 'Workflow not found' });
    }

    const oldStatus = workflow.status;
    const newStatus = updates.status || oldStatus;

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

    Object.keys(updates).forEach(key => {
      if (key !== '_id') workflow[key] = updates[key];
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

    // 🚀 AUTOMATIC CHECKLIST SYNC
    await _triggerAutomaticChecklist(req, workflow);

    await recordActivity(req, 'UPDATE_WORKFLOW', {
      type: 'Workflow',
      id: workflow._id,
      name: workflow.name
    });

    // Trigger Notifications
    try {
      const UserModel = req.tenantConn.model('User');
      const workflowDomain = workflow.domain;
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

      const searchDomains = [workflowDomain];
      if (workflowDomain === 'HR' || workflowDomain === 'RH') searchDomains.push(workflowDomain === 'HR' ? 'RH' : 'HR');
      const domainUsers = await UserModel.find({ domain: { $in: searchDomains }, role: { $ne: 'admin' } });
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

    res.json({ success: true, message: 'Workflow updated', data: workflow });

  } catch (error) {
    console.error('❌ updateWorkflow Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
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
    const Checklist = req.tenantConn.model('Checklist');

    await WorkflowInstance.deleteMany({ workflowId });
    await Checklist.deleteMany({ workflowId });

    const workflow = await Workflow.findByIdAndDelete(workflowId);

    if (workflow) {
      await recordActivity(req, 'DELETE_WORKFLOW', {
        type: 'Workflow',
        id: workflow._id,
        name: workflow.name
      });

      // Notify Admins and Team
      try {
        const UserModel = req.tenantConn.model('User');
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
      } catch (notifErr) {}
    }

    if (!workflow) return res.status(404).json({ success: false, message: 'Workflow not found' });
    res.json({ success: true, message: 'Workflow deleted successfully' });

  } catch (error) {
    console.error('❌ deleteWorkflow Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
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

    if (!workflow) return res.status(404).json({ success: false, message: 'Workflow not found' });

    const instance = await _internalStartInstance(req.tenantConn, workflow, req.user, {
      title: req.body.title,
      description: req.body.description,
      priority: req.body.priority || 'medium',
      dueDate: req.body.dueDate,
      data: req.body.data
    });

    res.status(201).json({
      success: true,
      data: instance
    });

  } catch (error) {
    console.error('❌ executeWorkflow Error:', error);
    res.status(error.status || 500).json({ success: false, message: error.message || 'Server error' });
  }
};

/**
 * INTERNAL FUNCTION: Start a workflow execution instance
 */
async function _internalStartInstance(tenantConn, workflow, user, options = {}) {
  const WorkflowInstance = tenantConn.model('WorkflowInstance');
  const UserModel = tenantConn.model('User');
  const RoleModel = tenantConn.model('Role');

  const startNode = workflow.nodes.find(n => n.type === 'start');
  if (!startNode) throw new Error('Workflow has no start node');

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
        responsibleUser: selType === 'user' ? ids[0] : null,
        responsibleDomain: data.responsibleDomain || null,
        assignees: ids
      });
    }
  });

  const finalInitialNodes = initialNodes.length > 0 ? initialNodes : [{
    nodeId: startNode.id,
    status: 'in_progress',
    startedAt: new Date()
  }];

  const instance = new WorkflowInstance({
    workflowId: workflow._id,
    createdBy: user.id,
    title: options.title || `Instance: ${workflow.name}`,
    description: options.description || workflow.description,
    currentNodes: finalInitialNodes,
    variables: options.data || {},
    executionPath: [
      {
        nodeId: startNode.id,
        nodeType: 'start',
        action: 'completed',
        performedBy: user.id,
        timestamp: new Date()
      }
    ],
    status: 'in_progress',
    priority: options.priority || 'medium',
    dueDate: options.dueDate || null,
    timeStarted: new Date()
  });

  await instance.save();

  // Notifications
  try {
    for (const currentNode of instance.currentNodes) {
      const nodeDef = workflow.nodes.find(n => n.id === currentNode.nodeId);
      const targetUsers = new Set();
      if (currentNode.responsibleUser) targetUsers.add(currentNode.responsibleUser.toString());
      if (currentNode.assignees) currentNode.assignees.forEach(id => targetUsers.add(id.toString()));

      if (nodeDef?.data?.assigneeSelectionType === 'role' && currentNode.assignees?.length > 0) {
        const rolesMatching = await RoleModel.find({ _id: { $in: currentNode.assignees } });
        const roleNames = rolesMatching.map(r => r.name);
        const roleUsers = await UserModel.find({ $or: [{ role: { $in: roleNames } }, { role: { $in: currentNode.assignees.map(id => id.toString()) } }] });
        roleUsers.forEach(u => targetUsers.add(u._id.toString()));
      }

      for (const userId of targetUsers) {
        await notificationController.createInternalNotification(tenantConn, {
          recipient: userId,
          title: 'New Task Assigned',
          message: `Task "${nodeDef?.data?.label || 'Step'}" activated in "${instance.title}".`,
          type: 'task_assigned',
          link: `/Workflows/instances/${instance._id}`
        });
      }
    }
  } catch (err) {}

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

    if (!['draft', 'active', 'archived'].includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });

    const workflow = await Workflow.findByIdAndUpdate(workflowId, { status }, { new: true });
    if (!workflow) return res.status(404).json({ success: false, message: 'Workflow not found' });

    res.json({ success: true, data: workflow });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ============================================
// 10. GET WORKFLOW MEMBERS
// ============================================
exports.getWorkflowMembers = async (req, res) => {
  try {
    const { workflowId } = req.params;
    const Workflow = req.tenantConn.model('Workflow');
    const WorkflowInstance = req.tenantConn.model('WorkflowInstance');
    const User = req.tenantConn.model('User');

    const workflow = await Workflow.findById(workflowId);
    if (!workflow) return res.status(404).json({ success: false, message: 'Workflow not found' });

    const templateUserIds = new Set();
    workflow.nodes.forEach(node => {
      if (node.data?.assigneeIds) node.data.assigneeIds.forEach(id => templateUserIds.add(id.toString()));
      if (node.data?.assignedUser) templateUserIds.add(node.data.assignedUser.toString());
    });

    const instances = await WorkflowInstance.find({ workflowId, status: 'in_progress' });
    const instanceUserIds = new Set();
    instances.forEach(inst => inst.currentNodes.forEach(node => {
      if (node.responsibleUser) instanceUserIds.add(node.responsibleUser.toString());
      if (node.assignees) node.assignees.forEach(id => instanceUserIds.add(id.toString()));
    }));

    const allUserIds = Array.from(new Set([...templateUserIds, ...instanceUserIds]));
    const users = await User.find({ _id: { $in: allUserIds } }).select('name email role domain avatar firstName lastName');

    res.json({ success: true, data: users });
  } catch (error) {
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
    if (!original) return res.status(404).json({ success: false, message: 'Workflow not found' });

    const duplicate = new Workflow({
      name: `${original.name} (copy)`,
      description: original.description,
      domain: original.domain,
      nodes: original.nodes,
      edges: original.edges,
      status: 'draft',
      createdBy: req.user.id
    });

    await duplicate.save();
    await _triggerAutomaticChecklist(req, duplicate);

    res.status(201).json({ success: true, data: duplicate });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * PRIVATE HELPER: Automatically generates/syncs checklist
 */
async function _triggerAutomaticChecklist(req, workflow) {
  try {
    if (req.user?.role !== 'admin' && req.user?.role !== 'super_admin') return;
    const nodesToInclude = (workflow.nodes || []).filter(n => n.type === 'action' || n.type === 'condition');
    if (nodesToInclude.length === 0) return;

    const Checklist = req.tenantConn.model('Checklist');
    const checklistName = `Workflow: ${workflow.name}`;
    const checklistTasks = nodesToInclude.map(n => ({
      id: n.id,
      title: n.data?.label || (n.type === 'action' ? 'Task' : 'Condition'),
      completed: false,
      priority: 'medium'
    }));

    await Checklist.findOneAndUpdate(
      { name: checklistName },
      { tasks: checklistTasks, description: `Tracking for ${workflow.name}`, createdBy: req.user.id },
      { upsne: true, new: true, upsert: true }
    );
  } catch (error) {
    console.error('Checklist Generation Error:', error.message);
  }
}

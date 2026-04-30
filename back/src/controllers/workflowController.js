// back/src/controllers/workflowController.js
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const notificationController = require('./notificationController');
const { recordActivity } = require('../services/auditLogger');
const WorkflowEngine = require('../workflowEngine/WorkflowEngine');

// ============================================
// 1. LIST ALL WORKFLOWS
// ============================================
exports.getWorkflows = async (req, res) => {
  try {
    const { domainId, status, projectId, moduleId, isTemplate } = req.query;

    const Workflow = req.tenantConn.model('Workflow');
    const user = req.user;

    let query = {};

    // 1. Visibility for non-admin users (usually they only see ACTIVE project workflows or generic templates)
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      // Non-admin can only see things in their domain or assigned projects
      query.$or = [
        { domainId: user.domainId },
        { projectId: { $exists: true, $ne: null } },
        { createdBy: user.id }
      ];
    }

    // Apply specific filters if provided (Admins can filter by any, Users filter within their scope)
    if (projectId) query.projectId = projectId;
    if (moduleId) query.moduleId = moduleId;
    if (domainId) query.domainId = domainId;
    if (isTemplate !== undefined) query.isTemplate = isTemplate === 'true';
    if (status) query.status = status;
    else if (user.role !== 'admin' && user.role !== 'super_admin') query.status = 'active';

    console.log('🔍 [WorkflowCtrl] Querying workflows with:', query);

    const workflows = await Workflow.find(query)
      .populate('projectId', 'name')
      .populate('moduleId', 'name')
      .populate('domainId', 'name color')
      .sort({ createdAt: -1 });

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

    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(workflowId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Workflow ID format'
      });
    }

    console.log(`🔍 [WorkflowCtrl] Fetching workflow: ${workflowId} | TenantDB: ${req.tenantConn.name}`);

    const Workflow = req.tenantConn.model('Workflow');
    const workflow = await Workflow.findById(workflowId)
      .populate('projectId', 'name')
      .populate('moduleId', 'name');

    if (!workflow) {
      console.warn(`⚠️ [WorkflowCtrl] Workflow not found: ${workflowId} in DB: ${req.tenantConn.name}`);
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
    const { name, description, domain, domainId, nodes, edges, projectId, moduleId, status, isTemplate } = req.body;

    if (!req.tenantConn) {
      return res.status(400).json({ success: false, message: 'Tenant environment not resolved' });
    }

    const Workflow = req.tenantConn.model('Workflow');

    // ID Validation
    if (domainId && !mongoose.Types.ObjectId.isValid(domainId)) {
      return res.status(400).json({ success: false, message: 'Invalid Domain ID format' });
    }
    if (projectId && !mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ success: false, message: 'Invalid Project ID format' });
    }
    if (moduleId && !mongoose.Types.ObjectId.isValid(moduleId)) {
      return res.status(400).json({ success: false, message: 'Invalid Module ID format' });
    }

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Name is required'
      });
    }

    if (!isTemplate && (!projectId || !domainId)) {
      return res.status(400).json({
        success: false,
        message: 'Un workflow doit être lié à un projet et un domaine.'
      });
    }

    if (isTemplate && (!moduleId || !domainId)) {
      return res.status(400).json({
        success: false,
        message: 'Un template de workflow doit être lié à un module et un domaine.'
      });
    }

    if (!isTemplate && (!projectId || !domainId)) {
      return res.status(400).json({
        success: false,
        message: 'Un workflow doit être lié à un projet et un domaine.'
      });
    }

    if (isTemplate && (!moduleId || !domainId)) {
      return res.status(400).json({
        success: false,
        message: 'Un template de workflow doit être lié à un module et un domaine.'
      });
    }

    const currentUserId = req.user.id || req.user.userId || req.user._id;
    const workflowDomain = domain || req.user.domain || "General";
    let workflowNodes = nodes || [];
    let workflowEdges = edges || [];

    // Validation: Exactly 2 validators for Multi-Validation
    for (const node of workflowNodes) {
      if (node.data?.validationType === 'multi') {
        const vIds = node.data.validatorIds || [];
        if (vIds.length !== 2) {
          return res.status(400).json({
            success: false,
            message: `Consensus (Multi) validation strategy on node "${node.data?.label || node.id}" requires exactly 2 validators.`
          });
        }
      }
    }

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
      domainId: domainId || req.user.domainId,
      nodes: workflowNodes,
      edges: workflowEdges,
      status: status || 'draft',
      isTemplate: isTemplate || false,
      projectId: projectId || null,
      moduleId: moduleId || null,
      createdBy: currentUserId
    });

    await workflow.save();

    // IF status is active, automatically start an instance
    if (workflow.status === 'active') {
      try {
        const engine = new WorkflowEngine(req.tenantConn);
        await engine.start(workflow._id, currentUserId, `Auto-start: ${workflow.name}`, {});
      } catch (execErr) {
        console.error('❌ Auto-start failed during creation:', execErr.message);
      }
    }

    // 🚀 AUTOMATIC CHECKLIST GENERATION
    await _triggerAutomaticChecklist(req, workflow);

    // Notifications Guard
    try {
      // Trigger Notification for Admins
      const UserModel = req.tenantConn.model('User');
      const admins = await UserModel.find({ role: 'admin' });
      for (const admin of admins) {
        const adminId = admin._id.toString();
        if (adminId === currentUserId?.toString()) continue;

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
        const uId = user._id.toString();
        if (uId === currentUserId?.toString()) continue;

        await notificationController.createInternalNotification(req.tenantConn, {
          recipient: user._id,
          title: 'New Workflow Template',
          message: `A new template "${name}" is available in the ${workflowDomain} department.`,
          type: 'workflow_created',
          link: `/User/Workflows`
        });
      }
    } catch (notifErr) {
      console.warn('⚠️ [WorkflowCtrl] Notification failure (ignored):', notifErr.message);
    }

    await recordActivity(req, 'WORKFLOW_CREATE', {
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
      return res.status(400).json({
        success: false,
        message: 'Validation failed: ' + Object.values(error.errors).map((e) => e.message).join(', ')
      });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: `Data mapping error: Invalid ${error.path}` });
    }
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

    if (!req.tenantConn) {
      return res.status(400).json({ success: false, message: 'Tenant environment not resolved' });
    }

    if (!mongoose.Types.ObjectId.isValid(workflowId)) {
      return res.status(400).json({ success: false, message: 'Invalid Workflow ID format' });
    }

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

    // Validation: Exactly 2 validators for Multi-Validation
    if (updates.nodes) {
      for (const node of updates.nodes) {
        if (node.data?.validationType === 'multi') {
          const vIds = node.data.validatorIds || [];
          if (vIds.length !== 2) {
            return res.status(400).json({
              success: false,
              message: `Consensus (Multi) validation strategy on node "${node.data?.label || node.id}" requires exactly 2 validators.`
            });
          }
        }
      }
    }

    Object.keys(updates).forEach(key => {
      if (key !== '_id') workflow[key] = updates[key];
    });

    // Ensure Mongoose detects changes in nodes/edges arrays
    if (updates.nodes) workflow.markModified('nodes');
    if (updates.edges) workflow.markModified('edges');

    await workflow.save();

    // ⚡ PROXIMITY SYNC: Update all active instances to reflect new node assignments/data
    if (updates.nodes) {
      await _syncActiveInstances(req.tenantConn, workflow);
    }

    // IF status becomes active, automatically start an instance (only if it was draft)
    if (newStatus === 'active' && oldStatus === 'draft') {
      try {
        const engine = new WorkflowEngine(req.tenantConn);
        await engine.start(workflow._id, req.user.id, `Auto-start: ${workflow.name}`, {});
      } catch (execErr) {
        console.error('❌ Auto-start failed during update:', execErr.message);
      }
    }

    // 🚀 AUTOMATIC CHECKLIST SYNC
    await _triggerAutomaticChecklist(req, workflow);

    await recordActivity(req, 'WORKFLOW_EDIT', {
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
        const adminId = admin._id.toString();
        if (adminId === currentUserId?.toString()) continue;
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
        const uId = user._id.toString();
        if (uId === currentUserId?.toString()) continue;
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
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation failed: ' + Object.values(error.errors).map((e) => e.message).join(', ')
      });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: `Data mapping error: Invalid ${error.path}` });
    }
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
      await recordActivity(req, 'WORKFLOW_DELETE', {
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
      } catch (notifErr) { }
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
    console.log(`📡 [WorkflowCtrl] Execute request received for workflow: ${workflowId}`);
    const Workflow = req.tenantConn.model('Workflow');
    const workflow = await Workflow.findById(workflowId);

    if (!workflow) return res.status(404).json({ success: false, message: 'Workflow not found' });

    const engine = new WorkflowEngine(req.tenantConn);
    const currentUserId = req.user.id || req.user.userId || req.user._id;
    const instance = await engine.start(workflow._id, currentUserId, req.body.title || `Instance: ${workflow.name}`, req.body.data || {});
    
    if (req.body.priority) instance.priority = req.body.priority;
    if (req.body.dueDate) instance.dueDate = req.body.dueDate;
    await instance.save();

    res.status(201).json({
      success: true,
      data: instance
    });

  } catch (error) {
    console.error('❌ executeWorkflow Error:', error);
    res.status(error.status || 500).json({ success: false, message: error.message || 'Server error' });
  }
};

// Removed deprecated _internalStartInstance

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
    const Role = req.tenantConn.model('Role');
    const Domain = req.tenantConn.model('Domain');

    const workflow = await Workflow.findById(workflowId);
    if (!workflow) return res.status(404).json({ success: false, message: 'Workflow not found' });

    const templateUserIds = new Set();
    const templateRoleNames = new Set();
    const templateDomainNames = new Set();

    const directUserTasksMap = {};
    const roleTasksMap = {};
    const domainTasksMap = {};

    const addTaskToSet = (map, key, taskName) => {
      if (!key || !taskName) return;
      if (!map[key]) map[key] = new Set();
      map[key].add(taskName);
    };

    for (const node of workflow.nodes) {
      const taskName = node.data?.label || 'Unnamed Task';

      if (node.data?.assigneeIds) {
        node.data.assigneeIds.forEach(id => {
          templateUserIds.add(id.toString());
          addTaskToSet(directUserTasksMap, id.toString(), taskName);
        });
      }
      if (node.data?.assignedUser) {
        templateUserIds.add(node.data.assignedUser.toString());
        addTaskToSet(directUserTasksMap, node.data.assignedUser.toString(), taskName);
      }

      const assignedTo = node.data?.assignedTo;
      if (assignedTo && assignedTo.length === 24) {
        const domainObj = await Domain.findById(assignedTo);
        if (domainObj) {
          templateDomainNames.add(domainObj.name);
          addTaskToSet(domainTasksMap, domainObj.name, taskName);
        } else {
          const roleObj = await Role.findById(assignedTo);
          if (roleObj) {
            templateRoleNames.add(roleObj.name);
            addTaskToSet(roleTasksMap, roleObj.name, taskName);
          } else {
            templateUserIds.add(assignedTo.toString());
            addTaskToSet(directUserTasksMap, assignedTo.toString(), taskName);
          }
        }
      } else if (assignedTo) {
        templateDomainNames.add(assignedTo);
        addTaskToSet(domainTasksMap, assignedTo, taskName);
      }
    }

    const instances = await WorkflowInstance.find({ workflowId, status: 'in_progress' });
    const instanceUserIds = new Set();
    instances.forEach(inst => inst.currentNodes.forEach(node => {
      const taskName = (node.label || 'Unnamed Task') + ' (Active)';
      if (node.responsibleUser) {
        instanceUserIds.add(node.responsibleUser.toString());
        addTaskToSet(directUserTasksMap, node.responsibleUser.toString(), taskName);
      }
      if (node.assignees) node.assignees.forEach(id => {
        instanceUserIds.add(id.toString());
        addTaskToSet(directUserTasksMap, id.toString(), taskName);
      });
    }));

    const allUserIds = Array.from(new Set([...templateUserIds, ...instanceUserIds]));

    let query = { $or: [] };
    if (allUserIds.length > 0) query.$or.push({ _id: { $in: allUserIds } });
    if (templateRoleNames.size > 0) query.$or.push({ role: { $in: Array.from(templateRoleNames) } });
    if (templateDomainNames.size > 0) query.$or.push({ domain: { $in: Array.from(templateDomainNames) } });

    let users = [];
    if (query.$or.length > 0) {
      users = await User.find(query).select('name email role domain avatar firstName lastName tasks');
    }

    const formattedUsers = users.map(u => {
      const uId = u._id.toString();
      const usersTasks = new Set();
      if (directUserTasksMap[uId]) directUserTasksMap[uId].forEach(t => usersTasks.add(t));
      if (u.role && roleTasksMap[u.role]) roleTasksMap[u.role].forEach(t => usersTasks.add(t));
      if (u.domain && domainTasksMap[u.domain]) domainTasksMap[u.domain].forEach(t => usersTasks.add(t));

      return {
        ...u.toObject(),
        tasks: u.tasks || [],
        assignedTasks: Array.from(usersTasks),
        isTemplateMember: allUserIds.includes(uId) ||
          (u.role && templateRoleNames.has(u.role)) ||
          (u.domain && templateDomainNames.has(u.domain)),
        isActiveMember: instanceUserIds.has(uId)
      };
    });

    res.json({ success: true, data: formattedUsers });
  } catch (error) {
    console.error("getWorkflowMembers Error:", error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ============================================
// 8. DUPLICATE WORKFLOW (Safe Cloning)
// ============================================
exports.duplicateWorkflow = async (req, res) => {
  try {
    const { workflowId } = req.params;
    const { projectId, name } = req.body; // If projectId provided, it's a "Clone to Project"

    const Workflow = req.tenantConn.model('Workflow');
    const original = await Workflow.findById(workflowId).lean();
    if (!original) return res.status(404).json({ success: false, message: 'Workflow not found' });

    // SAFE CLONING LOGIC: Regenerate all IDs for nodes and edges
    const nodeMap = {}; // oldId -> newId
    const newNodes = (original.nodes || []).map(node => {
      const newId = `node_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;
      nodeMap[node.id] = newId;
      const { _id, ...restNode } = node;
      return {
        ...restNode,
        id: newId,
        // If it's a clone for a project, we keep the internal data as is (Isolated)
      };
    });

    const newEdges = (original.edges || []).map(edge => {
      const { _id, ...restEdge } = edge;
      return {
        ...restEdge,
        id: `edge_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`,
        source: nodeMap[edge.source] || edge.source,
        target: nodeMap[edge.target] || edge.target
      };
    });

    const isCreatingTemplate = projectId ? false : original.isTemplate;
    const targetProjectId = projectId || original.projectId;

    const duplicate = new Workflow({
      name: name || `${original.name} (copy)`,
      description: original.description,
      domainId: original.domainId,
      nodes: newNodes,
      edges: newEdges,
      status: 'draft',
      isTemplate: isCreatingTemplate,
      templateId: original.isTemplate ? original._id : original.templateId,
      projectId: targetProjectId,
      moduleId: original.moduleId,
      createdBy: req.user.id || req.user.userId || req.user._id
    });

    await duplicate.save();

    // Automatically generates/syncs checklist for the new copy
    await _triggerAutomaticChecklist(req, duplicate);

    await recordActivity(req, projectId ? 'CLONE_WORKFLOW_TO_PROJECT' : 'DUPLICATE_WORKFLOW', {
      type: 'Workflow',
      id: duplicate._id,
      originalId: original._id,
      projectId: projectId || null
    });

    res.status(201).json({
      success: true,
      message: projectId ? 'Template cloned to project successfully' : 'Workflow duplicated successfully',
      data: duplicate
    });
  } catch (error) {
    console.error('❌ duplicateWorkflow Error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

/**
 * PRIVATE HELPER: Syncs all active instances of a workflow with the new definition
 * (Mainly updates assignments and node data for active nodes)
 */
async function _syncActiveInstances(tenantConn, workflow) {
  try {
    const WorkflowInstance = tenantConn.model('WorkflowInstance');
    const UserModel = tenantConn.model('User');
    const DomainModel = tenantConn.model('Domain');
    const RoleModel = tenantConn.model('Role');

    const instances = await WorkflowInstance.find({
      workflowId: workflow._id,
      status: 'in_progress'
    });

    if (instances.length === 0) return;

    console.log(`🔄 [Sync] Synchronizing ${instances.length} active instances for workflow: ${workflow.name}`);

    for (const instance of instances) {
      let changed = false;

      if (instance.currentNodes && Array.isArray(instance.currentNodes)) {
        for (const currentNode of instance.currentNodes) {
          // Find corresponding node in the NEW definition
          const nodeDef = workflow.nodes.find(n => n.id === currentNode.nodeId);
          if (nodeDef && nodeDef.data) {
            const data = nodeDef.data;
            const assignmentType = data.assignmentType || 'SINGLE';
            const assignedId = data.assignedTo || data.assignedUser;

            // Update assignment fields if they differ or to ensure consistency
            // Note: We only update if the instance node is still 'in_progress' or 'pending'
            if (['in_progress', 'pending'].includes(currentNode.status)) {

              // 1. Identification logic (matches processNodeTransition in WorkflowInstanceController)
              let responsibleUser = null;
              let responsibleDomain = data.responsibleDomain || data.domain || null;
              let nodeAssignees = data.assigneeIds || data.validatorIds || [];

              if (assignmentType === 'SINGLE' && assignedId && mongoose.Types.ObjectId.isValid(assignedId)) {
                const domMaybe = await DomainModel.findById(assignedId);
                if (domMaybe) {
                  responsibleDomain = domMaybe.name;
                } else {
                  const roleMaybe = await RoleModel.findById(assignedId);
                  if (roleMaybe) responsibleDomain = roleMaybe.name;
                  else responsibleUser = assignedId;
                }
              } else if (assignmentType === 'ALL' && assignedId) {
                nodeAssignees = (Array.isArray(assignedId) ? assignedId : [assignedId]);
              } else if (assignedId && mongoose.Types.ObjectId.isValid(assignedId)) {
                // ANY/ALL with ID
                const domMaybe = await DomainModel.findById(assignedId) || await RoleModel.findById(assignedId);
                if (domMaybe) {
                  responsibleDomain = domMaybe.name;
                } else {
                  // User ID
                  if (!nodeAssignees.map(id => id.toString()).includes(assignedId.toString())) {
                    nodeAssignees.push(new mongoose.Types.ObjectId(assignedId));
                  }
                }
              } else {
                responsibleUser = data.assignedUser || (data.assigneeSelectionType === 'user' ? (data.assigneeIds?.[0]) : null);
                responsibleDomain = data.responsibleDomain || data.domain || assignedId;
              }

              // Final resolution for domain names if stored as IDs
              if (responsibleDomain && mongoose.Types.ObjectId.isValid(responsibleDomain)) {
                const domObj = await DomainModel.findById(responsibleDomain) || await RoleModel.findById(responsibleDomain);
                if (domObj) responsibleDomain = domObj.name;
              }

              // Apply updates to the instance node
              currentNode.responsibleUser = responsibleUser;
              currentNode.responsibleDomain = responsibleDomain;
              currentNode.assignees = nodeAssignees;
              currentNode.restrictedDomain = data.restrictedDomain || null;
              currentNode.deadline = data.deadline ? new Date(data.deadline) : currentNode.deadline;

              changed = true;
            }
          }
        }
      }

      if (changed) {
        instance.markModified('currentNodes');
        await instance.save();
      }
    }
  } catch (error) {
    console.error('❌ [Sync] Active Instances Sync Error:', error.message);
  }
}

/**
 * PRIVATE HELPER: Automatically generates/syncs checklist
 */
async function _triggerAutomaticChecklist(req, workflow) {
  try {
    // Automated checklist for all users creating templates

    // Include actions and conditions as checklist items
    const nodesToInclude = (workflow.nodes || []).filter(n =>
      n.type === 'action' || n.type === 'condition' || n.type === 'task'
    );

    if (nodesToInclude.length === 0) return;

    const Checklist = req.tenantConn.model('Checklist');

    // Use a unique identifier or name for the template's checklist
    const checklistName = `Workflow: ${workflow.name}`;

    const checklistTasks = nodesToInclude.map(n => ({
      id: n.id,
      title: n.data?.label || (n.type === 'action' ? 'Task' : n.type === 'condition' ? 'Condition' : 'Step'),
      completed: false,
      priority: n.data?.priority || 'medium'
    }));

    await Checklist.findOneAndUpdate(
      { workflowId: workflow._id }, // Better to find by workflowId than name
      {
        name: checklistName,
        tasks: checklistTasks,
        description: `Automated checklist for workflow "${workflow.name}"`,
        createdBy: req.user.id || req.user.userId || req.user._id,
        workflowId: workflow._id
      },
      { new: true, upsert: true }
    );

    console.log(`✅ Automatic checklist for workflow: ${workflow.name} (ID: ${workflow._id})`);
  } catch (error) {
    console.error('❌ Automatic Checklist Generation Error:', error.message);
  }
}

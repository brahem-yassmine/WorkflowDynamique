const mongoose = require('mongoose');
const notificationController = require('./notificationController');
const fs = require('fs');
const path = require('path');


// back/src/controllers/workflowInstanceController.js
// ❌ REMOVE these imports
// const WorkflowInstance = require('../models/WorkflowInstance');
// const Workflow = require('../models/Workflow');
// const User = require('../models/User');

// 1. CREATE WORKFLOW INSTANCE
exports.createInstance = async (req, res) => {
  try {
    const { workflowId, title, description, data, priority, dueDate, tags } = req.body;

    const Workflow = req.tenantConn.model('Workflow');
    const WorkflowInstance = req.tenantConn.model('WorkflowInstance');

    if (!workflowId || !title) {
      return res.status(400).json({ success: false, message: 'Workflow ID and title are required' });
    }

    const workflow = await Workflow.findById(workflowId);
    if (!workflow) {
      return res.status(404).json({ success: false, message: 'Workflow not found' });
    }

    const startNode = workflow.nodes.find(n => n.type === 'start');
    if (!startNode) {
      return res.status(400).json({ success: false, message: 'Workflow has no start node' });
    }

    const UserModel = req.tenantConn.model('User');
    let startAssignees = startNode.data?.assigneeIds || [];

    // If ALL department members must validate
    if (startNode.data?.assignmentType === 'ALL' && (startNode.data?.assignedTo || startNode.data?.responsibleDomain)) {
      const dName = startNode.data?.responsibleDomain || (await req.tenantConn.model('Domain').findById(startNode.data?.assignedTo))?.name;
      if (dName) {
        const isGlobal = ['GLOBAL', 'ALL', 'PUBLIC'].includes(dName.toUpperCase());
        const domainUsers = isGlobal ? await UserModel.find({}) : await UserModel.find({ domain: dName });
        startAssignees = domainUsers.map(u => u._id);
      }
    }

      const node1Data = startNode.data || {};
      let respUser = null;
      let respDomain = node1Data.responsibleDomain || node1Data.domain;
      const assignedId1 = node1Data.assignedTo;

      if (node1Data.assignmentType === 'SINGLE' && node1Data.assigneeSelectionType === 'user') {
        respUser = assignedId1;
      } else if (node1Data.assigneeSelectionType === 'role' && assignedId1) {
        if (mongoose.Types.ObjectId.isValid(assignedId1)) {
          const roleObj = await req.tenantConn.model('Role').findById(assignedId1);
          if (roleObj) respDomain = roleObj.name;
          else respDomain = assignedId1;
        } else {
          respDomain = assignedId1;
        }
      }

      // Final fallback for domain ID resolution
      if (respDomain && mongoose.Types.ObjectId.isValid(respDomain)) {
        const domainObj = await req.tenantConn.model('Domain').findById(respDomain) || await req.tenantConn.model('Role').findById(respDomain);
        if (domainObj) respDomain = domainObj.name;
      }

      const instance = new WorkflowInstance({
        workflowId: workflow._id,
        createdBy: req.user.id,
        title,
        description: description || workflow.description,
        currentNodes: [{
          nodeId: startNode.id,
          status: 'in_progress',
          startedAt: new Date(),
          responsibleUser: respUser,
          responsibleDomain: respDomain,
          assignees: startAssignees
        }],
      variables: data || {},
      executionPath: [{
        nodeId: startNode.id,
        nodeType: 'start',
        action: 'start',
        performedBy: req.user.id,
        comments: 'Workflow démarré',
        timestamp: new Date()
      }],
      status: 'in_progress',
      priority: priority || 'medium',
      dueDate: dueDate || null,
      tags: tags || [],
      timeStarted: new Date(),
      history: [{
        action: 'instance_created',
        title: 'Démarrage',
        performedBy: req.user.id,
        comments: 'Instance de workflow créée'
      }]
    });

    // Create associated checklist
    const Checklist = req.tenantConn.model('Checklist');
    const checklistTasks = workflow.nodes
      .filter(node => node.type === 'action' || node.type === 'condition' || node.type === 'task')
      .map(node => ({
        id: node.id,
        title: node.data?.label || (node.type === 'action' ? 'Task' : node.type === 'condition' ? 'Condition' : 'Step'),
        completed: false,
        priority: node.data?.priority || 'medium'
      }));

    const checklist = new Checklist({
      name: `Checklist: ${title}`,
      description: `Auto-generated for workflow instance: ${title}`,
      tasks: checklistTasks,
      createdBy: req.user.id,
      status: 'draft',
      instanceId: instance._id,
      workflowId: workflow._id
    });

    await checklist.save();
    instance.checklistId = checklist._id;

    // 🔥 AUTO-PROGRESS: Transition immediately from START node to the first REAL task(s)
    await processNodeTransition(req, instance, workflow, startNode.id);
    
    // Explicitly set instance status if it was changed by transition logic
    if (instance.currentNodes.length > 0) instance.status = 'in_progress';

    await instance.save();

    // Notification logic
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
            { role: { $in: roleNames } }, // Match by system role name
            { role: { $in: currentNode.assignees.map(id => id.toString()) } }, // Match by direct role ID string
            { specificRole: { $in: roleNames } }, // Match by business role name
            { specificRoleId: { $in: currentNode.assignees } } // Match by business role ID
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

      // 2. Notify by Domain/Department
      if (currentNode.responsibleDomain) {
        const domain = currentNode.responsibleDomain;
        const isGlobal = ['GLOBAL', 'ALL', 'PUBLIC'].includes(domain.toUpperCase());
        
        let domainUsers;
        if (isGlobal) {
          domainUsers = await UserModel.find({});
        } else {
          const searchDomains = [domain];
          if (domain.toUpperCase() === 'HR' || domain.toUpperCase() === 'RH') {
            searchDomains.push('RH', 'HR', 'rh', 'hr');
          }
          domainUsers = await UserModel.find({ domain: { $in: searchDomains } });
        }

        for (const user of domainUsers) {
          if (targetUsers.has(user._id.toString())) continue;

          await notificationController.createInternalNotification(req.tenantConn, {
            recipient: user._id,
            title: isGlobal ? 'Global Task Broadcast' : 'New Department Task',
            message: isGlobal ? `A mandatory task for everyone is available in "${instance.title}".` : `A new task for the ${domain} department is available in "${instance.title}".`,
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

    await instance.populate([
      { path: 'workflowId', select: 'name description' },
      { path: 'createdBy', select: 'email firstName lastName' }
    ]);

    res.status(201).json({ success: true, message: 'Workflow instance created', data: instance });
  } catch (error) {
    console.error('❌ createInstance Error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// 2. LIST INSTANCES
exports.getInstances = async (req, res) => {
  try {
    const { status, workflowId, priority, createdBy, responsibleUser, responsibleDomain, page = 1, limit = 50 } = req.query;
    const WorkflowInstance = req.tenantConn.model('WorkflowInstance');
    const query = {};

    if (workflowId && mongoose.Types.ObjectId.isValid(workflowId)) {
      query.workflowId = new mongoose.Types.ObjectId(workflowId);
    } else if (workflowId) {
      query.workflowId = workflowId; // Fallback
    }

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (createdBy && mongoose.Types.ObjectId.isValid(createdBy)) {
      query.createdBy = new mongoose.Types.ObjectId(createdBy);
    } else if (createdBy) {
      query.createdBy = createdBy;
    }

    const user = req.user || {};
    const isAdmin = (user.role?.toLowerCase() === 'admin' || user.role?.toLowerCase() === 'super_admin');

    // 1. Visibility Logic
    if (!isAdmin) {

      const domainsToMatch = [user.domain];
      if (user.domain === 'HR' || user.domain === 'RH') {
        domainsToMatch.push(user.domain === 'HR' ? 'RH' : 'HR');
      }
      if (user.specificRole) {
        domainsToMatch.push(user.specificRole);
        domainsToMatch.push(user.specificRole.toUpperCase());
      }

      const globalKeywords = ['GLOBAL', 'ALL', 'PUBLIC', 'TOUS', 'EVERYONE'];

      // Core Visibility: Show if locked by ME OR not locked by anyone (and I have access)
      query.$or = [
        // Tasks locked by ME
        { 'currentNodes.responsibleUser': user.id },

        // Tasks NOT locked by anyone yet, but I am in the domain/assignees
        {
          $and: [
            { 'currentNodes.responsibleUser': { $in: [null, undefined] } },
            {
              $or: [
                { 'currentNodes.responsibleDomain': { $in: domainsToMatch } },
                { 'currentNodes.responsibleDomain': { $in: globalKeywords } },
                { 'currentNodes.responsibleDomain': { $in: globalKeywords.map(k => k.toLowerCase()) } },
                { 'currentNodes.assignees': (user.id && mongoose.Types.ObjectId.isValid(user.id)) ? user.id : undefined }
              ]
            }
          ]
        }
      ];

      // specificRoleId check
      if (user.specificRoleId && mongoose.Types.ObjectId.isValid(user.specificRoleId)) {
        query.$or.push({
          $and: [
            { 'currentNodes.responsibleUser': { $in: [null, undefined, user.id] } },
            { 'currentNodes.assignees': user.specificRoleId }
          ]
        });
      }
    } else {
      // For Admins: Can see everything, but respect specific filters if provided in query
      if (responsibleUser) query['currentNodes.responsibleUser'] = responsibleUser;
      if (responsibleDomain) query['currentNodes.responsibleDomain'] = responsibleDomain;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    console.log(`🔍 [InstanceCtrl.getInstances] Final Executing Data Query:`, JSON.stringify(query));
    
    const [instances, total] = await Promise.all([
      WorkflowInstance.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate({
          path: 'workflowId',
          select: 'name description domain projectId nodes edges',
          populate: { path: 'projectId', select: 'name' }
        })
        .populate('createdBy', 'email firstName lastName'),
      WorkflowInstance.countDocuments(query)
    ]);

    console.log(`✅ [InstanceCtrl.getInstances] Found ${instances.length} instances in database for query.`);

    res.json({
      success: true,
      count: instances.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: instances
    });
  } catch (error) {
    console.error('❌ getInstances Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// 3. GET INSTANCE BY ID
exports.getInstanceById = async (req, res) => {
  try {
    const { instanceId } = req.params;
    console.log(`🔍 [InstanceCtrl] Fetching instance: ${instanceId} | TenantDB: ${req.tenantConn.name}`);
    
    if (!mongoose.Types.ObjectId.isValid(instanceId)) {
      console.warn(`⚠️ [InstanceCtrl] Invalid instanceId format: ${instanceId}`);
      return res.status(400).json({ success: false, message: 'Invalid Instance ID format' });
    }

    const WorkflowInstance = req.tenantConn.model('WorkflowInstance');

    const instance = await WorkflowInstance.findById(instanceId)
      .populate('workflowId')
      .populate('createdBy', 'email firstName lastName')
      .populate('history.performedBy', 'email firstName lastName');

    if (!instance) {
      console.warn(`⚠️ [InstanceCtrl] Instance not found: ${instanceId} in DB: ${req.tenantConn.name}`);
      return res.status(404).json({ success: false, message: 'Instance not found' });
    }

    if (!instance.workflowId) {
      console.error(`❌ [InstanceCtrl] Instance ${instanceId} has no associated workflow definition!`);
    }

    res.json({ success: true, data: instance });
  } catch (error) {
    console.error('❌ getInstanceById Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// 4. APPROVE STEP (NODE TRANSITION)
exports.approveNode = async (req, res) => {
  try {
    const { instanceId } = req.params;
    const { nodeId, comments, data } = req.body;

    const WorkflowInstance = req.tenantConn.model('WorkflowInstance');
    const Workflow = req.tenantConn.model('Workflow');
    const instance = await WorkflowInstance.findById(instanceId);
    if (!instance) return res.status(404).json({ success: false, message: 'Instance not found' });
    if (instance.status !== 'in_progress') return res.status(400).json({ success: false, message: 'Instance not active' });

    const currentNodeIndex = instance.currentNodes.findIndex(n => n.nodeId === nodeId && n.status === 'in_progress');
    if (currentNodeIndex === -1) return res.status(400).json({ success: false, message: 'This node is not active' });
    const nodeEntry = instance.currentNodes[currentNodeIndex];

    const workflow = await Workflow.findById(instance.workflowId);
    if (!workflow) throw new Error('Workflow definition not found');

    const nodeData = workflow.nodes.find(n => n.id === nodeId)?.data || {};
    const assignmentType = nodeData.assignmentType || 'SINGLE';

    // ⛔ Handle LOCK Logic for "ANY"
    if (assignmentType === 'ANY' && nodeEntry.responsibleUser && nodeEntry.responsibleUser.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only the user who locked this task can complete it' });
    }

    // ✅ Handle Consensus Logic for "ALL"
    if (assignmentType === 'ALL') {
      if (!nodeEntry.approvedBy) nodeEntry.approvedBy = [];
      if (!nodeEntry.approvedBy.includes(req.user.id)) {
        nodeEntry.approvedBy.push(req.user.id);
      }

      // We need to check if everyone in assignees approved.
      // NOTE: assignees should be populated with direct IDs when node entry is created for departments
      const allApproved = nodeEntry.assignees.every(id => nodeEntry.approvedBy.includes(id.toString()));

      if (!allApproved) {
        // NOT everyone has finished yet, just save and return
        instance.history.push({
          nodeId: nodeId, // Useful to filter
          action: 'partial_approval',
          title: `Approbation partielle`,
          performedBy: req.user.id,
          comments: comments || '',
          data: data
        });
        await instance.save();
        return res.json({
          success: true,
          message: 'Approval recorded. Waiting for other team members.',
          data: instance,
          waitingForConsensus: true
        });
      }
    }

    // If we reach here, either it's SINGLE/ANY or it's ALL and everyone approved
    instance.currentNodes.splice(currentNodeIndex, 1);

    if (data) {
      for (const [key, value] of Object.entries(data)) {
        instance.variables.set(key, value);
      }
    }

    instance.executionPath.push({
      nodeId: nodeId,
      nodeType: 'action',
      action: 'approved',
      performedBy: req.user.id,
      comments: comments || '',
      timestamp: new Date(),
      outputData: data
    });

    instance.history.push({
      nodeId: nodeId,
      action: 'step_approved',
      title: `Étape validée`,
      performedBy: req.user.id,
      comments: comments || '',
      data: data
    });

    // 🔍 Trigger transitions to next nodes
    await processNodeTransition(req, instance, workflow, nodeId);

    // After transition, check if the workflow is now finished
    const isFlowFinished = instance.status === 'completed' || instance.currentNodes.length === 0;

    if (isFlowFinished) {
      if (instance.status !== 'completed') {
        instance.status = 'completed';
        instance.timeCompleted = new Date();
        instance.history.push({
          action: 'workflow_completed',
          title: 'Terminé',
          performedBy: req.user.id,
          comments: 'Workflow terminé avec succès'
        });
      }
    }

    await instance.save();

    // Update associated checklist task
    if (instance.checklistId) {
      try {
        const ChecklistModel = req.tenantConn.model('Checklist');
        const checklist = await ChecklistModel.findById(instance.checklistId);
        if (checklist) {
          const taskIndex = checklist.tasks.findIndex(t => t.id === nodeId);
          if (taskIndex !== -1) {
            checklist.tasks[taskIndex].completed = true;
            if (isFlowFinished) {
              checklist.status = 'completed';
            }
            await checklist.save();
          }
        }
      } catch (err) {
        console.error('Checklist Sync Error:', err);
      }
    }

    // Notifications
    try {
      if (isFlowFinished) {
        await notificationController.createInternalNotification(req.tenantConn, {
          recipient: instance.createdBy,
          title: 'Workflow Completed',
          message: `Your process "${instance.title}" finished successfully.`,
          type: 'workflow_completed',
          link: `/Workflows/instances/${instance._id}`
        });
      } else {
        const UserModel = req.tenantConn.model('User');
        // Only notify for nodes that were JUST activated (still have startedAt close to now)
        const recentTime = new Date(Date.now() - 5000); // 5 seconds grace
        
        for (const newNode of instance.currentNodes) {
          if (newNode.status !== 'in_progress' || newNode.startedAt < recentTime) continue;

          // Find node data from workflow
          const nodeData = workflow.nodes.find(n => n.id === newNode.nodeId)?.data || {};

          // Identify all users to notify
          const targetUsers = new Set();
          if (newNode.responsibleUser) targetUsers.add(newNode.responsibleUser.toString());
          if (newNode.assignees && nodeData.assigneeSelectionType === 'user') {
            newNode.assignees.forEach(id => targetUsers.add(id.toString()));
          }

          if (nodeData.assigneeSelectionType === 'role' && newNode.assignees?.length > 0) {
            const RoleModel = req.tenantConn.model('Role');
            const rolesMatching = await RoleModel.find({ _id: { $in: newNode.assignees } });
            const roleNames = rolesMatching.map(r => r.name);

            const roleUsers = await UserModel.find({
              $or: [
                { role: { $in: roleNames } },
                { role: { $in: newNode.assignees.map(id => id.toString()) } },
                { specificRole: { $in: roleNames } },
                { specificRoleId: { $in: newNode.assignees } }
              ]
            });
            roleUsers.forEach(u => targetUsers.add(u._id.toString()));
          }

          for (const userId of targetUsers) {
            await notificationController.createInternalNotification(req.tenantConn, {
              recipient: userId,
              title: 'New Task Assigned',
              message: `Task "${nodeData.label || 'Step'}" requires your attention in "${instance.title}".`,
              type: 'task_assigned',
              link: `/Workflows/instances/${instance._id}`
            });
          }

          if (newNode.responsibleDomain) {
            const domain = newNode.responsibleDomain;
            const isGlobal = ['GLOBAL', 'ALL', 'PUBLIC'].includes(domain.toUpperCase());
            
            let domainUsers;
            if (isGlobal) {
              domainUsers = await UserModel.find({});
            } else {
              const searchDomains = [domain];
              if (domain.toUpperCase() === 'HR' || domain.toUpperCase() === 'RH') {
                searchDomains.push('RH', 'HR', 'rh', 'hr');
              }
              domainUsers = await UserModel.find({ domain: { $in: searchDomains } });
            }

            for (const user of domainUsers) {
              if (targetUsers.has(user._id.toString())) continue;

              await notificationController.createInternalNotification(req.tenantConn, {
                recipient: user._id,
                title: isGlobal ? 'Global Task Broadcast' : 'New Department Task',
                message: isGlobal ? `A mandatory task is available for all users in "${instance.title}".` : `A new task for the ${domain} department is available in "${instance.title}".`,
                type: 'task_assigned',
                link: `/Workflows/instances/${instance._id}`
              });
            }
          }
        }
      }
    } catch (err) {
      console.error('Notification Error:', err);
    }

    res.json({ success: true, message: 'Step validated', data: instance });
  } catch (error) {
    console.error('❌ approveNode Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};



// 4.5 UPDATE NODE DATA (For revisions)
exports.updateNodeData = async (req, res) => {
  try {
    const { instanceId } = req.params;
    const { nodeId, data, comments } = req.body;
    const userId = req.user.id;

    const WorkflowInstance = req.tenantConn.model('WorkflowInstance');
    const Workflow = req.tenantConn.model('Workflow');
    const instance = await WorkflowInstance.findById(instanceId);
    
    if (!instance) return res.status(404).json({ success: false, message: 'Instance not found' });
    if (instance.status !== 'in_progress') return res.status(400).json({ success: false, message: 'Instance is no longer active' });

    let lastActionIdx = -1;
    for (let i = instance.executionPath.length - 1; i >= 0; i--) {
        if (instance.executionPath[i].nodeId === nodeId && instance.executionPath[i].action === 'approved') {
            lastActionIdx = i;
            break;
        }
    }

    if (lastActionIdx === -1) {
      return res.status(400).json({ success: false, message: 'No approved action found for this node to update' });
    }

    if (instance.executionPath[lastActionIdx].performedBy.toString() !== userId.toString()) {
       if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
          return res.status(403).json({ success: false, message: 'You can only update your own responses' });
       }
    }

    const workflow = await Workflow.findById(instance.workflowId);
    const nodeSuccessors = (workflow?.edges || []).filter(e => e.source === nodeId).map(e => e.target);
    const hasActiveSuccessors = instance.currentNodes.some(cn => nodeSuccessors.includes(cn.nodeId));
    
    if (!hasActiveSuccessors) {
       return res.status(400).json({ success: false, message: 'This task has already been validated and cannot be modified' });
    }

    if (data) {
      for (const [key, value] of Object.entries(data)) {
        instance.variables.set(key, value);
      }
      instance.executionPath[lastActionIdx].outputData = data;
    }
    
    if (comments) instance.executionPath[lastActionIdx].comments = comments;

    instance.markModified('variables');
    instance.markModified('executionPath');

    instance.history.push({
      nodeId: nodeId,
      action: 'step_updated',
      title: `Étape modifiée`,
      performedBy: userId,
      comments: `Réponse mise à jour: ${comments || ''}`
    });

    await instance.save();
    res.json({ success: true, message: 'Response updated successfully', data: instance });

  } catch (error) {
    console.error('❌ updateNodeData Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


// ============================================
// 5. REJECT STEP
// ============================================
exports.rejectNode = async (req, res) => {
  try {
    const { instanceId } = req.params;
    const { nodeId, comments } = req.body;

    const WorkflowInstance = req.tenantConn.model('WorkflowInstance');

    const instance = await WorkflowInstance.findById(instanceId);

    if (!instance) {
      return res.status(404).json({ success: false, message: 'Instance not found' });
    }

    const currentNodeIndex = instance.currentNodes.findIndex(n => n.nodeId === nodeId && n.status === 'in_progress');

    if (currentNodeIndex === -1) {
      return res.status(400).json({ success: false, message: 'This node is not active' });
    }

    // Mark node as rejected
    instance.currentNodes[currentNodeIndex].status = 'rejected';

    // Standard logic: reject = end of workflow (rejected status)
    instance.status = 'rejected';
    instance.timeCompleted = new Date();

    instance.executionPath.push({
      nodeId: nodeId,
      nodeType: 'action',
      action: 'rejected',
      performedBy: req.user.id,
      comments: comments || 'Rejeté',
      timestamp: new Date()
    });

    instance.history.push({
      action: 'step_rejected',
      title: 'Action rejetée',
      performedBy: req.user.id,
      comments: comments || 'Étape rejetée'
    });

    await instance.save();

    // 2. Notify Creator of Rejection
    try {
      await notificationController.createInternalNotification(req.tenantConn, {
        recipient: instance.createdBy,
        title: 'Step Rejected',
        message: `Your process "${instance.title}" has been REJECTED at step ${nodeId}.`,
        type: 'workflow_completed',
        link: `/Workflows/instances/${instance._id}`
      });
    } catch (err) {
      console.error('Notification Error:', err);
    }

    res.json({
      success: true,
      message: 'Step rejected',
      data: instance
    });

  } catch (error) {
    console.error('❌ rejectNode Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ============================================
// 5.5 LOCK NODE (For ANY assignment type)
// ============================================
exports.lockNode = async (req, res) => {
  try {
    const { instanceId } = req.params;
    const { nodeId } = req.body;

    const WorkflowInstance = req.tenantConn.model('WorkflowInstance');
    const instance = await WorkflowInstance.findById(instanceId);

    if (!instance) return res.status(404).json({ success: false, message: 'Instance not found' });
    if (instance.status !== 'in_progress') return res.status(400).json({ success: false, message: 'Instance not active' });

    const nodeEntry = instance.currentNodes.find(n => n.nodeId === nodeId && n.status === 'in_progress');
    if (!nodeEntry) return res.status(400).json({ success: false, message: 'This node is not active' });

    if (nodeEntry.responsibleUser && nodeEntry.responsibleUser.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'This task is already locked by another user' });
    }

    // Permission check: is the user in the target domain/role/assignees?
    const userRoleStr = req.user.role;
    const userDomain = req.user.domain;
    const specificRole = req.user.specificRole;
    
    const isAllowed = (
      userRoleStr === 'admin' || 
      userRoleStr === 'super_admin' ||
      nodeEntry.assignees.some(id => 
        id.toString() === req.user.id || 
        (req.user.specificRoleId && id.toString() === req.user.specificRoleId.toString())
      ) ||
      (nodeEntry.responsibleDomain && (
        nodeEntry.responsibleDomain.toLowerCase() === (userDomain || '').toLowerCase() ||
        nodeEntry.responsibleDomain.toLowerCase() === (specificRole || '').toLowerCase() ||
        ['GLOBAL', 'ALL', 'PUBLIC', 'TOUTE L\'ENTREPRISE'].includes(nodeEntry.responsibleDomain.toUpperCase())
      ))
    );

    if (!isAllowed) {
      return res.status(403).json({ success: false, message: 'You are not authorized to lock this task' });
    }

    nodeEntry.responsibleUser = req.user.id;

    instance.history.push({
      action: 'task_locked',
      title: 'Tâche verrouillée',
      performedBy: req.user.id,
      comments: `L'utilisateur a pris possession de la tâche ${nodeId}`
    });

    await instance.save();

    res.json({ success: true, message: 'Task locked successfully', data: instance });
  } catch (error) {
    console.error('❌ lockNode Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ============================================
// 6. CANCEL INSTANCE
// ============================================
exports.cancelInstance = async (req, res) => {
  try {
    const { instanceId } = req.params;
    const { comments } = req.body;

    const WorkflowInstance = req.tenantConn.model('WorkflowInstance');

    const instance = await WorkflowInstance.findOne({
      _id: instanceId,
      createdBy: req.user.id
    });

    if (!instance) {
      return res.status(404).json({
        success: false,
        message: 'Instance not found or not authorized'
      });
    }

    if (instance.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a completed instance'
      });
    }

    instance.status = 'cancelled';
    instance.timeCompleted = new Date();

    // Cancel all active nodes
    instance.currentNodes.forEach(node => {
      node.status = 'completed'; // Or another value, but we clear active list
    });
    instance.currentNodes = [];

    instance.history.push({
      action: 'instance_cancelled',
      title: 'Annulation',
      performedBy: req.user.id,
      comments: comments || 'Instance annulée par l\'utilisateur'
    });

    await instance.save();

    res.json({
      success: true,
      message: 'Instance cancelled',
      data: instance
    });

  } catch (error) {
    console.error('❌ cancelInstance Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// ============================================
// 7. ADD FILE
// ============================================
exports.addAttachment = async (req, res) => {
  try {
    const { instanceId } = req.params;
    let { filename, url } = req.body;

    const WorkflowInstance = req.tenantConn.model('WorkflowInstance');

    if (!filename || !url) {
      return res.status(400).json({ success: false, message: 'Filename and URL/Base64 are required' });
    }

    // Check if URL is actually a base64 string
    if (url.startsWith('data:')) {
      const match = url.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        const contentType = match[1];
        const base64Data = match[2];
        const buffer = Buffer.from(base64Data, 'base64');

        // Generate a unique filename
        const uniqueFilename = `${Date.now()}-${filename}`;
        const uploadDir = path.join(__dirname, '../../uploads');
        const filePath = path.join(uploadDir, uniqueFilename);

        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        fs.writeFileSync(filePath, buffer);

        // Update URL to point to our static server
        url = `http://localhost:5000/uploads/${uniqueFilename}`;
      }
    }

    const instance = await WorkflowInstance.findById(instanceId);

    if (!instance) {
      return res.status(404).json({ success: false, message: 'Instance not found' });
    }

    instance.attachments.push({
      filename,
      url,
      uploadedBy: req.user.id
    });

    instance.history.push({
      action: 'attachment_added',
      title: 'Fichier ajouté',
      performedBy: req.user.id,
      comments: `Fichier ajouté: ${filename}`
    });

    await instance.save();

    res.json({
      success: true,
      message: 'File added',
      data: instance.attachments[instance.attachments.length - 1]
    });

  } catch (error) {
    console.error('❌ addAttachment Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.removeAttachment = async (req, res) => {
  try {
    const { instanceId, attachmentId } = req.params;
    const WorkflowInstance = req.tenantConn.model('WorkflowInstance');
    const instance = await WorkflowInstance.findById(instanceId);

    if (!instance) return res.status(404).json({ success: false, message: 'Instance not found' });

    const attachment = instance.attachments.id(attachmentId);
    if (!attachment) return res.status(404).json({ success: false, message: 'Attachment not found' });

    // Try to delete physical file if it exists locally
    if (attachment.url.includes('/uploads/')) {
       try {
          const filename = attachment.url.split('/').pop();
          const filePath = path.join(__dirname, '../../uploads', filename);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
       } catch (err) {
         console.error('Error deleting file system attachment:', err);
       }
    }

    instance.attachments.pull({ _id: attachmentId });
    
    instance.history.push({
      action: 'attachment_removed',
      title: 'Fichier supprimé',
      performedBy: req.user.id,
      comments: `Fichier supprimé: ${attachment.filename}`
    });

    await instance.save();
    res.json({ success: true, message: 'Attachment removed' });

  } catch (error) {
    console.error('❌ removeAttachment Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ============================================
// 8. INSTANCE STATISTICS
// ============================================
exports.getInstanceStats = async (req, res) => {
  try {
    const WorkflowInstance = req.tenantConn.model('WorkflowInstance');

    // REMOVE tenantId from match
    const stats = await WorkflowInstance.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgDuration: {
            $avg: {
              $cond: [
                { $ne: ['$timeCompleted', null] },
                { $subtract: ['$timeCompleted', '$timeStarted'] },
                null
              ]
            }
          }
        }
      },
      {
        $project: {
          status: '$_id',
          count: 1,
          avgDurationSeconds: { $divide: ['$avgDuration', 1000] },
          _id: 0
        }
      }
    ]);

    const byWorkflow = await WorkflowInstance.aggregate([
      {
        $group: {
          _id: '$workflowId',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'workflows',
          localField: '_id',
          foreignField: '_id',
          as: 'workflow'
        }
      },
      {
        $project: {
          workflowId: '$_id',
          workflowName: { $arrayElemAt: ['$workflow.name', 0] },
          count: 1,
          _id: 0
        }
      }
    ]);

    console.log(`📊 [InstanceStats] Aggregating stats for DB: ${req.tenantConn.name}`);
    
    res.json({
      success: true,
      data: {
        stats,
        topWorkflows: byWorkflow,
        total: stats.reduce((acc, curr) => acc + (curr.count || 0), 0)
      }
    });

  } catch (error) {
    console.error('❌ getInstanceStats Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// 9. DELETE INSTANCE
exports.deleteInstance = async (req, res) => {
  try {
    const { instanceId } = req.params;
    const WorkflowInstance = req.tenantConn.model('WorkflowInstance');
    const Checklist = req.tenantConn.model('Checklist');

    const instance = await WorkflowInstance.findById(instanceId);
    if (!instance) {
      return res.status(404).json({ success: false, message: 'Instance not found' });
    }

    // Delete associated checklist if exists
    if (instance.checklistId) {
      await Checklist.findByIdAndDelete(instance.checklistId);
    } else {
      // Sometimes we delete by instanceId in checklist too
      await Checklist.deleteMany({ instanceId: instance._id });
    }

    await WorkflowInstance.findByIdAndDelete(instanceId);

    res.json({ success: true, message: 'Instance and associated data deleted' });
  } catch (error) {
    console.error('❌ deleteInstance Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ============================================
// INTERNAL HELPER: Process node transition logic
// ============================================
async function processNodeTransition(req, instance, workflow, sourceNodeId) {
  const nodesToActivate = [];

  // Recursive search for next manual nodes (skip logic blocks)
  const isLogicNode = (type) => {
    if (!type) return false;
    const logicTypes = ['parallel_split', 'parallel_join', 'parallelstart', 'parallelStart', 'parallel_start', 'parallel', 'start', 'syncJoin', 'sync_join', 'condition', 'gateway', 'split', 'join'];
    return logicTypes.some(t => t.toLowerCase() === type.toLowerCase());
  };

  const findNextExecutableNodes = (srcId, targetNodesArray, visited = new Set()) => {
    if (visited.has(srcId)) return;
    visited.add(srcId);

    const edges = workflow.edges.filter(e => e.source === srcId);
    for (const edge of edges) {
      const targetNode = workflow.nodes.find(n => n.id === edge.target);
      if (!targetNode) continue;

      if (isLogicNode(targetNode.type)) {
        // ⚡ JOIN LOGIC: If it's a join node, check if all incoming branches are finished
        const joinTypes = ['sync_join', 'parallel_join', 'syncjoin', 'parallelmerge', 'join'];
        const isJoinNode = joinTypes.includes((targetNode.type || '').toLowerCase());
        
        if (isJoinNode) {
          const incoming = workflow.edges.filter(e => e.target === targetNode.id);
          const allIncomingFinished = incoming.every(ie => 
             instance.executionPath.some(p => p.nodeId === ie.source && (p.action === 'approved' || p.action === 'auto_approved'))
          );
          
          if (!allIncomingFinished) {
            console.log(`⏳ Node ${targetNode.id} (JOIN) is waiting for other branches.`);
            continue; // Stop this path here
          }
        }

        // Log it as auto-approved so it shows in history but doesn't block
        if (!instance.executionPath.some(p => p.nodeId === targetNode.id)) {
          instance.executionPath.push({
            nodeId: targetNode.id,
            nodeType: targetNode.type,
            action: 'auto_approved',
            timestamp: new Date()
          });
        }
        // Recursively find the real tasks after this logic block
        findNextExecutableNodes(targetNode.id, targetNodesArray, visited);
      } else {
        targetNodesArray.push(targetNode);
      }
    }
  };

  findNextExecutableNodes(sourceNodeId, nodesToActivate);

  const UserModel = req.tenantConn.model('User');
  const DomainModel = req.tenantConn.model('Domain');
  const RoleModel = req.tenantConn.model('Role');

  // Always clear the specific transitioning node from currentNodes before adding new ones
  instance.currentNodes = instance.currentNodes.filter(n => n.nodeId !== sourceNodeId);

  for (const node of nodesToActivate) {
    if (node.type === 'end') {
       // Only end the flow if this was the last active path. 
       // This will be checked again in approveNode/rejectNode but let's be safe.
       if (instance.currentNodes.length === 0) {
         instance.status = 'completed';
         instance.timeCompleted = new Date();
       }
       continue;
    }

    let nodeAssignees = node.data?.assigneeIds || [];
    let domainName = node.data?.responsibleDomain || node.data?.domain;
    let responsibleUser = null;
    let responsibleDomain = domainName;

    const assignmentType = node.data?.assignmentType || 'SINGLE';
    const assignedId = node.data?.assignedTo;

    if (!domainName && assignedId && mongoose.Types.ObjectId.isValid(assignedId) && assignmentType !== 'SINGLE') {
      const dom = await DomainModel.findById(assignedId) || await RoleModel.findById(assignedId);
      if (dom) domainName = dom.name;
    }

    if (assignmentType === 'ALL' && assignedId) {
      const dName = domainName || (mongoose.Types.ObjectId.isValid(assignedId) ? (await DomainModel.findById(assignedId))?.name : null);
      if (dName) {
        const isGlobal = ['GLOBAL', 'ALL', 'PUBLIC', 'TOUTE L\'ENTREPRISE'].includes(dName.toUpperCase());
        const domainUsers = isGlobal 
          ? await UserModel.find({}) 
          : await UserModel.find({ $or: [{ domain: dName }, { specificRole: dName }] });
        nodeAssignees = domainUsers.map(u => u._id);
      }
    }

    if (assignmentType === 'SINGLE' && assignedId && mongoose.Types.ObjectId.isValid(assignedId)) {
      const domainMaybe = await DomainModel.findById(assignedId);
      if (domainMaybe) {
        responsibleDomain = domainMaybe.name;
      } else {
        const roleMaybe = await RoleModel.findById(assignedId);
        if (roleMaybe) responsibleDomain = roleMaybe.name;
        else responsibleUser = assignedId;
      }
    } else if (node.data?.assigneeSelectionType === 'role' && assignedId) {
      if (mongoose.Types.ObjectId.isValid(assignedId)) {
        const roleMaybe = await RoleModel.findById(assignedId);
        responsibleDomain = roleMaybe ? roleMaybe.name : assignedId;
      } else {
        responsibleDomain = assignedId;
      }
    } else {
      responsibleUser = node.data?.assignedUser || (node.data?.assigneeSelectionType === 'user' ? node.data.assigneeIds?.[0] : null);
      responsibleDomain = domainName || (assignmentType !== 'SINGLE' ? assignedId : null);
    }

    if (responsibleDomain && mongoose.Types.ObjectId.isValid(responsibleDomain)) {
      const dom = await DomainModel.findById(responsibleDomain) || await RoleModel.findById(responsibleDomain);
      if (dom) responsibleDomain = dom.name;
    }

    instance.currentNodes.push({
      nodeId: node.id,
      status: 'in_progress',
      startedAt: new Date(),
      responsibleUser,
      responsibleDomain,
      restrictedDomain: node.data?.restrictedDomain || null,
      assignees: nodeAssignees,
      deadline: node.data?.deadline ? new Date(node.data.deadline) : null
    });
  }
}

exports.checkDeadlines = async (req, res) => {
  try {
    if (!req.tenantConn) {
      return res.status(403).json({ success: false, message: 'Tenant context required' });
    }
    const WorkflowInstance = req.tenantConn.model('WorkflowInstance');
    const Notification = req.tenantConn.model('Notification');
    const User = req.tenantConn.model('User');
    const notificationController = require('./notificationController');

    const instances = await WorkflowInstance.find({ status: 'in_progress' });
    const now = new Date();
    const admins = await User.find({ role: 'admin' });

    let alertsCreated = 0;

    for (const inst of instances) {
      for (const node of (inst.currentNodes || [])) {
        if (node.deadline && new Date(node.deadline) < now && node.status === 'in_progress') {
          const alreadyNotified = await Notification.findOne({
            recipient: { $in: admins.map(a => a._id) },
            type: 'deadline_exceeded',
            link: `/Workflows/instances/${inst._id}/`
          });

          if (!alreadyNotified) {
            for (const admin of admins) {
              await notificationController.createInternalNotification(req.tenantConn, {
                recipient: admin._id,
                title: '⏰ DEADLINE EXCEEDED',
                message: `Task in workflow "${inst.title}" has passed its deadline!`,
                type: 'deadline_exceeded',
                link: `/Workflows/instances/${inst._id}/`
              });
            }
            alertsCreated++;
          }
        }
      }
    }

    res.json({ success: true, alertsCreated });
  } catch (error) {
    console.error('Error checking deadlines:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


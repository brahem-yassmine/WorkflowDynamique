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
      const domainName = startNode.data?.responsibleDomain || (await req.tenantConn.model('Domain').findById(startNode.data?.assignedTo))?.name;
      if (domainName) {
        const domainUsers = await UserModel.find({ domain: domainName });
        startAssignees = domainUsers.map(u => u._id);
      }
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
        responsibleUser: (startNode.data?.assignmentType === 'SINGLE' && startNode.data?.assignedTo)
          ? startNode.data.assignedTo
          : (startNode.data?.assignedUser || (startNode.data?.assigneeSelectionType === 'user' ? (startNode.data.assigneeIds?.[0]) : null)),
        responsibleDomain: startNode.data?.responsibleDomain || startNode.data?.domain || (startNode.data?.assignmentType !== 'SINGLE' ? startNode.data?.assignedTo : null),
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
      .filter(node => node.type !== 'start' && node.type !== 'end')
      .map(node => ({
        id: node.id,
        title: node.data?.label || node.id,
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

      // 2. Notify by Domain/Department
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

    if (status) query.status = status;
    if (workflowId) query.workflowId = workflowId;
    if (priority) query.priority = priority;
    if (createdBy) query.createdBy = createdBy;

    // Filter by currently active responsible user or domain
    if (responsibleUser) {
      query['currentNodes.responsibleUser'] = responsibleUser;
    }
    if (responsibleDomain) {
      query['currentNodes.responsibleDomain'] = responsibleDomain;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [instances, total] = await Promise.all([
      WorkflowInstance.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate({
          path: 'workflowId',
          select: 'name description domain projectId',
          populate: { path: 'projectId', select: 'name' }
        })
        .populate('createdBy', 'email firstName lastName'),
      WorkflowInstance.countDocuments(query)
    ]);

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
    const WorkflowInstance = req.tenantConn.model('WorkflowInstance');

    const instance = await WorkflowInstance.findById(instanceId)
      .populate('workflowId')
      .populate('createdBy', 'email firstName lastName')
      .populate('history.performedBy', 'email firstName lastName');

    if (!instance) return res.status(404).json({ success: false, message: 'Instance not found' });
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
          action: 'partial_approval',
          title: `Approbation partielle`,
          performedBy: req.user.id,
          comments: `L'utilisateur a validé, en attente des autres membres (${nodeEntry.approvedBy.length}/${nodeEntry.assignees.length})`
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
      action: 'step_approved',
      title: `Étape validée`,
      performedBy: req.user.id,
      comments: comments || `Action validée sur le noeud ${nodeId}`
    });

    const nodesToActivate = [];

    // 🔍 Find nodes to activate, handling Parallel Joins automatically
    const findNextExecutableNodes = (sourceId, targetNodesArray) => {
      const edges = workflow.edges.filter(e => e.source === sourceId);
      for (const edge of edges) {
        const targetNode = workflow.nodes.find(n => n.id === edge.target);
        if (!targetNode) continue;

        if (targetNode.type === 'parallel_split') {
          // Split is automatic: Record and continue to children
          if (!instance.executionPath.some(p => p.nodeId === targetNode.id)) {
            instance.executionPath.push({
              nodeId: targetNode.id,
              nodeType: 'parallel_split',
              action: 'auto_approved',
              timestamp: new Date()
            });
          }
          findNextExecutableNodes(targetNode.id, targetNodesArray);
        } else if (targetNode.type === 'parallel_join') {
          const incoming = workflow.edges.filter(e => e.target === targetNode.id);
          const completed = instance.executionPath.map(p => p.nodeId);
          // Also include the node we just finished approving
          if (!completed.includes(nodeId)) completed.push(nodeId);

          if (incoming.every(e => completed.includes(e.source))) {
            // Join condition met! This node is specialized but automatic.
            // Record it in execution path and move forward
            if (!instance.executionPath.some(p => p.nodeId === targetNode.id)) {
              instance.executionPath.push({
                nodeId: targetNode.id,
                nodeType: 'parallel_join',
                action: 'auto_approved',
                timestamp: new Date()
              });
            }
            // Recursively find what's after the join
            findNextExecutableNodes(targetNode.id, targetNodesArray);
          } else {
            instance.history.push({
              action: 'sync_waiting',
              title: `En attente de synchronisation`,
              performedBy: req.user.id,
              comments: `La branche arrivant à "${targetNode.data?.label || targetNode.id}" est terminée, attend les autres branches.`
            });
          }
        } else {
          // If it's not a join/split, or it's a join/split that we've already decided is ready (handled in recursion), add to pendings
          targetNodesArray.push(targetNode);
        }
      }
    };

    findNextExecutableNodes(nodeId, nodesToActivate);

    let isFlowFinished = false;
    if (nodesToActivate.length === 0) {
      if (instance.currentNodes.length === 0) isFlowFinished = true;
    } else {
      const UserModel = req.tenantConn.model('User');
      const DomainModel = req.tenantConn.model('Domain');

      for (const node of nodesToActivate) {
        if (node.type === 'end') {
          // If we reach an END node, we only finish if no other nodes are active
          // Wait until the end of the loop to decide if the whole thing is finished
          continue;
        } else {
          let nodeAssignees = node.data?.assigneeIds || [];
          let domainName = node.data?.responsibleDomain || node.data?.domain;

          // Resolve domain name if only ID is provided
          if (!domainName && node.data?.assignedTo && node.data?.assignmentType !== 'SINGLE') {
            const domain = await DomainModel.findById(node.data.assignedTo);
            if (domain) domainName = domain.name;
          }

          if (node.data?.assignmentType === 'ALL' && (node.data?.assignedTo || domainName)) {
            const dName = domainName || (node.data?.assignedTo ? (await DomainModel.findById(node.data.assignedTo))?.name : null);
            if (dName) {
              const domainUsers = await UserModel.find({ domain: dName });
              nodeAssignees = domainUsers.map(u => u._id);
            }
          }

          instance.currentNodes.push({
            nodeId: node.id,
            status: 'in_progress',
            startedAt: new Date(),
            responsibleUser: (node.data?.assignmentType === 'SINGLE' && node.data?.assignedTo)
              ? node.data.assignedTo
              : (node.data?.assignedUser || (node.data?.assigneeSelectionType === 'user' ? (node.data.assigneeIds?.[0]) : null)),
            responsibleDomain: domainName || (node.data?.assignmentType !== 'SINGLE' ? node.data?.assignedTo : null),
            assignees: nodeAssignees
          });
        }
      }

      // After processing all potential new nodes, check if any are actually active
      if (instance.currentNodes.length === 0) {
        isFlowFinished = true;
      }
    }

    if (isFlowFinished) {
      instance.status = 'completed';
      instance.timeCompleted = new Date();
      instance.history.push({
        action: 'workflow_completed',
        title: 'Terminé',
        performedBy: req.user.id,
        comments: 'Workflow terminé avec succès'
      });
    }

    await instance.save();

    // Update associated checklist task
    /* 
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
    */

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
        for (const newNode of instance.currentNodes) {
          if (newNode.status !== 'in_progress') continue;

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
                { role: { $in: newNode.assignees.map(id => id.toString()) } }
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

    res.json({
      success: true,
      data: {
        stats,
        topWorkflows: byWorkflow,
        total: stats.reduce((acc, curr) => acc + curr.count, 0)
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

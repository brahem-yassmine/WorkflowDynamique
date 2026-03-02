// back/src/controllers/workflowInstanceController.js
const notificationController = require('./notificationController');


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

    const instance = new WorkflowInstance({
      workflowId: workflow._id,
      createdBy: req.user.id,
      title,
      description: description || workflow.description,
      currentNodes: [{
        nodeId: startNode.id,
        status: 'in_progress',
        startedAt: new Date(),
        responsibleUser: startNode.data?.assignedUser || null,
        responsibleDomain: startNode.data?.domain || null
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
      // 1. Notify Assignee of start node if exists
      if (instance.currentNodes[0].responsibleUser) {
        await notificationController.createInternalNotification(req.tenantConn, {
          recipient: instance.currentNodes[0].responsibleUser,
          title: 'New Task Assigned',
          message: `You have a new task in "${instance.title}".`,
          type: 'task_assigned',
          link: `/Workflows/instances/${instance._id}`
        });
      }

      // 2. Notify Admins
      const UserModel = req.tenantConn.model('User');
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
        .populate('workflowId', 'name description')
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

    const workflow = await Workflow.findById(instance.workflowId);
    if (!workflow) throw new Error('Workflow definition not found');

    const outgoingEdges = workflow.edges.filter(edge => edge.source === nodeId);
    const nextNodes = [];

    for (const edge of outgoingEdges) {
      let conditionMet = true;
      // Simple condition check if needed
      if (conditionMet) {
        const targetNode = workflow.nodes.find(n => n.id === edge.target);
        if (targetNode) nextNodes.push(targetNode);
      }
    }

    let isFlowFinished = false;
    if (nextNodes.length === 0) {
      if (instance.currentNodes.length === 0) isFlowFinished = true;
    } else {
      for (const node of nextNodes) {
        if (node.type === 'end') {
          isFlowFinished = true;
        } else {
          instance.currentNodes.push({
            nodeId: node.id,
            status: 'in_progress',
            startedAt: new Date(),
            responsibleUser: node.data?.assignedUser || null,
            responsibleDomain: node.data?.domain || null
          });
        }
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
        for (const newNode of instance.currentNodes) {
          if (newNode.responsibleUser) {
            await notificationController.createInternalNotification(req.tenantConn, {
              recipient: newNode.responsibleUser,
              title: 'New Task Assigned',
              message: `A new task in "${instance.title}" requires your validation.`,
              type: 'task_assigned',
              link: `/Workflows/instances/${instance._id}`
            });
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
    const { filename, url } = req.body;

    const WorkflowInstance = req.tenantConn.model('WorkflowInstance');

    if (!filename || !url) {
      return res.status(400).json({
        success: false,
        message: 'Filename and URL are required'
      });
    }

    const instance = await WorkflowInstance.findById(instanceId);

    if (!instance) {
      return res.status(404).json({
        success: false,
        message: 'Instance not found'
      });
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
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
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
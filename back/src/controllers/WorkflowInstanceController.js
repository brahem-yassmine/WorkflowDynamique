// back/src/controllers/workflowInstanceController.js


// back/src/controllers/workflowInstanceController.js
// ❌ REMOVE these imports
// const WorkflowInstance = require('../models/WorkflowInstance');
// const Workflow = require('../models/Workflow');
// const User = require('../models/User');

// 1. CREATE WORKFLOW INSTANCE
exports.createInstance = async (req, res) => {
  try {
    const { workflowId, title, description, data, priority, dueDate, tags } = req.body;

    // Get models from tenant connection
    const Workflow = req.tenantConn.model('Workflow');
    const WorkflowInstance = req.tenantConn.model('WorkflowInstance');

    if (!workflowId || !title) {
      return res.status(400).json({
        success: false,
        message: 'Workflow ID and title are required'
      });
    }

    // No longer need to filter by tenantId
    const workflow = await Workflow.findOne({
      _id: workflowId,
      status: 'active'
    });

    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Active workflow not found'
      });
    }

    // GRAPH INITIALIZATION
    // Find start node
    const startNode = workflow.nodes.find(n => n.type === 'start');

    if (!startNode) {
      return res.status(400).json({
        success: false,
        message: 'Workflow has no start node'
      });
    }

    // No more tenantId, use createdBy
    const instance = new WorkflowInstance({
      workflowId: workflow._id,
      createdBy: req.user.id,
      title,
      description: description || workflow.description,

      // Graph initialization
      currentNodes: [{
        nodeId: startNode.id,
        status: 'in_progress',
        startedAt: new Date(),
        responsibleUser: null
      }],
      variables: data || {}, // Initial variables
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

    await instance.save();

    // Populate references
    await instance.populate([
      { path: 'workflowId', select: 'name description' },
      { path: 'createdBy', select: 'email firstName lastName' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Workflow instance created',
      data: instance
    });

  } catch (error) {
    console.error('❌ createInstance Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ============================================
// 2. LIST INSTANCES
// ============================================
exports.getInstances = async (req, res) => {
  try {
    const {
      status,
      workflowId,
      priority,
      createdBy,
      responsibleDomain,
      page = 1,
      limit = 10
    } = req.query;

    const WorkflowInstance = req.tenantConn.model('WorkflowInstance');

    // REMOVE tenantId from query
    const query = {};

    if (status) query.status = status;
    if (workflowId) query.workflowId = workflowId;
    if (priority) query.priority = priority;
    if (createdBy) query.createdBy = createdBy;

    if (responsibleDomain) {
      // TODO: Adapt for Graph (need to check active nodes responsibleDomain)
      // query['steps.responsibleDomain'] = responsibleDomain;
      // query['steps.status'] = 'in_progress';
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
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// ============================================
// 3. GET INSTANCE BY ID
// ============================================
exports.getInstanceById = async (req, res) => {
  try {
    const { instanceId } = req.params;

    const WorkflowInstance = req.tenantConn.model('WorkflowInstance');

    // REMOVE tenantId from filter
    const instance = await WorkflowInstance.findById(instanceId)
      .populate('workflowId')
      .populate('createdBy', 'email firstName lastName')
      // .populate('steps.processedBy', 'email firstName lastName') // Removed
      .populate('history.performedBy', 'email firstName lastName');

    if (!instance) {
      return res.status(404).json({
        success: false,
        message: 'Instance not found'
      });
    }

    res.json({
      success: true,
      data: instance
    });

  } catch (error) {
    console.error('❌ getInstanceById Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// ============================================
// 4. APPROVE STEP (NODE TRANSITION)
// ============================================
exports.approveNode = async (req, res) => {
  try {
    const { instanceId } = req.params;
    const { nodeId, comments, data } = req.body;

    const WorkflowInstance = req.tenantConn.model('WorkflowInstance');
    const Workflow = req.tenantConn.model('Workflow');

    const instance = await WorkflowInstance.findById(instanceId);

    if (!instance) {
      return res.status(404).json({ success: false, message: 'Instance not found' });
    }

    if (instance.status !== 'in_progress') {
      return res.status(400).json({ success: false, message: 'Instance not active' });
    }

    // Find corresponding active node
    const currentNodeIndex = instance.currentNodes.findIndex(n => n.nodeId === nodeId && n.status === 'in_progress');

    if (currentNodeIndex === -1) {
      return res.status(400).json({ success: false, message: 'This node is not active or does not exist' });
    }

    const currentNode = instance.currentNodes[currentNodeIndex];

    // --- Rights Validation (TODO: Check responsibleDomain from Workflow definition) ---
    // For now we assume it's good if admin or user is there

    // 1. Mark node as completed
    instance.currentNodes.splice(currentNodeIndex, 1); // Remove from active nodes

    // Variables update
    if (data) {
      for (const [key, value] of Object.entries(data)) {
        instance.variables.set(key, value);
      }
    }

    // Add to execution history
    instance.executionPath.push({
      nodeId: nodeId,
      nodeType: 'action', // Retrieve from workflow if possible
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

    // 2. Calculate next nodes (Transition)
    const workflow = await Workflow.findById(instance.workflowId);
    if (!workflow) throw new Error('Workflow definition not found');

    const outgoingEdges = workflow.edges.filter(edge => edge.source === nodeId);
    const nextNodes = [];

    // Simple transition logic (supports basic conditions)
    for (const edge of outgoingEdges) {
      let conditionMet = true;

      // Summary conditional check
      if (edge.data && edge.data.condition) {
        // Ex: edge.data.conditionValue === instance.variables.get('foo')
        // For now take all by default
        conditionMet = true;
      }

      if (conditionMet) {
        const targetNode = workflow.nodes.find(n => n.id === edge.target);
        if (targetNode) nextNodes.push(targetNode);
      }
    }

    let isFlowFinished = false;

    if (nextNodes.length === 0) {
      // Branch end
      if (instance.currentNodes.length === 0) {
        isFlowFinished = true;
      }
    } else {
      // Add next nodes
      for (const node of nextNodes) {
        if (node.type === 'end') {
          isFlowFinished = true;
          // We don't add it to currentNodes, just finish
        } else {
          instance.currentNodes.push({
            nodeId: node.id,
            status: 'in_progress',
            startedAt: new Date(),
            responsibleUser: null
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

    res.json({
      success: true,
      message: 'Step validated',
      data: instance
    });

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
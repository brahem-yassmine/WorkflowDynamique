// back/src/controllers/workflowController.js
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

    // Get Workflow model from tenant connection
    const Workflow = req.tenantConn.model('Workflow');

    // REMOVE tenantId from query
    const query = {};
    const { projectId } = req.query;

    if (projectId) {
      query.projectId = projectId;
    }

    // Filter by domain for normal users (IT domain sees everything)
    if (req.user.role === 'user' && req.user.domain !== 'IT') {
      query.domain = req.user.domain;
    } else if (domain) {
      query.domain = domain;
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
      message: 'Server error'
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
      projectId: projectId || null,
      createdBy: req.user.id
    });

    await workflow.save();

    // 🚀 AUTOMATIC CHECKLIST GENERATION
    await _triggerAutomaticChecklist(req, workflow);

    // Trigger Notification for Admins or domain users
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

    // 🚀 AUTOMATIC CHECKLIST SYNC
    await _triggerAutomaticChecklist(req, workflow);

    // Log the activity
    await recordActivity(req, 'UPDATE_WORKFLOW', {
      type: 'Workflow',
      id: workflow._id,
      name: workflow.name
    });

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
    const Checklist = req.tenantConn.model('Checklist');

    // Cascade delete: Remove all instances and checklists associated with this workflow
    await WorkflowInstance.deleteMany({ workflowId });
    await Checklist.deleteMany({ workflowId });

    const workflow = await Workflow.findByIdAndDelete(workflowId);

    if (workflow) {
      // Log the activity
      await recordActivity(req, 'DELETE_WORKFLOW', {
        type: 'Workflow',
        id: workflow._id,
        name: workflow.name
      });
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
        responsibleUser: null // Could be defined in startNode.data if needed
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

    if (status === 'active') {
      const UserModel = req.tenantConn.model('User');
      const domainUsers = await UserModel.find({
        $or: [{ domain: workflow.domain }, { role: 'admin' }]
      });

      for (const user of domainUsers) {
        await notificationController.createInternalNotification(req.tenantConn, {
          recipient: user._id,
          title: 'Workflow Published',
          message: `The workflow "${workflow.name}" is now ACTIVE for ${workflow.domain}.`,
          type: 'workflow_created',
          link: `/User/Workflows`
        });
      }
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

    // 🚀 AUTOMATIC CHECKLIST GENERATION
    await _triggerAutomaticChecklist(req, duplicate);

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

/**
 * PRIVATE HELPER: Automatically generates a checklist based on workflow nodes
 * @param {Object} req - Request object with tenantConn and user
 * @param {Object} workflow - Saved workflow document
 */
async function _triggerAutomaticChecklist(req, workflow) {
  try {
    // SECURITY: Only trigger automation for Admin/SuperAdmin accounts
    if (req.user?.role !== 'admin' && req.user?.role !== 'super_admin') {
      return;
    }

    const nodesToInclude = (workflow.nodes || []).filter(n => n.type === 'action' || n.type === 'condition');
    if (nodesToInclude.length === 0) return;

    const Checklist = req.tenantConn.model('Checklist');
    const checklistName = `Workflow: ${workflow.name}`;

    const checklistTasks = nodesToInclude.map(n => {
      let title = n.data?.label || (n.type === 'action' ? 'New Task' : 'New Condition');
      if (n.type === 'condition' && n.data?.condition) {
        title = `${title} (${n.data.condition})`;
      }
      return {
        id: n.id,
        title: title,
        completed: false,
        priority: (n.data?.priority === 'critical' ? 'high' : n.data?.priority) || 'medium'
      };
    });

    // Check if checklist already exists for this workflow
    let checklist = await Checklist.findOne({ name: checklistName });

    if (checklist) {
      // Update existing checklist
      checklist.tasks = checklistTasks;
      checklist.description = `Checklist tracking for workflow ${workflow.name}`;
      await checklist.save();
      console.log(`✅ [Automation] Checklist "${checklistName}" updated.`);
    } else {
      // Create new checklist
      checklist = new Checklist({
        name: checklistName,
        description: `Checklist tracking for workflow ${workflow.name}`,
        tasks: checklistTasks,
        createdBy: req.user.id,
        status: 'draft'
      });
      await checklist.save();
      console.log(`✅ [Automation] Checklist "${checklistName}" created.`);
    }
  } catch (error) {
    console.error('⚠️ [Automation] Checklist Generation Error:', error.message);
  }
}

const path = require('path');
const mongoose = require('mongoose');
const WorkflowEngine = require('../workflowEngine/WorkflowEngine');
const notificationController = require('./notificationController');

// Helper to sync state to currentNodes for frontend compatibility
const syncCompatibilityFields = (instance) => {
  if (!instance.state) return;
  
  instance.currentNodes = instance.state
    .filter(s => s.status === 'IN_PROGRESS')
    .map(s => ({
      nodeId: s.stepId,
      status: 'in_progress',
      startedAt: s.startedAt,
      responsibleUser: s.activePerformer || (s.assignees?.length === 1 ? s.assignees[0] : null),
      assignees: s.assignees,
      deadline: s.deadline
    }));
    
  // Sync history to executionPath for frontend compatibility
  if (instance.history) {
    instance.executionPath = instance.history.map(h => ({
      nodeId: h.stepId,
      action: h.action?.toLowerCase(),
      performedBy: h.performedBy,
      timestamp: h.timestamp,
      comments: h.comments
    }));
  }
};

// Helper to send notifications for new active steps
const sendStepNotifications = async (req, instance) => {
  try {
    const Workflow = req.tenantConn.model('Workflow');
    const workflow = await Workflow.findById(instance.workflowId);
    if (!workflow) return;

    const UserModel = req.tenantConn.model('User');
    const recentTime = new Date(Date.now() - 10000); // 10 seconds grace

    for (const step of instance.state) {
      if (step.status !== 'IN_PROGRESS' || step.startedAt < recentTime) continue;

      const nodeDef = workflow.nodes.find(n => n.id === step.stepId);
      const nodeData = nodeDef?.data || {};

      const targetUsers = new Set();
      if (step.activePerformer) targetUsers.add(step.activePerformer.toString());
      if (step.assignees) {
        step.assignees.forEach(id => targetUsers.add(id.toString()));
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
    }
  } catch (err) {
    console.error('❌ Notification Error:', err);
  }
};

// 1. CREATE WORKFLOW INSTANCE
exports.createInstance = async (req, res) => {
  try {
    const { workflowId, title, description, initialContext, data, priority, dueDate, tags } = req.body;

    if (!workflowId || !title) {
      return res.status(400).json({ success: false, message: 'Workflow ID and title are required' });
    }

    const Workflow = req.tenantConn.model('Workflow');
    const workflow = await Workflow.findById(workflowId);
    if (!workflow) {
      return res.status(404).json({ success: false, message: 'Workflow not found' });
    }

    const engine = new WorkflowEngine(req.tenantConn);
    const currentUserId = req.user.id || req.user.userId || req.user._id;
    const instance = await engine.start(workflowId, currentUserId, title, initialContext || data || {});

    // Update optional fields not handled by engine.start
    if (description) instance.description = description || workflow.description;
    if (priority) instance.priority = priority;
    if (dueDate) instance.dueDate = dueDate;
    if (tags) instance.tags = tags;

    // Checklist creation is now handled by engine.start()

    syncCompatibilityFields(instance);
    await instance.save();

    // Send notifications for initial steps
    await sendStepNotifications(req, instance);

    res.status(201).json({ success: true, message: 'Workflow instance created', data: instance });
  } catch (error) {
    console.error('❌ createInstance Error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// 2. LIST INSTANCES
exports.getInstances = async (req, res) => {
  try {
    const { status, workflowId, priority, createdBy, page = 1, limit = 50 } = req.query;
    const WorkflowInstance = req.tenantConn.model('WorkflowInstance');
    const query = {};

    if (workflowId && mongoose.Types.ObjectId.isValid(workflowId)) {
      query.workflowId = new mongoose.Types.ObjectId(workflowId);
    }

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (createdBy && mongoose.Types.ObjectId.isValid(createdBy)) {
      query.createdBy = new mongoose.Types.ObjectId(createdBy);
    }

    const user = req.user || {};
    const isAdmin = (user.role?.toLowerCase() === 'admin' || user.role?.toLowerCase() === 'super_admin');

    console.log(`🔍 [InstancesCtrl] User: ${user.email} | Role: ${user.role} | IsAdmin: ${isAdmin}`);
    console.log(`🔍 [InstancesCtrl] Query params:`, req.query);

    // Visibility Logic
    if (!isAdmin) {
      // User can see instances they created OR instances where they are an assignee of an active step
      const currentUserId = user.id || user.userId || user._id;
      query.$or = [
        { createdBy: currentUserId },
        { 'state.assignees': currentUserId },
        { 'state.activePerformer': currentUserId }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [instances, total] = await Promise.all([
      WorkflowInstance.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate({
          path: 'workflowId',
          select: 'name description nodes edges'
        })
        .populate('createdBy', 'email firstName lastName'),
      WorkflowInstance.countDocuments(query)
    ]);

    console.log(`✅ [InstancesCtrl] Found ${instances.length} instances. Total count: ${total}`);
    if (instances.length > 0) {
      console.log(`📄 [InstancesCtrl] Sample Instance WorkflowId: ${instances[0].workflowId?._id || instances[0].workflowId}`);
    }

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
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
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

    if (!instance) {
      return res.status(404).json({ success: false, message: 'Instance not found' });
    }

    res.json({ success: true, data: instance });
  } catch (error) {
    console.error('❌ getInstanceById Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// 4. PROCESS STEP (APPROVE / REJECT / SUBMIT)
exports.approveNode = async (req, res) => {
  try {
    const { instanceId } = req.params;
    const { nodeId, action, comments, data } = req.body;

    const engine = new WorkflowEngine(req.tenantConn);
    const instance = await engine.completeStep(
      instanceId, 
      nodeId, 
      req.user.id, 
      action || 'APPROVED', 
      { ...data, comments }
    );

    syncCompatibilityFields(instance);
    await instance.save();
    
    await sendStepNotifications(req, instance);

    res.json({ success: true, message: 'Step processed', data: instance });
  } catch (error) {
    console.error('❌ approveNode Error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.rejectNode = async (req, res) => {
  try {
    const { instanceId } = req.params;
    const { nodeId, comments, data } = req.body;

    const engine = new WorkflowEngine(req.tenantConn);
    const instance = await engine.completeStep(
      instanceId, 
      nodeId, 
      req.user.id, 
      'REJECTED', 
      { ...data, comments }
    );

    syncCompatibilityFields(instance);
    await instance.save();
    
    await sendStepNotifications(req, instance);

    res.json({ success: true, message: 'Step rejected', data: instance });
  } catch (error) {
    console.error('❌ rejectNode Error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// 5. LOCK STEP (For exclusive work)
exports.lockNode = async (req, res) => {
  try {
    const { instanceId } = req.params;
    const { nodeId } = req.body;

    const WorkflowInstance = req.tenantConn.model('WorkflowInstance');
    const instance = await WorkflowInstance.findById(instanceId);

    if (!instance) return res.status(404).json({ success: false, message: 'Instance not found' });
    
    const stepState = instance.state.find(s => s.stepId === nodeId && s.status === 'IN_PROGRESS');
    if (!stepState) return res.status(400).json({ success: false, message: 'Step is not active' });

    if (stepState.activePerformer && stepState.activePerformer.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Already locked by another user' });
    }

    stepState.activePerformer = req.user.id;
    syncCompatibilityFields(instance);
    await instance.save();

    res.json({ success: true, message: 'Step locked', data: instance });
  } catch (error) {
    console.error('❌ lockNode Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// 6. CANCEL INSTANCE
exports.cancelInstance = async (req, res) => {
  try {
    const { instanceId } = req.params;
    const WorkflowInstance = req.tenantConn.model('WorkflowInstance');

    const instance = await WorkflowInstance.findById(instanceId);
    if (!instance || instance.createdBy.toString() !== req.user.id) {
      return res.status(404).json({ success: false, message: 'Not found or not authorized' });
    }

    instance.status = 'cancelled';
    instance.state.forEach(s => { if (s.status === 'IN_PROGRESS') s.status = 'FAILED'; });
    syncCompatibilityFields(instance);
    await instance.save();

    res.json({ success: true, message: 'Instance cancelled', data: instance });
  } catch (error) {
    console.error('❌ cancelInstance Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// 7. ATTACHMENTS
exports.addAttachment = async (req, res) => {
  try {
    const { instanceId } = req.params;
    const { filename, url } = req.body;

    const WorkflowInstance = req.tenantConn.model('WorkflowInstance');
    const instance = await WorkflowInstance.findById(instanceId);
    if (!instance) return res.status(404).json({ success: false, message: 'Instance not found' });

    instance.attachments.push({ filename, url, uploadedBy: req.user.id });
    await instance.save();

    res.json({ success: true, data: instance });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.removeAttachment = async (req, res) => {
  try {
    const { instanceId, attachmentId } = req.params;
    const WorkflowInstance = req.tenantConn.model('WorkflowInstance');
    const instance = await WorkflowInstance.findById(instanceId);
    if (!instance) return res.status(404).json({ success: false, message: 'Instance not found' });

    instance.attachments = instance.attachments.filter(a => a._id.toString() !== attachmentId);
    await instance.save();
    res.json({ success: true, data: instance });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// 8. MISC
exports.deleteInstance = async (req, res) => {
  try {
    const { instanceId } = req.params;
    const WorkflowInstance = req.tenantConn.model('WorkflowInstance');
    await WorkflowInstance.findByIdAndDelete(instanceId);
    res.json({ success: true, message: 'Instance deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getInstanceStats = async (req, res) => {
  try {
    const WorkflowInstance = req.tenantConn.model('WorkflowInstance');
    const stats = await WorkflowInstance.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateNodeData = async (req, res) => {
    res.status(501).json({ success: false, message: 'Endpoint being refactored for new Step architecture' });
};

exports.checkDeadlines = async (req, res) => {
  try {
    if (!req.tenantConn) {
      return res.status(403).json({ success: false, message: 'Tenant context required' });
    }
    const WorkflowInstance = req.tenantConn.model('WorkflowInstance');
    const Notification = req.tenantConn.model('Notification');
    const User = req.tenantConn.model('User');

    const instances = await WorkflowInstance.find({ status: 'in_progress' });
    const now = new Date();
    const admins = await User.find({ role: 'admin' });

    let alertsCreated = 0;

    for (const inst of instances) {
      for (const step of (inst.state || [])) {
        if (step.deadline && new Date(step.deadline) < now && step.status === 'IN_PROGRESS') {
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

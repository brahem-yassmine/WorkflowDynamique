const path = require('path');
const mongoose = require('mongoose');
const WorkflowEngine = require('../workflowEngine/WorkflowEngine');

// 1. CREATE WORKFLOW INSTANCE
exports.createInstance = async (req, res) => {
  try {
    const { workflowId, title, initialContext, priority, dueDate, tags } = req.body;
    
    const engine = new WorkflowEngine(req.tenantConn);
    const instance = await engine.start(workflowId, req.user.id, title, initialContext || {});

    // Update optional fields not handled by engine.start
    if (priority) instance.priority = priority;
    if (dueDate) instance.dueDate = dueDate;
    if (tags) instance.tags = tags;
    await instance.save();

    res.status(201).json({ success: true, message: 'Workflow instance created', data: instance });
  } catch (error) {
    console.error('❌ createInstance Error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
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

    // Visibility Logic
    if (!isAdmin) {
      // User can see instances they created OR instances where they are an assignee of an active step
      query.$or = [
        { createdBy: user.id },
        { 'state.assignees': user.id },
        { 'state.activePerformer': user.id }
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
    res.status(200).json({ success: true, message: 'Deadline check triggered (background)' });
};

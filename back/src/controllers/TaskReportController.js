const mongoose = require('mongoose');

exports.createReport = async (req, res) => {
  try {
    const { instanceId, nodeId, recipientId, message, submissionData, workflowId } = req.body;
    const TaskReport = req.tenantConn.model('TaskReport');
    const notificationController = require('./notificationController'); // Corrected case

    const report = new TaskReport({
      instanceId,
      nodeId,
      workflowId,
      adminId: req.user.id,
      recipientId,
      message,
      submissionData,
      status: 'pending'
    });

    await report.save();

    // Notify user
    try {
        await notificationController.createInternalNotification(req.tenantConn, {
            recipient: recipientId,
            title: 'Critical Fix Required',
            message: `Admin has requested changes for task in instance. Reason: ${message.substring(0, 50)}...`,
            type: 'report_created',
            link: `/User/requests`
        });
    } catch (err) {
        console.error('Notification error for report:', err);
    }

    res.json({ success: true, data: report });
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getReportsForUser = async (req, res) => {
  try {
    const TaskReport = req.tenantConn.model('TaskReport');
    const reports = await TaskReport.find({ recipientId: req.user.id })
        .populate('instanceId')
        .sort({ createdAt: -1 });
    res.json({ success: true, data: reports });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getAllReports = async (req, res) => {
  try {
    const TaskReport = req.tenantConn.model('TaskReport');
    const reports = await TaskReport.find({})
        .populate('instanceId')
        .populate('recipientId')
        .sort({ createdAt: -1 });
    res.json({ success: true, data: reports });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateReportStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, response } = req.body;
        const TaskReport = req.tenantConn.model('TaskReport');
        
        const report = await TaskReport.findByIdAndUpdate(id, { status, response }, { new: true });
        res.json({ success: true, data: report });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

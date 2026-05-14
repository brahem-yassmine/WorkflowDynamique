const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middleware/auth');

// Create a report (Admin only)
router.post('/', auth, async (req, res) => {
  try {
    const { subject, description, type, priority } = req.body;
    const masterDb = req.app.locals.masterDb;
    const SystemReport = masterDb.model('SystemReport');

    if (!subject || !description) {
      return res.status(400).json({
        success: false,
        message: 'Subject and description are required'
      });
    }

    const report = new SystemReport({
      tenantId: req.user.tenantId,
      senderId: req.user.role === 'admin' ? undefined : (req.user.id || req.user._id),
      senderRole: req.user.role || 'user',
      senderName: req.user.name || req.user.email?.split('@')[0],
      senderEmail: req.user.email,
      adminId: (req.user.role === 'admin' || req.user.role === 'super_admin') ? (req.user.id || req.user._id) : undefined,
      adminEmail: (req.user.role === 'admin' || req.user.role === 'super_admin') ? req.user.email : undefined,
      subject,
      description,
      type,
      priority,
      status: 'pending'
    });

    await report.save();

    res.status(201).json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get reports for the current tenant/admin
router.get('/my-reports', auth, async (req, res) => {
  try {
    const masterDb = req.app.locals.masterDb;
    const SystemReport = masterDb.model('SystemReport');

    const reports = await SystemReport.find({ 
      tenantId: req.user.tenantId,
      status: { $ne: 'deleted' }
    })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: reports
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get reports submitted by users of this tenant (for Tenant Admin)
router.get('/tenant-reports', auth, async (req, res) => {
  try {
    const masterDb = req.app.locals.masterDb;
    const SystemReport = masterDb.model('SystemReport');

    const reports = await SystemReport.find({ 
      tenantId: req.user.tenantId,
      senderRole: 'user',
      status: { $ne: 'deleted' }
    })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: reports
    });
  } catch (error) {
    console.error('Error fetching tenant reports:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Admin can see ALL reports (Super Admin only)
router.get('/all', auth, requireRole('super_admin'), async (req, res) => {
  try {
    const masterDb = req.app.locals.masterDb;
    const SystemReport = masterDb.model('SystemReport');

    const reports = await SystemReport.find({ status: { $ne: 'deleted' } })
      .populate('tenantId', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: reports
    });
  } catch (error) {
    console.error('Error fetching all reports:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Update report status (Admin or Super Admin)
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status, response } = req.body;
    const masterDb = req.app.locals.masterDb;
    const SystemReport = masterDb.model('SystemReport');

    const report = await SystemReport.findById(req.params.id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Check if user is super_admin OR the tenant admin for this report
    if (req.user.role !== 'super_admin' && req.user.tenantId?.toString() !== report.tenantId?.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this report'
      });
    }

    report.status = status;
    report.response = response;
    if (response) {
      report.respondedAt = new Date();
    }
    await report.save();

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error updating report:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Delete a report (Admin or Super Admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    const masterDb = req.app.locals.masterDb;
    const SystemReport = masterDb.model('SystemReport');

    const report = await SystemReport.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    // Verify ownership or super_admin role
    const userRole = req.user.role; // Already normalized by auth middleware
    const userTenantId = req.user.tenantId?.toString();
    const reportTenantId = report.tenantId?.toString();

    if (userRole !== 'super_admin' && userTenantId !== reportTenantId) {
      console.warn(`🛑 [ReportDeleteDenied] User(${req.user.email}) Role: ${userRole} | UserTenant: ${userTenantId} | ReportTenant: ${reportTenantId}`);
      return res.status(403).json({ success: false, message: 'Not authorized to delete this report' });
    }

    // Separate logic for incoming user reports vs outgoing admin reports
    if (report.senderRole === 'user') {
      // Users can only "hide" their reports from their view
      await SystemReport.findByIdAndUpdate(req.params.id, {
        status: 'deleted'
      });
    } else {
      // For admin reports, we might want to keep them in history but hidden
      await SystemReport.findByIdAndUpdate(req.params.id, {
        status: 'deleted',
        respondedAt: new Date(),
        response: 'Report permanently deleted by admin.'
      });
    }

    res.json({ success: true, message: 'Report moved to history successfully' });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

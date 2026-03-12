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
      adminId: req.user.id || req.user._id,
      adminEmail: req.user.email,
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

    const reports = await SystemReport.find({ tenantId: req.user.tenantId })
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

// Admin can see ALL reports (Super Admin only)
router.get('/all', auth, requireRole('super_admin'), async (req, res) => {
  try {
    const masterDb = req.app.locals.masterDb;
    const SystemReport = masterDb.model('SystemReport');

    const reports = await SystemReport.find()
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

// Update report status (Super Admin only)
router.patch('/:id/status', auth, requireRole('super_admin'), async (req, res) => {
  try {
    const { status, response } = req.body;
    const masterDb = req.app.locals.masterDb;
    const SystemReport = masterDb.model('SystemReport');

    const report = await SystemReport.findByIdAndUpdate(
      req.params.id,
      { 
        status, 
        response, 
        respondedAt: response ? new Date() : undefined 
      },
      { new: true }
    );

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

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

module.exports = router;

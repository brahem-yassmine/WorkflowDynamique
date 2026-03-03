// back/src/routes/tenantRoutes.js
const express = require('express');
const router = express.Router();
const {
  getDashboard,
  getTenantInfo,
  getTenantSettings,
  updateTenantSettings,
  getTeamMembers,
  inviteTeamMember,
  removeTeamMember,
  getActivityLogs,
  updateTenantInfo
} = require('../controllers/tenantController');
const { auth } = require('../middleware/auth');
const { checkTenantActive, requirePlan } = require('../middleware/tenantMiddleware');
const { checkPlanLimits } = require('../middleware/tenantMiddleware');

// All routes require auth + active tenant
router.use(auth, checkTenantActive);

// Public routes for tenant (even without plan)
router.get('/dashboard', getDashboard);
router.get('/info', getTenantInfo);
router.put('/info', updateTenantInfo);

// Routes that require a plan
router.get('/settings', requirePlan, getTenantSettings);
router.put('/settings', requirePlan, updateTenantSettings);

// Team members management
router.get('/team', requirePlan, getTeamMembers);
router.post('/team/invite',
  requirePlan,
  checkPlanLimits('users'), // Verify user limit
  inviteTeamMember
);
router.delete('/team/:userId', requirePlan, removeTeamMember);

// Statistics
router.get('/stats', requirePlan, async (req, res) => {
  try {
    // Stats example
    const stats = {
      totalWorkflows: await req.tenantConn.model('Workflow').countDocuments(),
      activeInstances: await req.tenantConn.model('WorkflowInstance').countDocuments({ status: 'active' }),
      totalUsers: await req.tenantConn.model('User').countDocuments(),
      storageUsed: '2.3 GB'
    };
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Activity logs
router.get('/logs', requirePlan, getActivityLogs);

module.exports = router;
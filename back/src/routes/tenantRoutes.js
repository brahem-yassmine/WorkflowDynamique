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
    const Workflow = req.tenantConn.model('Workflow');
    const WorkflowInstance = req.tenantConn.model('WorkflowInstance');
    const User = req.tenantConn.model('User');
    const Project = req.tenantConn.model('Project');

    const [
      totalWorkflows,
      activeInstances,
      completedInstances,
      totalUsers,
      totalProjects
    ] = await Promise.all([
      Workflow.countDocuments(),
      WorkflowInstance.countDocuments({ status: { $in: ['active', 'pending'] } }),
      WorkflowInstance.countDocuments({ status: 'completed' }),
      User.countDocuments(),
      Project.countDocuments()
    ]);

    // Calculate pending tasks (sum of currentNodes across all active instances)
    const instances = await WorkflowInstance.find({ status: { $in: ['active', 'pending'] } });
    let totalPendingTasks = 0;
    instances.forEach(inst => {
      totalPendingTasks += inst.currentNodes?.length || 0;
    });

    // Mock data for charts (Weekly performance)
    const performanceData = [
      { name: 'Mon', active: activeInstances > 5 ? activeInstances - 2 : 3, completed: completedInstances > 2 ? 1 : 0 },
      { name: 'Tue', active: activeInstances > 3 ? activeInstances - 1 : 5, completed: completedInstances > 3 ? 2 : 1 },
      { name: 'Wed', active: activeInstances, completed: completedInstances > 5 ? 3 : 2 },
      { name: 'Thu', active: activeInstances + 2, completed: completedInstances > 8 ? 5 : 3 },
      { name: 'Fri', active: activeInstances + 5, completed: completedInstances > 10 ? 7 : 4 },
      { name: 'Sat', active: activeInstances + 1, completed: completedInstances > 12 ? 8 : 5 },
      { name: 'Sun', active: activeInstances, completed: completedInstances > 15 ? 10 : 6 },
    ];

    const stats = {
      totalWorkflows,
      activeInstances,
      completedInstances,
      totalUsers,
      totalProjects,
      totalPendingTasks,
      performanceData,
      completionRate: totalWorkflows > 0 ? Math.round((completedInstances / (completedInstances + activeInstances || 1)) * 100) : 0,
      storageUsed: '2.3 GB'
    };

    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Activity logs
router.get('/logs', getActivityLogs);

module.exports = router;
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
  updateTenantInfo,
  purgeActivityLogs,
  deleteActivityLog
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

    // Calculate pending tasks (excluding system nodes like start, parallel, sync_join, etc.)
    const systemTypes = ['start', 'end', 'parallel', 'sync_join', 'exclusive', 'inclusive', 'parallel_split', 'parallel_join', 'start_parallel', 'condition', 'timer', 'webhook', 'script', 'email', 'delay', 'parallelstart'];
    
    const instances = await WorkflowInstance.find({ status: { $in: ['active', 'pending', 'in_progress'] } }).populate('workflowId');
    let totalPendingTasks = 0;
    
    instances.forEach(inst => {
      const workflow = inst.workflowId;
      if (workflow && workflow.nodes) {
        (inst.currentNodes || []).forEach(cn => {
          if (cn.status !== 'in_progress' && cn.status !== 'pending') return;
          
          const nodeDef = workflow.nodes.find(n => n.id === cn.nodeId);
          const type = (nodeDef?.type || '').toLowerCase();
          
          // Only count if it's NOT a system node
          if (nodeDef && !systemTypes.includes(type)) {
            totalPendingTasks++;
          }
        });
      }
    });

    // Generate real daily usage (all instances since account creation)
    const allInstances = await WorkflowInstance.find({}).select('createdAt status').lean();

    const dailyUsageMap = {};
    allInstances.forEach(inst => {
      if (inst.createdAt) {
          const date = new Date(inst.createdAt);
          // Use a format that is unique per day/month/year for data mapping
          const dateKey = date.toISOString().split('T')[0];
          // Use month/day for display label
          const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          
          if (!dailyUsageMap[dateKey]) {
              dailyUsageMap[dateKey] = { label, dateKey, usage: 0 };
          }
          dailyUsageMap[dateKey].usage += 1;
      }
    });

    const performanceData = Object.values(dailyUsageMap);

    const stats = {
      totalWorkflows,
      activeInstances,
      completedInstances,
      totalUsers,
      totalProjects,
      totalPendingTasks,
      performanceData,
      tenantCreatedAt: req.tenant?.createdAt,
      completionRate: totalWorkflows > 0 ? Math.round((completedInstances / (completedInstances + activeInstances || 1)) * 100) : 0,
      storageUsed: '2.3 GB'
    };

    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Activity logs
router.get('/logs', requirePlan, getActivityLogs);
router.delete('/logs/purge', requirePlan, purgeActivityLogs);
router.delete('/logs/:id', requirePlan, deleteActivityLog);

module.exports = router;
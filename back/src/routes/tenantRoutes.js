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
      User.countDocuments({ role: { $ne: 'admin' } }),
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

    // Generate real daily usage (Last 7 days)
    const performanceData = [];
    const now = new Date();
    
    const ActivityLog = req.tenantConn.model('ActivityLog');
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const start = new Date(d.setHours(0, 0, 0, 0));
      const end = new Date(d.setHours(23, 59, 59, 999));
      
      const label = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dateKey = d.toISOString().split('T')[0];
      
      const count = await ActivityLog.countDocuments({
        timestamp: { $gte: start, $lte: end }
      });
      
      performanceData.push({ label, dateKey, usage: count });
    }

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
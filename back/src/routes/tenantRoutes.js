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
  removeTeamMember
} = require('../controllers/tenantController');
const { auth } = require('../middleware/auth');
const { checkTenantActive, requirePlan } = require('../middleware/tenantMiddleware');
const { checkPlanLimits } = require('../middleware/tenantMiddleware');

// Toutes les routes nécessitent auth + tenant actif
router.use(auth, checkTenantActive);

// Routes publiques pour le tenant (même sans plan)
router.get('/dashboard', getDashboard);
router.get('/info', getTenantInfo);

// Routes qui nécessitent un plan
router.get('/settings', requirePlan, getTenantSettings);
router.put('/settings', requirePlan, updateTenantSettings);

// Gestion des membres de l'équipe
router.get('/team', requirePlan, getTeamMembers);
router.post('/team/invite', 
  requirePlan, 
  checkPlanLimits('users'), // Vérifie la limite d'utilisateurs
  inviteTeamMember
);
router.delete('/team/:userId', requirePlan, removeTeamMember);

// Statistiques
router.get('/stats', requirePlan, async (req, res) => {
  try {
    // Exemple de stats
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

module.exports = router;
// back/src/routes/planRoutes.js
const express = require('express');
const router = express.Router();
const { 
  checkPlanSelection, 
  getPlans, 
  selectPlan 
} = require('../controllers/planController');

const { auth } = require('../middleware/auth');
const { checkTenantActive } = require('../middleware/tenantMiddleware');

// ✅ Route publique - PAS D'AUTH !
router.get('/', getPlans);

// ✅ Routes protégées
router.use(auth);
router.get('/check', checkPlanSelection);
router.post('/select', checkTenantActive, selectPlan);

module.exports = router;
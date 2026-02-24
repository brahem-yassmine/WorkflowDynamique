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

// ✅ Public Route - NO AUTH!
router.get('/', getPlans);

// ✅ Protected Routes
router.use(auth);
router.get('/check', checkPlanSelection);
router.post('/select', checkTenantActive, selectPlan);

module.exports = router;
// back/src/routes/subscriptionRoutes.js
const express = require('express');
const router = express.Router();
const {
  getSubscriptionHistory,
  getCurrentSubscription,
  changePlan
} = require('../controllers/subscriptionController');
const { auth } = require('../middleware/auth');
const { checkTenantActive, requirePlan } = require('../middleware/tenantMiddleware');

// All routes require auth and active tenant
router.use(auth, checkTenantActive);

router.get('/history', getSubscriptionHistory);
router.get('/current', getCurrentSubscription);
// router.post('/change', requirePlan, changePlan);

module.exports = router;
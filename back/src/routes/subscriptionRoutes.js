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

// Toutes les routes nécessitent auth et tenant actif
router.use(auth, checkTenantActive);

router.get('/history', getSubscriptionHistory);
router.get('/current', getCurrentSubscription);
// router.post('/change', requirePlan, changePlan);

module.exports = router;
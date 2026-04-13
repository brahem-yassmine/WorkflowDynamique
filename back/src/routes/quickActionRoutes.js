// back/src/routes/quickActionRoutes.js
const express = require('express');
const router = express.Router();
const quickActionController = require('../controllers/QuickActionController');
const { auth } = require('../middleware/auth');

router.use(auth);

router.get('/', quickActionController.getQuickActions);
router.post('/', quickActionController.executeQuickAction);
router.post('/admin', quickActionController.createQuickAction); // Basic admin creation

module.exports = router;

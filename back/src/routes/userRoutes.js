//back/src/routes/userRoutes.js

const express = require('express');
const router = express.Router();
const { getUsers, createUser, updateUser, deleteUser } = require('../controllers/userController');
const { auth, requireRole } = require('../middleware/auth');
const { checkTenantActive, checkPlanLimits } = require('../middleware/tenantMiddleware');

// All routes require auth + active tenant
router.use(auth, checkTenantActive);

// Admin seulement pour la liste, création et suppression
router.get('/', requireRole('admin'), getUsers);
router.post('/', requireRole('admin'), checkPlanLimits('users'), createUser);
router.delete('/:userId', requireRole('admin'), deleteUser);

// Admin or the user themselves for update
router.put('/:userId', updateUser);

module.exports = router;
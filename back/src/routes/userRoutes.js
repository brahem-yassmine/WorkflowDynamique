//back/src/routes/userRoutes.js

const express = require('express');
const router = express.Router();
const { getUsers, createUser, updateUser, deleteUser, getUserTasks } = require('../controllers/userController');
const { auth, requireRole } = require('../middleware/auth');
const { checkTenantActive, checkPlanLimits } = require('../middleware/tenantMiddleware');

// All routes require auth + active tenant
router.use(auth, checkTenantActive);

// Get my tasks
router.get('/my/tasks', getUserTasks);

// Publicly accessible to tenant members for lookups
router.get('/', getUsers);
router.post('/', requireRole('admin'), checkPlanLimits('users'), createUser);
router.delete('/:userId', requireRole('admin'), deleteUser);

// Admin or the user themselves for update
router.put('/:userId', updateUser);

module.exports = router;
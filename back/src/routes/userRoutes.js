//back/src/routes/userRoutes.js

const express = require('express');
const router = express.Router();
const { getUsers, createUser, updateUser, deleteUser } = require('../controllers/userController');
const { auth, requireRole } = require('../middleware/auth');
const { checkTenantActive, checkPlanLimits } = require('../middleware/tenantMiddleware');

// Toutes les routes nécessitent auth + tenant actif
router.use(auth, checkTenantActive);

// Admin seulement pour la liste, création et suppression
router.get('/', requireRole('admin'), getUsers);
router.post('/', requireRole('admin'), checkPlanLimits('users'), createUser);
router.delete('/:userId', requireRole('admin'), deleteUser);

// Admin ou l'utilisateur lui-même pour la mise à jour
router.put('/:userId', updateUser);

module.exports = router;
//back/src/routes/userRoutes.js

const express = require('express');
const router = express.Router();
const { getUsers, createUser, updateUser } = require('../controllers/userController');
const { auth, requireRole } = require('../middleware/auth');
const { checkTenantActive, checkPlanLimits } = require('../middleware/tenantMiddleware');

// Toutes les routes nécessitent auth + tenant actif
router.use(auth, checkTenantActive);

// Admin seulement pour la liste et création
router.get('/', requireRole('admin'), getUsers);
router.post('/', requireRole('admin'), checkPlanLimits('users'), createUser);

// Admin ou l'utilisateur lui-même pour la mise à jour
router.put('/:userId', updateUser);

module.exports = router;
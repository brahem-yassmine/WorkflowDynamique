// back/src/routes/tenant/role.routes.js
const express = require('express');
const router = express.Router();
const RoleController = require('../../controllers/tenant/role.controller');
const { auth, requireRole } = require('../../middleware/auth');

router.use(auth);

// Routes
router.post('/', requireRole('admin'), RoleController.create);
router.get('/', RoleController.getAll); // Allow reading for all auth members
router.get('/active', RoleController.getActiveRoles);
router.get('/permissions', requireRole('admin'), RoleController.getAvailablePermissions);
router.get('/:id', requireRole('admin'), RoleController.getById);
router.put('/:id', requireRole('admin'), RoleController.update);
router.post('/:id/assign-users', requireRole('admin'), RoleController.assignUsers);
router.delete('/:id', requireRole('admin'), RoleController.delete);
router.post('/:id/permissions', requireRole('admin'), RoleController.addPermissions);
router.delete('/:id/permissions', requireRole('admin'), RoleController.removePermissions);

module.exports = router;
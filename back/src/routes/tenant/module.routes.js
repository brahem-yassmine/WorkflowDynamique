// back/src/routes/tenant/module.routes.js
const express = require('express');
const router = express.Router();
const ModuleController = require('../../controllers/tenant/module.controller');
const { auth, requireRole } = require('../../middleware/auth');

router.use(auth);

// Routes
router.post('/', requireRole('admin'), ModuleController.create);
router.get('/', ModuleController.getAll);
router.get('/:id', ModuleController.getById);
router.put('/:id', requireRole('admin'), ModuleController.update);
router.delete('/:id', requireRole('admin'), ModuleController.delete);

module.exports = router;

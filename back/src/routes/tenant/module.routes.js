// back/src/routes/tenant/module.routes.js
const express = require('express');
const router = express.Router();
const ModuleController = require('../../controllers/tenant/module.controller');
const { auth, hasPermission } = require('../../middleware/auth');

router.use(auth);

// Routes
router.post('/', hasPermission('Module.CREATE'), ModuleController.create);
router.get('/', ModuleController.getAll);
router.get('/:id', ModuleController.getById);
router.put('/:id', hasPermission('Module.UPDATE'), ModuleController.update);
router.delete('/:id', hasPermission('Module.DELETE'), ModuleController.delete);

module.exports = router;

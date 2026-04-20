// back/src/routes/tenant/domain.routes.js
const express = require('express');
const router = express.Router();
const DomainController = require('../../controllers/tenant/domain.controller');
const { auth, hasPermission } = require('../../middleware/auth');

router.use(auth);

// Routes
router.post('/', hasPermission('Domain.CREATE'), DomainController.create);
router.get('/', DomainController.getAll);
router.get('/active', DomainController.getActive);
router.get('/:id', DomainController.getById);
router.put('/:id', hasPermission('Domain.UPDATE'), DomainController.update);
router.delete('/:id', hasPermission('Domain.DELETE'), DomainController.delete);

module.exports = router;

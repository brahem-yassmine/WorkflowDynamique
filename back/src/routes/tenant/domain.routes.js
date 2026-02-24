// back/src/routes/tenant/domain.routes.js
const express = require('express');
const router = express.Router();
const DomainController = require('../../controllers/tenant/domain.controller');
const { auth, requireRole } = require('../../middleware/auth');

router.use(auth);

// Routes
router.post('/', requireRole('admin'), DomainController.create);
router.get('/', requireRole('admin'), DomainController.getAll);
router.get('/active', DomainController.getActive);
router.get('/:id', requireRole('admin'), DomainController.getById);
router.put('/:id', requireRole('admin'), DomainController.update);
router.delete('/:id', requireRole('admin'), DomainController.delete);

module.exports = router;

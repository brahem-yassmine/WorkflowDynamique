const express = require('express');
const router = express.Router();
const checklistController = require('../controllers/checklistController');
const { auth, hasPermission } = require('../middleware/auth');
const { tenantResolver } = require('../middleware/tenantMiddleware');

router.use(auth);
router.use(tenantResolver);

router.get('/', checklistController.getChecklists);
router.get('/:id', checklistController.getChecklistById);
router.post('/', hasPermission('Checklist.VIEW'), checklistController.createChecklist); // Usually creation of instance-checklist requires at least view
router.put('/:id', hasPermission('Checklist.VIEW'), checklistController.updateChecklist);
router.post('/:id/clone', hasPermission('Checklist.VIEW'), checklistController.cloneChecklist);
router.patch('/:id/tasks/:taskId/toggle', hasPermission('Checklist.COMPLETE_ITEM'), checklistController.toggleTaskStatus);
router.delete('/:id', hasPermission('Checklist.VIEW'), checklistController.deleteChecklist);

module.exports = router;

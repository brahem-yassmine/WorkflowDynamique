const express = require('express');
const router = express.Router();
const checklistController = require('../controllers/checklistController');
const { auth, hasPermission } = require('../middleware/auth');
const { tenantResolver } = require('../middleware/tenantMiddleware');

router.use(auth);
router.use(tenantResolver);

router.get('/', hasPermission('CHECKLIST_VIEW'), checklistController.getChecklists);
router.get('/:id', hasPermission('CHECKLIST_VIEW'), checklistController.getChecklistById);
router.post('/', hasPermission('CHECKLIST_CREATE'), checklistController.createChecklist);
router.put('/:id', hasPermission('CHECKLIST_EDIT'), checklistController.updateChecklist);
router.post('/:id/clone', hasPermission('CHECKLIST_CLONE'), checklistController.cloneChecklist);
router.patch('/:id/tasks/:taskId/toggle', hasPermission('CHECKLIST_EDIT'), checklistController.toggleTaskStatus);
router.delete('/:id', hasPermission('CHECKLIST_DELETE'), checklistController.deleteChecklist);

module.exports = router;

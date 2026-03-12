const express = require('express');
const router = express.Router();
const checklistController = require('../controllers/checklistController');
const { auth } = require('../middleware/auth');
const { tenantResolver } = require('../middleware/tenantMiddleware');

router.use(auth);
router.use(tenantResolver);

router.get('/', checklistController.getChecklists);
router.get('/:id', checklistController.getChecklistById);
router.post('/', checklistController.createChecklist);
router.put('/:id', checklistController.updateChecklist);
router.post('/:id/clone', checklistController.cloneChecklist);
router.patch('/:id/tasks/:taskId/toggle', checklistController.toggleTaskStatus);
router.delete('/:id', checklistController.deleteChecklist);

module.exports = router;

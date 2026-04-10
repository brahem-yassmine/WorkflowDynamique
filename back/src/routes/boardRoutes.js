const express = require('express');
const router = express.Router();
const boardController = require('../controllers/boardController');
const { auth, hasPermission } = require('../middleware/auth');
const { checkTenantActive } = require('../middleware/tenantMiddleware');

router.use(auth, checkTenantActive);

router.get('/', hasPermission('KANBAN_VIEW'), boardController.getBoards);
router.get('/:id', hasPermission('KANBAN_VIEW'), boardController.getBoardById);
router.post('/', hasPermission('KANBAN_CREATE'), boardController.createBoard);
router.patch('/:id', hasPermission('KANBAN_CLONE'), boardController.updateBoard); // Note: Patching for clone or update? Mapping to KANBAN_CLONE or EDIT?
router.post('/:id/clone', hasPermission('KANBAN_CLONE'), boardController.cloneBoard);
router.delete('/:id', hasPermission('KANBAN_DELETE'), boardController.deleteBoard);

module.exports = router;

const express = require('express');
const router = express.Router();
const boardController = require('../controllers/boardController');
const { auth } = require('../middleware/auth');
const { checkTenantActive } = require('../middleware/tenantMiddleware');

router.use(auth, checkTenantActive);

router.get('/', boardController.getBoards);
router.get('/:id', boardController.getBoardById);
router.post('/', boardController.createBoard);
router.patch('/:id', boardController.updateBoard);
router.post('/:id/clone', boardController.cloneBoard);
router.delete('/:id', boardController.deleteBoard);

module.exports = router;

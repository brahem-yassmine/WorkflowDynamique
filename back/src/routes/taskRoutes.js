const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { auth } = require('../middleware/auth');
const { checkTenantActive } = require('../middleware/tenantMiddleware');

router.use(auth, checkTenantActive);

router.get('/', taskController.getTasks);
router.post('/', taskController.createTask);
router.patch('/:id', taskController.updateTask);
router.delete('/:id', taskController.deleteTask);
router.post('/reorder', taskController.reorderTasks);

module.exports = router;


const express = require('express');
const router = express.Router();
const taskReportController = require('../controllers/TaskReportController');
const { auth } = require('../middleware/auth');

router.post('/', auth, taskReportController.createReport);
router.get('/my-requests', auth, taskReportController.getReportsForUser);
router.get('/all', auth, taskReportController.getAllReports);
router.patch('/:id', auth, taskReportController.updateReportStatus);

module.exports = router;

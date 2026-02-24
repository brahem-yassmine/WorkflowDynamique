// back/src/routes/workflowRoutes.js - FULL VERSION
const express = require('express');
const router = express.Router();

const {
  getWorkflows,
  getWorkflowById,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  executeWorkflow,
  changeWorkflowStatus,
  duplicateWorkflow
} = require('../controllers/workflowController');

const { auth } = require('../middleware/auth');
const { checkTenantActive } = require('../middleware/tenantMiddleware');

router.use(auth, checkTenantActive);

// Full CRUD
router.get('/', getWorkflows);                           // GET all
router.get('/:workflowId', getWorkflowById);            // GET one
router.post('/', createWorkflow);                        // CREATE
router.put('/:workflowId', updateWorkflow);             // UPDATE
router.delete('/:workflowId', deleteWorkflow);          // DELETE

// Special actions
router.post('/:workflowId/execute', executeWorkflow);    // Execute
router.post('/:workflowId/duplicate', duplicateWorkflow);  // Clone
router.patch('/:workflowId/status', changeWorkflowStatus); // Change status

module.exports = router;
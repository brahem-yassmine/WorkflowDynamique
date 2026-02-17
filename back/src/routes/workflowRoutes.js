// back/src/routes/workflowRoutes.js - VERSION COMPLÈTE
const express = require('express');
const router = express.Router();

const { 
  getWorkflows, 
  getWorkflowById,
  createWorkflow, 
  updateWorkflow,
  deleteWorkflow,
  executeWorkflow,
  changeWorkflowStatus
} = require('../controllers/workflowController');

const { auth } = require('../middleware/auth');
const { checkTenantActive } = require('../middleware/tenantMiddleware');

router.use(auth, checkTenantActive);

// CRUD complet
router.get('/', getWorkflows);                           // GET tous
router.get('/:workflowId', getWorkflowById);            // GET un
router.post('/', createWorkflow);                        // CREATE
router.put('/:workflowId', updateWorkflow);             // UPDATE
router.delete('/:workflowId', deleteWorkflow);          // DELETE

// Actions spéciales
router.post('/:workflowId/execute', executeWorkflow);    // Exécuter
router.patch('/:workflowId/status', changeWorkflowStatus); // Changer statut

module.exports = router;
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
  duplicateWorkflow,
  getWorkflowMembers
} = require('../controllers/workflowController');

const { auth, hasPermission } = require('../middleware/auth');
const { checkTenantActive, checkPlanLimits } = require('../middleware/tenantMiddleware');

router.use(auth, checkTenantActive);

// Full CRUD
router.get('/', hasPermission('Workflow.VIEW'), getWorkflows);                           
router.get('/:workflowId', hasPermission('Workflow.VIEW'), getWorkflowById);            
router.get('/:workflowId/members', hasPermission('Workflow.VIEW'), getWorkflowMembers);   
router.post('/', hasPermission('Workflow.CREATE'), checkPlanLimits('workflows'), createWorkflow);                        
router.put('/:workflowId', hasPermission('Workflow.UPDATE'), checkPlanLimits('nodes'), updateWorkflow);             
router.delete('/:workflowId', hasPermission('Workflow.DELETE'), deleteWorkflow);          

// Special actions
router.post('/:workflowId/execute', hasPermission('Workflow.EXECUTE'), executeWorkflow);    
router.post('/:workflowId/duplicate', hasPermission('Workflow.CREATE'), duplicateWorkflow);  
router.patch('/:workflowId/status', hasPermission('Workflow.UPDATE'), changeWorkflowStatus); 

module.exports = router;
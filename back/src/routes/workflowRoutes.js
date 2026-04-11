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
router.get('/', hasPermission('WORKFLOW_VIEW'), getWorkflows);                           
router.get('/:workflowId', hasPermission('WORKFLOW_VIEW'), getWorkflowById);            
router.get('/:workflowId/members', hasPermission('WORKFLOW_VIEW'), getWorkflowMembers);   
router.post('/', hasPermission('WORKFLOW_CREATE'), checkPlanLimits('workflows'), createWorkflow);                        
router.put('/:workflowId', hasPermission('WORKFLOW_EDIT'), checkPlanLimits('nodes'), updateWorkflow);             
router.delete('/:workflowId', hasPermission('WORKFLOW_DELETE'), deleteWorkflow);          

// Special actions
router.post('/:workflowId/execute', hasPermission('TASK_ACTION'), executeWorkflow);    
router.post('/:workflowId/duplicate', hasPermission('WORKFLOW_CLONE'), duplicateWorkflow);  
router.patch('/:workflowId/status', hasPermission('WORKFLOW_EDIT'), changeWorkflowStatus); 

module.exports = router;
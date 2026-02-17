// back/src/routes/workflowInstanceRoutes.js
const express = require('express');
const router = express.Router();

const {
  createInstance,
  getInstances,
  getInstanceById,
  approveStep,
  rejectStep,
  cancelInstance,
  addAttachment,
  getInstanceStats
} = require('../controllers/WorkflowInstanceController.js');

const { auth } = require('../middleware/auth');
const { checkTenantActive } = require('../middleware/tenantMiddleware');

// Toutes les routes nécessitent auth + tenant actif
router.use(auth, checkTenantActive);

// CRUD des instances
router.post('/', createInstance);                    // POST /api/workflow-instances
router.get('/', getInstances);                       // GET /api/workflow-instances
router.get('/stats', getInstanceStats);              // GET /api/workflow-instances/stats
router.get('/:instanceId', getInstanceById);         // GET /api/workflow-instances/:id

// Actions sur les instances
router.post('/:instanceId/approve', approveStep);    // POST /api/workflow-instances/:id/approve
router.post('/:instanceId/reject', rejectStep);      // POST /api/workflow-instances/:id/reject
router.post('/:instanceId/cancel', cancelInstance);  // POST /api/workflow-instances/:id/cancel
router.post('/:instanceId/attachments', addAttachment); // POST /api/workflow-instances/:id/attachments

module.exports = router;
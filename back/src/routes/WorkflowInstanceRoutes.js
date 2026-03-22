// back/src/routes/workflowInstanceRoutes.js
const express = require('express');
const router = express.Router();

const {
  createInstance,
  getInstances,
  getInstanceById,
  approveNode,
  rejectNode,
  lockNode,
  cancelInstance,
  deleteInstance,
  addAttachment,
  removeAttachment,
  getInstanceStats,
  updateNodeData
} = require('../controllers/WorkflowInstanceController.js');

const { auth } = require('../middleware/auth');
const { checkTenantActive } = require('../middleware/tenantMiddleware');

// All routes require auth + active tenant
router.use(auth, checkTenantActive);

// Instances CRUD
router.post('/', createInstance);                    // POST /api/workflow-instances
router.get('/', getInstances);                       // GET /api/workflow-instances
router.get('/stats', getInstanceStats);              // GET /api/workflow-instances/stats
router.get('/:instanceId', getInstanceById);         // GET /api/workflow-instances/:id
router.delete('/:instanceId', deleteInstance);      // DELETE /api/workflow-instances/:id

// Actions on instances
router.post('/:instanceId/approve', approveNode);    // POST /api/workflow-instances/:id/approve
router.post('/:instanceId/reject', rejectNode);      // POST /api/workflow-instances/:id/reject
router.post('/:instanceId/lock', lockNode);          // POST /api/workflow-instances/:id/lock // Added lock route
router.post('/:instanceId/cancel', cancelInstance);  // POST /api/workflow-instances/:id/cancel
router.post('/:instanceId/attachments', addAttachment); // POST /api/workflow-instances/:id/attachments
router.delete('/:instanceId/attachments/:attachmentId', removeAttachment); // DELETE /api/workflow-instances/:id/attachments/:attachmentId
router.patch('/:instanceId/update-node', updateNodeData); // PATCH /api/workflow-instances/:id/update-node

module.exports = router;
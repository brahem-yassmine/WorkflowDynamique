// back/src/routes/formRoutes.js
const express = require('express');
const router = express.Router();

const {
    getForms,
    getFormById,
    createForm,
    updateForm,
    deleteForm,
    submitResponse,
    updateFormStatus
} = require('../controllers/formController');

const { auth, hasPermission } = require('../middleware/auth');
const { checkTenantActive } = require('../middleware/tenantMiddleware');

// Public routes (if any, e.g., submitting a response might be public if the form is public)
// For now, let's keep everything protected as per the existing pattern
router.use(auth, checkTenantActive);

router.get('/', getForms);
router.get('/:id', getFormById);
router.post('/', hasPermission('Form.CREATE'), createForm);
router.patch('/:id', hasPermission('Form.UPDATE'), updateForm);
router.delete('/:id', hasPermission('Form.DELETE'), deleteForm);
router.post('/:id/submit', hasPermission('Form.VIEW'), submitResponse);
router.patch('/:id/status', hasPermission('Form.UPDATE'), updateFormStatus);

module.exports = router;

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

const { auth } = require('../middleware/auth');
const { checkTenantActive } = require('../middleware/tenantMiddleware');

// Public routes (if any, e.g., submitting a response might be public if the form is public)
// For now, let's keep everything protected as per the existing pattern
router.use(auth, checkTenantActive);

router.get('/', getForms);
router.get('/:id', getFormById);
router.post('/', createForm);
router.patch('/:id', updateForm);
router.delete('/:id', deleteForm);
router.post('/:id/submit', submitResponse);
router.patch('/:id/status', updateFormStatus);

module.exports = router;

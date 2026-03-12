// back/src/routes/dynamicFormRoutes.js
const express = require('express');
const router = express.Router();

const {
    getForms,
    getFormById,
    createForm,
    updateForm,
    deleteForm,
    updateFormStatus,
    submitForm,
    cloneForm
} = require('../controllers/dynamicFormController');

const { auth } = require('../middleware/auth');
const { checkTenantActive } = require('../middleware/tenantMiddleware');

// Toutes les routes nécessitent une auth et un tenant actif
router.use(auth, checkTenantActive);

// CRUD de base
router.get('/', getForms);
router.get('/:formId', getFormById);
router.post('/', createForm);
router.put('/:formId', updateForm);
router.patch('/:formId', updateForm);
router.delete('/:formId', deleteForm);
router.patch('/:formId/status', updateFormStatus);
router.post('/:formId/submit', submitForm);
router.post('/:formId/clone', cloneForm);

module.exports = router;

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

const { auth, hasPermission } = require('../middleware/auth');
const { checkTenantActive } = require('../middleware/tenantMiddleware');

// Toutes les routes nécessitent une auth et un tenant actif
router.use(auth, checkTenantActive);

// CRUD de base
router.get('/', hasPermission('FORM_VIEW'), getForms);
router.get('/:formId', hasPermission('FORM_VIEW'), getFormById);
router.post('/', hasPermission('FORM_CREATE'), createForm);
router.put('/:formId', hasPermission('FORM_EDIT'), updateForm);
router.patch('/:formId', hasPermission('FORM_EDIT'), updateForm);
router.delete('/:formId', hasPermission('FORM_DELETE'), deleteForm);
router.patch('/:formId/status', hasPermission('FORM_MANAGE_STATUS'), updateFormStatus);
router.post('/:formId/submit', hasPermission('FORM_FILL'), submitForm);
router.post('/:formId/clone', hasPermission('FORM_CLONE'), cloneForm);

module.exports = router;

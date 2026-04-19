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
router.get('/', getForms);
router.get('/:formId', getFormById);
router.post('/', hasPermission('Form.CREATE'), createForm);
router.put('/:formId', hasPermission('Form.UPDATE'), updateForm);
router.patch('/:formId', hasPermission('Form.UPDATE'), updateForm);
router.delete('/:formId', hasPermission('Form.DELETE'), deleteForm);
router.patch('/:formId/status', hasPermission('Form.UPDATE'), updateFormStatus);
router.post('/:formId/submit', hasPermission('Form.SUBMIT'), submitForm);
router.post('/:formId/clone', hasPermission('Form.CREATE'), cloneForm);

module.exports = router;

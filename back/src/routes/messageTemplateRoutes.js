// back/src/routes/messageTemplateRoutes.js
const express = require('express');
const router = express.Router();
const messageTemplateController = require('../controllers/messageTemplateController');
const { auth } = require('../middleware/auth');

router.use(auth);
router.get('/', messageTemplateController.getTemplates);
router.post('/', messageTemplateController.createTemplate);
router.put('/:id', messageTemplateController.updateTemplate);
router.delete('/:id', messageTemplateController.deleteTemplate);

module.exports = router;

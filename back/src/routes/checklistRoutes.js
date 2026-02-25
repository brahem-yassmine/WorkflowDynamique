// back/src/routes/checklistRoutes.js
const express = require('express');
const router = express.Router();

const {
    getChecklists,
    getChecklistById,
    createChecklist,
    updateChecklist,
    deleteChecklist
} = require('../controllers/checklistController');

const { auth } = require('../middleware/auth');
const { checkTenantActive } = require('../middleware/tenantMiddleware');

// Protected routes
router.use(auth, checkTenantActive);

router.get('/', getChecklists);
router.get('/:id', getChecklistById);
router.post('/', createChecklist);
router.put('/:id', updateChecklist);
router.delete('/:id', deleteChecklist);

module.exports = router;

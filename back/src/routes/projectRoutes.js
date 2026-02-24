// back/src/routes/projectRoutes.js
const express = require('express');
const router = express.Router();

const {
    getProjects,
    getProjectById,
    createProject,
    updateProject,
    deleteProject
} = require('../controllers/projectController');

const { auth, requireRole } = require('../middleware/auth');
const { checkTenantActive } = require('../middleware/tenantMiddleware');

router.use(auth, checkTenantActive);

router.get('/', getProjects);
router.get('/:projectId', getProjectById);
router.post('/', requireRole('admin'), createProject);
router.put('/:projectId', requireRole('admin'), updateProject);
router.delete('/:projectId', requireRole('admin'), deleteProject);

module.exports = router;

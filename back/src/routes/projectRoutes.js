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

const { auth, hasPermission } = require('../middleware/auth');
const { checkTenantActive } = require('../middleware/tenantMiddleware');

router.use(auth, checkTenantActive);

router.get('/', getProjects);
router.get('/:projectId', getProjectById);
router.post('/', hasPermission('Project.CREATE'), createProject);
router.put('/:projectId', hasPermission('Project.UPDATE'), updateProject);
router.delete('/:projectId', hasPermission('Project.DELETE'), deleteProject);

module.exports = router;

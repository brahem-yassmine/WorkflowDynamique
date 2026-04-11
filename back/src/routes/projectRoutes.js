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

router.get('/', hasPermission('PROJECT_VIEW'), getProjects);
router.get('/:projectId', hasPermission('PROJECT_VIEW'), getProjectById);
router.post('/', hasPermission('PROJECT_CREATE'), createProject);
router.put('/:projectId', hasPermission('PROJECT_EDIT'), updateProject);
router.delete('/:projectId', hasPermission('PROJECT_DELETE'), deleteProject);

module.exports = router;

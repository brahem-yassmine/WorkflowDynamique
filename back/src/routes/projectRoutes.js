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
router.post('/', createProject);
router.put('/:projectId', updateProject);
router.delete('/:projectId', deleteProject);

module.exports = router;

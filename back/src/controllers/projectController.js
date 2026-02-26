// back/src/controllers/projectController.js
const { recordActivity } = require('../services/auditLogger');

// ============================================
// 1. LIST ALL PROJECTS
// ============================================
exports.getProjects = async (req, res) => {
    try {
        const Project = req.tenantConn.model('Project');
        const projects = await Project.find().sort({ createdAt: -1 });

        res.json({
            success: true,
            count: projects.length,
            data: projects
        });
    } catch (error) {
        console.error('❌ getProjects Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// ============================================
// 2. GET PROJECT BY ID
// ============================================
exports.getProjectById = async (req, res) => {
    try {
        const { projectId } = req.params;
        const Project = req.tenantConn.model('Project');
        const project = await Project.findById(projectId);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        res.json({
            success: true,
            data: project
        });
    } catch (error) {
        console.error('❌ getProjectById Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// ============================================
// 3. CREATE NEW PROJECT
// ============================================
exports.createProject = async (req, res) => {
    try {
        const { name, description, status } = req.body;
        const Project = req.tenantConn.model('Project');

        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Name is required'
            });
        }

        const project = new Project({
            name,
            description: description || '',
            status: status || 'planning',
            createdBy: req.user.userId
        });

        await project.save();

        // Log the activity
        await recordActivity(req, 'CREATE_PROJECT', {
            type: 'Project',
            id: project._id,
            name: project.name
        });

        res.status(201).json({
            success: true,
            message: 'Project created successfully',
            data: project
        });
    } catch (error) {
        console.error('❌ createProject Error:', error);

        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation error: ' + errors.join(', ')
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error: ' + error.message
        });
    }
};

// ============================================
// 4. UPDATE PROJECT
// ============================================
exports.updateProject = async (req, res) => {
    try {
        const { projectId } = req.params;
        const updates = req.body;
        const Project = req.tenantConn.model('Project');

        const project = await Project.findByIdAndUpdate(projectId, updates, { new: true });

        if (project) {
            // Log the activity
            await recordActivity(req, 'UPDATE_PROJECT', {
                type: 'Project',
                id: project._id,
                name: project.name
            });
        }

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        res.json({
            success: true,
            message: 'Project updated successfully',
            data: project
        });
    } catch (error) {
        console.error('❌ updateProject Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// ============================================
// 5. DELETE PROJECT
// ============================================
exports.deleteProject = async (req, res) => {
    try {
        const { projectId } = req.params;
        const Project = req.tenantConn.model('Project');
        const Workflow = req.tenantConn.model('Workflow');

        // Check if there are linked workflows
        const workflowsCount = await Workflow.countDocuments({ projectId });

        if (workflowsCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Deletion impossible: ${workflowsCount} workflow(s) are linked to this project.`
            });
        }

        const project = await Project.findByIdAndDelete(projectId);

        if (project) {
            // Log the activity
            await recordActivity(req, 'DELETE_PROJECT', {
                type: 'Project',
                id: project._id,
                name: project.name
            });
        }

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        res.json({
            success: true,
            message: 'Project deleted successfully'
        });
    } catch (error) {
        console.error('❌ deleteProject Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

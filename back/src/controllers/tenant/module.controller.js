// back/src/controllers/tenant/module.controller.js
const { recordActivity } = require('../../services/auditLogger');

class ModuleController {
    static getModel(req) {
        if (!req.tenantConn) {
            throw new Error('Tenant connection not available');
        }
        return req.tenantConn.model('Module');
    }

    // Create a module
    static async create(req, res) {
        try {
            const Module = ModuleController.getModel(req);
            const { name, description, domainId, isActive } = req.body;

            if (!name || !domainId) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Name and Domain ID are required' 
                });
            }

            const module = new Module({
                name,
                description,
                domainId,
                isActive: isActive !== undefined ? isActive : true,
                createdBy: req.user.userId
            });

            await module.save();

            // Log activity
            await recordActivity(req, 'CREATE_MODULE', {
                type: 'Module',
                id: module._id,
                name: module.name,
                domainId: module.domainId
            });

            res.status(201).json({ success: true, data: module });
        } catch (error) {
            console.error('❌ ModuleController.create Error:', error);
            res.status(400).json({ success: false, message: error.message });
        }
    }

    // Get all modules
    static async getAll(req, res) {
        try {
            const Module = ModuleController.getModel(req);
            const { domainId } = req.query;
            
            let query = {};
            if (domainId) {
                query.domainId = domainId;
            }

            const modules = await Module.find(query)
                .populate('domainId', 'name')
                .sort({ name: 1 });
                
            res.json({ success: true, data: modules });
        } catch (error) {
            console.error('❌ ModuleController.getAll Error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    // Get module by ID
    static async getById(req, res) {
        try {
            const Module = ModuleController.getModel(req);
            const module = await Module.findById(req.params.id).populate('domainId', 'name');
            if (!module) {
                return res.status(404).json({ success: false, message: 'Module not found' });
            }
            res.json({ success: true, data: module });
        } catch (error) {
            console.error('❌ ModuleController.getById Error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    // Update module
    static async update(req, res) {
        try {
            const Module = ModuleController.getModel(req);
            const module = await Module.findByIdAndUpdate(req.params.id, req.body, { new: true });
            
            if (!module) {
                return res.status(404).json({ success: false, message: 'Module not found' });
            }

            // Log activity
            await recordActivity(req, 'UPDATE_MODULE', {
                type: 'Module',
                id: module._id,
                name: module.name
            });

            res.json({ success: true, data: module });
        } catch (error) {
            console.error('❌ ModuleController.update Error:', error);
            res.status(400).json({ success: false, message: error.message });
        }
    }

    // Delete module
    static async delete(req, res) {
        try {
            const Module = ModuleController.getModel(req);
            const Workflow = req.tenantConn.model('Workflow');

            // Check if there are linked workflows (templates)
            const workflowsCount = await Workflow.countDocuments({ moduleId: req.params.id });

            if (workflowsCount > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Deletion impossible: ${workflowsCount} workflow(s) are linked to this module.`
                });
            }

            const module = await Module.findByIdAndDelete(req.params.id);
            if (!module) {
                return res.status(404).json({ success: false, message: 'Module not found' });
            }

            // Log activity
            await recordActivity(req, 'DELETE_MODULE', {
                type: 'Module',
                id: module._id,
                name: module.name
            });

            res.json({ success: true, message: 'Module deleted successfully' });
        } catch (error) {
            console.error('❌ ModuleController.delete Error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = ModuleController;

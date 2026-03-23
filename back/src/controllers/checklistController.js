// back/src/controllers/checklistController.js

exports.getChecklists = async (req, res) => {
    try {
        if (!req.tenantConn) {
            console.error('❌ Error: req.tenantConn is undefined');
            return res.status(500).json({ success: false, message: 'Erreur serveur: Connection non résolue' });
        }

        console.log('🔍 Fetching checklists for tenant:', req.tenantId);
        const Checklist = req.tenantConn.model('Checklist');
        const { workflowId } = req.query;
        let query = workflowId ? { workflowId } : {};

        if (req.user && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            const mongoose = require('mongoose');
            const Workflow = req.tenantConn.model('Workflow');
            const WorkflowInstance = req.tenantConn.model('WorkflowInstance');
            const userDomain = req.user.domain || '';
            const domainsToMatch = [userDomain];
            if (userDomain.toUpperCase() === 'HR' || userDomain.toUpperCase() === 'RH') {
                domainsToMatch.push(userDomain.toUpperCase() === 'HR' ? 'RH' : 'HR');
            }
            const globalKeywords = ['GLOBAL', 'ALL', 'PUBLIC', 'TOUS', 'EVERYONE'];
            const userId = req.user.id || req.user.userId || req.user._id;
            const userObjectId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId;

            const allowedWorkflows = await Workflow.find({
                $or: [
                    { domain: { $in: domainsToMatch } },
                    { domain: { $in: globalKeywords } },
                    { domain: { $in: globalKeywords.map(k => k.toLowerCase()) } },
                    { createdBy: userObjectId }
                ]
            }).select('_id');
            const allowedWorkflowIds = allowedWorkflows.map(w => w._id.toString());

            const activeInstances = await WorkflowInstance.find({
                $or: [
                    { 'currentNodes.responsibleDomain': { $in: domainsToMatch.map(d => new RegExp(`^${d}$`, 'i')) } },
                    { 'currentNodes.responsibleUser': userObjectId },
                    { 'currentNodes.assignees': userObjectId },
                    { createdBy: userObjectId }
                ]
            }).select('_id workflowId');

            const activeWorkflowIds = activeInstances.map(inst => inst.workflowId?.toString()).filter(Boolean);
            const activeInstanceIds = activeInstances.map(inst => inst._id.toString());

            const allAllowedWorkflowIds = [...new Set([...allowedWorkflowIds, ...activeWorkflowIds])];

            query.$or = [
                { createdBy: userId },
                { workflowId: { $in: allAllowedWorkflowIds } },
                { instanceId: { $in: activeInstanceIds } }
            ];
        }

        const checklists = await Checklist.find(query)
            .sort({ createdAt: -1 })
            .populate({
                path: 'workflowId',
                select: 'name projectId status',
                populate: {
                    path: 'projectId',
                    select: 'name'
                }
            });
            
        console.log(`✅ ${checklists.length} checklists found`);
        res.json({ success: true, count: checklists.length, data: checklists });
    } catch (error) {
        console.error('❌ Erreur getChecklists details:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
    }
};

exports.getChecklistById = async (req, res) => {
    try {
        const { id } = req.params;
        const Checklist = req.tenantConn.model('Checklist');
        const checklist = await Checklist.findById(id);
        if (!checklist) return res.status(404).json({ success: false, message: 'Checklist non trouvée' });
        res.json({ success: true, data: checklist });
    } catch (error) {
        console.error('❌ Erreur getChecklistById:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
    }
};

exports.createChecklist = async (req, res) => {
    try {
        const { name, tasks, description, workflowId } = req.body;
        const Checklist = req.tenantConn.model('Checklist');

        const checklist = new Checklist({
            name: name || 'Nouvelle Checklist',
            description: description || '',
            tasks: tasks || [],
            status: req.body.status || 'draft',
            createdBy: req.user.id,
            workflowId
        });

        await checklist.save();
        res.status(201).json({ success: true, data: checklist });
    } catch (error) {
        console.error('❌ Erreur createChecklist:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
    }
};

exports.updateChecklist = async (req, res) => {
    try {
        const { id } = req.params;
        const Checklist = req.tenantConn.model('Checklist');
        const checklist = await Checklist.findByIdAndUpdate(id, req.body, { new: true });
        if (!checklist) return res.status(404).json({ success: false, message: 'Checklist non trouvée' });
        res.json({ success: true, data: checklist });
    } catch (error) {
        console.error('❌ Erreur updateChecklist:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
    }
};

exports.deleteChecklist = async (req, res) => {
    try {
        const { id } = req.params;
        const Checklist = req.tenantConn.model('Checklist');
        const checklist = await Checklist.findByIdAndDelete(id);
        if (!checklist) return res.status(404).json({ success: false, message: 'Checklist non trouvée' });
        res.json({ success: true, message: 'Checklist supprimée' });
    } catch (error) {
        console.error('❌ Erreur deleteChecklist:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
    }
};

exports.cloneChecklist = async (req, res) => {
    try {
        const { id } = req.params;
        const Checklist = req.tenantConn.model('Checklist');
        const originalChecklist = await Checklist.findById(id);

        if (!originalChecklist) {
            return res.status(404).json({ success: false, message: 'Checklist original non trouvé' });
        }

        const newChecklist = new Checklist({
            name: `${originalChecklist.name} (copy)`,
            description: originalChecklist.description || '',
            tasks: originalChecklist.tasks,
            status: originalChecklist.status || 'draft',
            createdBy: req.user.id
        });

        await newChecklist.save();
        res.status(201).json({ success: true, data: newChecklist });
    } catch (error) {
        console.error('❌ Erreur cloneChecklist:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
    }
};

exports.toggleTaskStatus = async (req, res) => {
    try {
        const { id, taskId } = req.params;
        const Checklist = req.tenantConn.model('Checklist');
        const checklist = await Checklist.findById(id);

        if (!checklist) {
            return res.status(404).json({ success: false, message: 'Checklist non trouvée' });
        }

        const taskIndex = checklist.tasks.findIndex(t => t.id === taskId);
        if (taskIndex === -1) {
            return res.status(404).json({ success: false, message: 'Tâche non trouvée' });
        }

        // Toggle status
        checklist.tasks[taskIndex].completed = !checklist.tasks[taskIndex].completed;

        // Auto update overall status if all tasks are completed
        const allCompleted = checklist.tasks.every(t => t.completed);
        checklist.status = allCompleted ? 'completed' : 'draft';

        await checklist.save();

        res.json({ success: true, data: checklist });
    } catch (error) {
        console.error('❌ Erreur toggleTaskStatus:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
    }
};

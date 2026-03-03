// back/src/controllers/checklistController.js

exports.getChecklists = async (req, res) => {
    try {
        if (!req.tenantConn) {
            console.error('❌ Error: req.tenantConn is undefined');
            return res.status(500).json({ success: false, message: 'Erreur serveur: Connection non résolue' });
        }

        console.log('🔍 Fetching checklists for tenant:', req.tenantId);
        const Checklist = req.tenantConn.model('Checklist');
        const checklists = await Checklist.find().sort({ createdAt: -1 });
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
        const { name, tasks, description } = req.body;
        const Checklist = req.tenantConn.model('Checklist');

        const checklist = new Checklist({
            name: name || 'Nouvelle Checklist',
            description: description || '',
            tasks: tasks || [],
            status: req.body.status || 'draft',
            createdBy: req.user.id
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

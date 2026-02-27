// back/src/controllers/checklistController.js

exports.getChecklists = async (req, res) => {
    try {
        const Checklist = req.tenantConn.model('Checklist');
        const checklists = await Checklist.find().sort({ createdAt: -1 });
        res.json({ success: true, count: checklists.length, data: checklists });
    } catch (error) {
        console.error('❌ Erreur getChecklists:', error);
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
        const { name, tasks } = req.body;
        const Checklist = req.tenantConn.model('Checklist');

        const checklist = new Checklist({
            name: name || 'Nouvelle Checklist',
            tasks: tasks || [],
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
            tasks: originalChecklist.tasks,
            createdBy: req.user.id
        });

        await newChecklist.save();
        res.status(201).json({ success: true, data: newChecklist });
    } catch (error) {
        console.error('❌ Erreur cloneChecklist:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
    }
};

// back/src/controllers/dynamicFormController.js

// 1. Lister tous les formulaires
exports.getForms = async (req, res) => {
    try {
        const DynamicForm = req.tenantConn.model('DynamicForm');
        const forms = await DynamicForm.find().sort({ createdAt: -1 });

        res.json({
            success: true,
            count: forms.length,
            data: forms
        });
    } catch (error) {
        console.error('❌ Erreur getForms:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

// 2. Récupérer un formulaire par ID
exports.getFormById = async (req, res) => {
    try {
        const { formId } = req.params;
        const DynamicForm = req.tenantConn.model('DynamicForm');
        const form = await DynamicForm.findById(formId);

        if (!form) {
            return res.status(404).json({ success: false, message: 'Formulaire non trouvé' });
        }

        res.json({ success: true, data: form });
    } catch (error) {
        console.error('❌ Erreur getFormById:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

// 3. Créer un nouveau formulaire
exports.createForm = async (req, res) => {
    try {
        const { name, description, steps } = req.body;
        const DynamicForm = req.tenantConn.model('DynamicForm');

        if (!name) {
            return res.status(400).json({ success: false, message: 'Le nom est requis' });
        }

        const form = new DynamicForm({
            name,
            description: description || '',
            steps: steps || [{ id: 'step-' + Date.now(), title: 'Step 1', fields: [], status: 'pending' }],
            createdBy: req.user.id,
            status: 'draft'
        });

        await form.save();

        res.status(201).json({
            success: true,
            message: 'Formulaire créé avec succès',
            data: form
        });
    } catch (error) {
        console.error('❌ Erreur createForm:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
    }
};

// 4. Mettre à jour un formulaire
exports.updateForm = async (req, res) => {
    try {
        const { formId } = req.params;
        const updates = req.body;
        const DynamicForm = req.tenantConn.model('DynamicForm');

        const form = await DynamicForm.findByIdAndUpdate(formId, updates, { new: true, runValidators: true });

        if (!form) {
            return res.status(404).json({ success: false, message: 'Formulaire non trouvé' });
        }

        res.json({
            success: true,
            message: 'Formulaire mis à jour',
            data: form
        });
    } catch (error) {
        console.error('❌ Erreur updateForm:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

// 5. Supprimer un formulaire
exports.deleteForm = async (req, res) => {
    try {
        const { formId } = req.params;
        const DynamicForm = req.tenantConn.model('DynamicForm');

        const form = await DynamicForm.findByIdAndDelete(formId);

        if (!form) {
            return res.status(404).json({ success: false, message: 'Formulaire non trouvé' });
        }

        res.json({
            success: true,
            message: 'Formulaire supprimé avec succès',
            data: { id: formId }
        });
    } catch (error) {
        console.error('❌ Erreur deleteForm:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

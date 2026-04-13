// back/src/controllers/dynamicFormController.js
const { recordActivity } = require('../services/auditLogger');

// 1. Lister tous les formulaires
exports.getForms = async (req, res) => {
    try {
        if (!req.tenantConn) {
            return res.status(400).json({ success: false, message: 'Tenant connection missing. Please provide x-tenant-id header.' });
        }
        const DynamicForm = req.tenantConn.model('DynamicForm');
        const forms = await DynamicForm.find().sort({ createdAt: -1 });

        res.json({
            success: true,
            count: forms.length,
            data: forms
        });
    } catch (error) {
        console.error('❌ Erreur getForms:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// 2. Récupérer un formulaire par ID
exports.getFormById = async (req, res) => {
    try {
        const { formId } = req.params;
        const DynamicForm = req.tenantConn.model('DynamicForm');
        const form = await DynamicForm.findById(formId);

        if (!form) {
            return res.status(404).json({ success: false, message: 'Form not found' });
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
            return res.status(400).json({ success: false, message: 'Name is required' });
        }

        const form = new DynamicForm({
            name,
            description: description || '',
            steps: steps || [{ id: 'step-' + Date.now(), title: 'Step 1', fields: [], status: 'pending' }],
            createdBy: req.user.id || req.user.userId || req.user._id,
            status: 'draft'
        });

        console.log('User Payload in form creation:', req.user);
        console.log('Creating Form:', form);

        await form.save();

        // Log the activity
        await recordActivity(req, 'CREATE_FORM', {
            type: 'Form',
            id: form._id,
            name: form.name
        });

        res.status(201).json({
            success: true,
            message: 'Form created successfully',
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

        // Log the activity
        await recordActivity(req, 'UPDATE_FORM', {
            type: 'Form',
            id: form._id,
            name: form.name
        });

        res.json({
            success: true,
            message: 'Form updated',
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

        // Log the activity
        await recordActivity(req, 'DELETE_FORM', {
            type: 'Form',
            id: form._id,
            name: form.name
        });

        res.json({
            success: true,
            message: 'Form deleted successfully',
            data: { id: formId }
        });
    } catch (error) {
        console.error('❌ Erreur deleteForm:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

// 6. Mettre à jour le statut du formulaire
exports.updateFormStatus = async (req, res) => {
    try {
        const { formId } = req.params;
        const { status } = req.body;
        const DynamicForm = req.tenantConn.model('DynamicForm');

        if (!['approved', 'rejected', 'pending', 'draft', 'completed', 'published'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Statut invalide' });
        }

        // On met à jour le statut du formulaire ET de toutes ses étapes pour la cohérence UI
        const form = await DynamicForm.findById(formId);
        if (!form) {
            return res.status(404).json({ success: false, message: 'Formulaire non trouvé' });
        }

        form.status = status;
        // Optionnel : mettre à jour le statut de chaque étape si nécessaire
        form.steps = form.steps.map(step => ({ ...step.toObject(), status }));

        await form.save();

        res.json({
            success: true,
            message: `Form ${status === 'approved' ? 'approved' : 'rejected'} successfully`,
            data: form
        });
    } catch (error) {
        console.error('❌ Erreur updateFormStatus:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

// 7. Soumettre une réponse
exports.submitForm = async (req, res) => {
    try {
        const { formId } = req.params;
        const { data, name, description } = req.body;
        const DynamicForm = req.tenantConn.model('DynamicForm');
        const FormResponse = req.tenantConn.model('FormResponse');

        const form = await DynamicForm.findById(formId);
        if (!form) {
            return res.status(404).json({ success: false, message: 'Formulaire non trouvé' });
        }

        const response = new FormResponse({
            formId: formId,
            data,
            name: name || 'Form Submission',
            description: description || '',
            submittedBy: req.user ? req.user.id : null
        });

        await response.save();

        // Sync the parent form's name and description if provided
        if (name) form.name = name;
        if (description) form.description = description;

        // Increment submission count
        form.submissionCount = (form.submissionCount || 0) + 1;
        await form.save();

        // ✅ WORKFLOW INTEGRATION: Update Instance Variables
        const { instanceId, nodeId } = req.body;
        if (instanceId && nodeId) {
            try {
                const WorkflowInstance = req.tenantConn.model('WorkflowInstance');
                const instance = await WorkflowInstance.findById(instanceId);
                if (instance) {
                    // Store the data in variables
                    if (!instance.variables) instance.variables = new Map();
                    instance.variables.set(nodeId, data);
                    instance.variables.set(`${nodeId}_data`, data);
                    instance.variables.set(`${nodeId}_executed`, true);
                    instance.variables.set(`${nodeId}_name`, name || 'Submission');
                    
                    instance.markModified('variables');
                    await instance.save();
                    console.log(`✅ [DynamicFormCtrl] Synced form data to Instance ${instanceId} / Node ${nodeId}`);
                }
            } catch (err) {
                console.error('❌ [DynamicFormCtrl] Workflow Sync Error:', err);
            }
        }

        res.status(201).json({
            success: true,
            message: 'Response submitted successfully',
            data: response
        });
    } catch (error) {
        console.error('❌ Erreur submitForm:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};
// 8. Cloner un formulaire
exports.cloneForm = async (req, res) => {
    try {
        const { formId } = req.params;
        const DynamicForm = req.tenantConn.model('DynamicForm');

        const originalForm = await DynamicForm.findById(formId);
        if (!originalForm) {
            return res.status(404).json({ success: false, message: 'Formulaire non trouvé' });
        }

        // Convert to plain object and remove _id to prevent conflicts
        const formObj = originalForm.toObject();

        // Remove MongoDB internal fields
        delete formObj._id;
        delete formObj.createdAt;
        delete formObj.updatedAt;
        delete formObj.__v;

        // Strip _id from steps and fields to let Mongoose generate new ones
        if (formObj.steps) {
            formObj.steps.forEach(step => {
                delete step._id;
                if (step.fields) {
                    step.fields.forEach(field => {
                        delete field._id;
                    });
                }
            });
        }

        const clonedForm = new DynamicForm({
            ...formObj,
            name: `${formObj.name} (Copie)`,
            createdBy: req.user.id,
            submissionCount: formObj.submissionCount || 0,
            publishedAt: null
        });

        await clonedForm.save();

        // Log the activity
        await recordActivity(req, 'CLONE_FORM', {
            type: 'Form',
            id: clonedForm._id,
            name: clonedForm.name
        }, { originalFormId: formId });

        res.status(201).json({
            success: true,
            message: 'Form cloned successfully',
            data: clonedForm
        });
    } catch (error) {
        console.error('❌ Erreur cloneForm:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
    }
};

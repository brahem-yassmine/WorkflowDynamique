// back/src/controllers/formController.js

// ============================================
// 1. CREATE NEW FORM
// ============================================
exports.createForm = async (req, res) => {
    try {
        console.log('📦 CreateForm Body:', JSON.stringify(req.body, null, 2));
        console.log('👤 CreateForm User:', req.user);

        const { name, description, steps } = req.body;
        const Form = req.tenantConn.model('Form');

        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Form name is required'
            });
        }

        const userId = req.user?.userId || req.user?.id || req.user?._id;

        if (!userId) {
            console.error('❌ User ID not found in token payload');
            return res.status(401).json({
                success: false,
                message: 'Not authenticated: User identity could not be resolved from token.'
            });
        }

        const form = new Form({
            name,
            description: description || '',
            steps: steps || [],
            createdBy: userId
        });

        await form.save();

        res.status(201).json({
            success: true,
            message: 'Form created successfully',
            data: form
        });

    } catch (error) {
        console.error('❌ createForm Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error: ' + error.message,
            stack: error.stack,
            error: error
        });
    }
};

// ============================================
// 2. GET ALL FORMS
// ============================================
exports.getForms = async (req, res) => {
    try {
        const Form = req.tenantConn.model('Form');
        const forms = await Form.find().sort({ createdAt: -1 });

        res.json({
            success: true,
            count: forms.length,
            data: forms
        });

    } catch (error) {
        console.error('❌ getForms Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// ============================================
// 3. GET FORM BY ID
// ============================================
exports.getFormById = async (req, res) => {
    try {
        const { id } = req.params;
        const Form = req.tenantConn.model('Form');
        const form = await Form.findById(id);

        if (!form) {
            return res.status(404).json({
                success: false,
                message: 'Form not found'
            });
        }

        res.json({
            success: true,
            data: form
        });

    } catch (error) {
        console.error('❌ getFormById Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// ============================================
// 4. SUBMIT FORM RESPONSE
// ============================================
exports.submitResponse = async (req, res) => {
    try {
        const { id } = req.params;
        const { data, name, description } = req.body;
        const Form = req.tenantConn.model('Form');
        const FormResponse = req.tenantConn.model('FormResponse');

        const form = await Form.findById(id);
        if (!form) {
            return res.status(404).json({
                success: false,
                message: 'Form not found'
            });
        }

        const response = new FormResponse({
            formId: id,
            name: name || 'Form Submission',
            description,
            data,
            submittedBy: req.user ? req.user.userId : null
        });

        await response.save();

        res.status(201).json({
            success: true,
            message: 'Response submitted successfully',
            data: response
        });

    } catch (error) {
        console.error('❌ submitResponse Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// ============================================
// 5. UPDATE FORM STATUS (MANUAL)
// ============================================
exports.updateFormStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const Form = req.tenantConn.model('Form');

        if (!['pending', 'approved', 'rejected'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const form = await Form.findByIdAndUpdate(id, {
            $set: { 'steps.$[].status': status }
        }, { new: true });

        if (!form) {
            return res.status(404).json({ success: false, message: 'Form not found' });
        }

        res.json({
            success: true,
            message: `Form status updated to ${status}`,
            data: form
        });

    } catch (error) {
        console.error('❌ updateFormStatus Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// ============================================
// 5. UPDATE FORM
// ============================================
exports.updateForm = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const Form = req.tenantConn.model('Form');

        const form = await Form.findByIdAndUpdate(id, updates, { new: true, runValidators: true });

        if (!form) {
            return res.status(404).json({
                success: false,
                message: 'Form not found'
            });
        }

        res.json({
            success: true,
            message: 'Form updated successfully',
            data: form
        });

    } catch (error) {
        console.error('❌ updateForm Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// ============================================
// 6. DELETE FORM
// ============================================
exports.deleteForm = async (req, res) => {
    try {
        const { id } = req.params;
        const Form = req.tenantConn.model('Form');
        const FormResponse = req.tenantConn.model('FormResponse');

        const form = await Form.findByIdAndDelete(id);

        if (!form) {
            return res.status(404).json({
                success: false,
                message: 'Form not found'
            });
        }

        // Optionally delete all responses for this form
        await FormResponse.deleteMany({ formId: id });

        res.json({
            success: true,
            message: 'Form and associated responses deleted successfully'
        });

    } catch (error) {
        console.error('❌ deleteForm Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

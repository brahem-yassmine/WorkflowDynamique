// back/src/controllers/formController.js

// ============================================
// 1. CREATE NEW FORM
// ============================================
exports.createForm = async (req, res) => {
    try {
        console.log('📦 CreateForm Body:', JSON.stringify(req.body, null, 2));
        console.log('👤 CreateForm User:', req.user);

        const { name, description, steps, workflowId } = req.body;
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
            createdBy: userId,
            workflowId: workflowId || undefined
        });

        await form.save();

        // Notify Admins
        try {
            const NotificationController = require('./notificationController');
            const UserModel = req.tenantConn.model('User');
            const admins = await UserModel.find({ role: 'admin' });

            for (const admin of admins) {
                await NotificationController.createInternalNotification(req.tenantConn, {
                    recipient: admin._id,
                    title: 'New Form Created',
                    message: `A new form "${name}" has been created by ${req.user.email || 'a user'}.`,
                    type: 'system',
                    link: `/admin/form`
                });
            }
        } catch (err) {
            console.error('Form Notification Error:', err);
        }

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
        
        // Match Checklist behavior: extract workflowId from query if provided
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
                { workflowId: { $in: allAllowedWorkflowIds } }
                // Forms usually don't have instanceId, but we include it if they ever do
            ];
        }

        const forms = await Form.find(query)
            .sort({ createdAt: -1 })
            .populate({
                path: 'workflowId',
                select: 'name projectId',
                populate: {
                    path: 'projectId',
                    select: 'name'
                }
            });

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
                    
                    // Mark node as partially completed if needed or just save
                    instance.markModified('variables');
                    await instance.save();
                    console.log(`✅ [FormCtrl] Synced form data to Instance ${instanceId} / Node ${nodeId}`);
                }
            } catch (err) {
                console.error('❌ [FormCtrl] Workflow Sync Error:', err);
            }
        }

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

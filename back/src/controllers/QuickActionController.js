const { getStandardWorkflow } = require('../utils/quickActionDefaults');
const { cloneAndStartWorkflow } = require('../services/workflowExecutionService');

// 1. LIST QUICK ACTIONS
exports.getQuickActions = async (req, res) => {
    try {
        console.log('🔍 [QuickActionCtrl] Fetching all active quick actions');
        const QuickAction = req.tenantConn.model('QuickAction');
        const actions = await QuickAction.find({ isActive: true })
            .populate('moduleId', 'name')
            .populate('templateId', 'name');
            
        res.json({ success: true, data: actions });
    } catch (error) {
        console.error('❌ getQuickActions Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// 2. EXECUTE QUICK ACTION
exports.executeQuickAction = async (req, res) => {
    try {
        const { actionId, formData, projectId: userProjectId } = req.body;
        const QuickAction = req.tenantConn.model('QuickAction');
        const Workflow = req.tenantConn.model('Workflow');
        const Project = req.tenantConn.model('Project');
        const Domain = req.tenantConn.model('Domain');
        const Module = req.tenantConn.model('Module');

        if (!actionId) {
            console.warn('⚠️ [QuickActionCtrl] Missing actionId in request');
            return res.status(400).json({ success: false, message: 'Action identifier is required' });
        }

        if (!req.tenantConn) {
            console.error('❌ [QuickActionCtrl] No tenant connection found in request!');
            return res.status(500).json({ success: false, message: 'Tenant database connection not established' });
        }

        // 1. Find Action (by ID or by Key)
        let action = null;
        if (actionId.match(/^[0-9a-fA-F]{24}$/)) {
            action = await QuickAction.findById(actionId);
        } else {
            action = await QuickAction.findOne({ key: actionId });
        }

        // 2. Find or Create Template
        let template = null;
        if (action && action.templateId) {
            template = await Workflow.findById(action.templateId);
        }

        // 3. Fallback to Standard Templates if missing
        if (!template) {
            const key = action ? action.key : actionId;
            const standardFlow = getStandardWorkflow(key);
            if (standardFlow) {
                console.log(`📡 Initializing standard template for: ${key}`);
                
                // CRITICAL: Get a default Domain and Module for the template
                let defaultDomain = await Domain.findOne();
                let defaultModule = await Module.findOne();
                
                // If they don't exist, we might need a safer fallback or error
                if (!defaultDomain) {
                    return res.status(400).json({ success: false, message: 'No Domain found. Please create a Domain first.' });
                }
                if (!defaultModule) {
                   // Create a default "Standard" module if missing
                   defaultModule = new Module({
                       name: 'Standard Operations',
                       domainId: defaultDomain._id,
                       status: 'active',
                       createdBy: req.user.id
                   });
                   await defaultModule.save();
                }

                template = new Workflow({
                    ...standardFlow,
                    domainId: defaultDomain._id,
                    moduleId: defaultModule._id,
                    isTemplate: true,
                    status: 'active',
                    createdBy: req.user.id
                });
                await template.save();

                // If action didn't exist or didn't have template linked, update it
                if (action) {
                    action.templateId = template._id;
                    action.moduleId = defaultModule._id; // Sync module
                    action.formSchema = standardFlow.formSchema; // Preserve schema
                    await action.save();
                } else {
                    // Create the QuickAction record on the fly
                    action = new QuickAction({
                        name: standardFlow.name,
                        key: key,
                        templateId: template._id,
                        moduleId: defaultModule._id,
                        formSchema: standardFlow.formSchema, // Critical for UI
                        isActive: true,
                        createdBy: req.user.id
                    });
                    await action.save();
                }
            }
        }

        if (!template) {
            return res.status(404).json({ success: false, message: 'Workflow template not found for this action.' });
        }

        // 4. Resolve Project
        let projectId = userProjectId;
        if (!projectId) {
            let defaultProject = await Project.findOne({ name: 'Quick Actions' });
            if (!defaultProject) {
                defaultProject = new Project({
                    name: 'Quick Actions',
                    description: 'Unified project for all rapid business processes.',
                    status: 'active',
                    createdBy: req.user.id
                });
                await defaultProject.save();
            }
            projectId = defaultProject._id;
        }

        // 5. Dynamic Assignment Mapping (SMART LOGIC)
        // We override template node assignments based on form data selectors
        if (formData) {
            const key = action ? action.key : actionId;
            const updatedNodes = JSON.parse(JSON.stringify(template.nodes)); // Deep copy to avoid mutating cache
            
            let mapping = {};
            if (key === 'purchase_request') {
                mapping = { 'node_1': formData.managerApprover, 'node_2': formData.financeValidator };
            } else if (key === 'document_creation') {
                mapping = { 'node_2': formData.reviewer, 'node_4': formData.validator };
            } else if (key === 'payment_request') {
                mapping = { 'node_1': formData.financeApprover };
            } else if (key === 'transport_request') {
                mapping = { 'node_1': formData.logisticsManager, 'node_2': formData.driver };
            }

            updatedNodes.forEach(node => {
                if (mapping[node.id]) {
                    node.data = {
                        ...node.data,
                        assignmentType: 'SINGLE',
                        assigneeSelectionType: 'user',
                        assignedTo: mapping[node.id]
                    };
                }
            });
            template.nodes = updatedNodes;
        }

        // 6. Use service to clone and start
        const { workflow, instance } = await cloneAndStartWorkflow(
            req.tenantConn,
            template,
            req.user,
            {
                title: `${action?.name || template.name}: ${formData?.title || formData?.productName || formData?.documentName || 'Smart Process'}`,
                projectId,
                data: formData,
                priority: formData?.priority || 'medium'
            }
        );

        res.status(201).json({
            success: true,
            message: 'Quick action executed successfully',
            data: {
                workflowId: workflow._id,
                instanceId: instance._id
            }
        });

    } catch (error) {
        console.error('❌ [QuickActionCtrl] Critical Execution Error:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Execution error',
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined 
        });
    }
};

// 3. CREATE QUICK ACTION (Admin only)
exports.createQuickAction = async (req, res) => {
    try {
        const QuickAction = req.tenantConn.model('QuickAction');
        const action = new QuickAction({
            ...req.body,
            createdBy: req.user.id
        });
        await action.save();
        res.status(201).json({ success: true, data: action });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

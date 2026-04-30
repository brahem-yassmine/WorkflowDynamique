// back/src/services/checklistService.js
const mongoose = require('mongoose');

/**
 * Node types that should be included in a checklist.
 */
const CHECKLIST_NODE_TYPES = [
    'TASK', 'task', 
    'ACTION', 'action', 
    'CONDITION', 'condition', 
    'APPROVAL', 'approval', 
    'FORM', 'form', 
    'DOCUMENT', 'document', 
    'SUB_WORKFLOW', 'sub_workflow'
];

/**
 * Generates checklist tasks from workflow nodes.
 */
function _getTasksFromNodes(nodes) {
    return (nodes || [])
        .filter(node => CHECKLIST_NODE_TYPES.includes(node.type))
        .map(node => ({
            id: node.id,
            title: node.data?.label || node.config?.label || (
                node.type.toLowerCase().includes('condition') ? 'Condition' : 
                node.type.toLowerCase().includes('approval') ? 'Approval' : 'Step'
            ),
            completed: false,
            priority: node.data?.priority || node.config?.priority || 'medium'
        }));
}

/**
 * Synchronizes a checklist for a workflow template.
 */
async function syncWorkflowChecklist(tenantConn, workflow, userId) {
    try {
        const Checklist = tenantConn.model('Checklist');
        const tasks = _getTasksFromNodes(workflow.nodes);

        if (tasks.length === 0) return null;

        const checklistName = `Workflow: ${workflow.name}`;
        
        const checklist = await Checklist.findOneAndUpdate(
            { workflowId: workflow._id, instanceId: { $exists: false } },
            {
                name: checklistName,
                tasks: tasks,
                description: `Automated checklist for workflow protocol: "${workflow.name}"`,
                createdBy: userId,
                workflowId: workflow._id,
                status: workflow.status || 'draft'
            },
            { new: true, upsert: true }
        );

        console.log(`✅ Checklist synchronized for template: ${workflow.name}`);
        return checklist;
    } catch (error) {
        console.error('❌ syncWorkflowChecklist Error:', error.message);
        return null;
    }
}

/**
 * Creates a checklist for a workflow instance.
 */
async function createInstanceChecklist(tenantConn, instance, workflow, userId) {
    try {
        const Checklist = tenantConn.model('Checklist');
        const tasks = _getTasksFromNodes(workflow.nodes);

        if (tasks.length === 0) return null;

        const checklist = new Checklist({
            name: `Checklist: ${instance.title || workflow.name}`,
            description: `Execution checklist for instance: ${instance.title || instance._id}`,
            tasks: tasks,
            createdBy: userId,
            status: workflow.status === 'active' ? 'active' : 'draft',
            instanceId: instance._id,
            workflowId: workflow._id
        });

        await checklist.save();
        console.log(`✅ Checklist created for instance: ${instance._id}`);
        return checklist;
    } catch (error) {
        console.error('❌ createInstanceChecklist Error:', error.message);
        return null;
    }
}

module.exports = {
    syncWorkflowChecklist,
    createInstanceChecklist
};

// back/src/services/workflowExecutionService.js
const mongoose = require('mongoose');

/**
 * Clones a workflow template and starts an execution instance.
 * @param {Object} tenantConn - Tenant database connection
 * @param {Object} template - Workflow template object
 * @param {Object} user - User initiating the action
 * @param {Object} options - { title, description, projectId, data, priority }
 */
async function cloneAndStartWorkflow(tenantConn, template, user, options = {}) {
    const Workflow = tenantConn.model('Workflow');
    const WorkflowInstance = tenantConn.model('WorkflowInstance');
    const Checklist = tenantConn.model('Checklist');
    const UserModel = tenantConn.model('User');
    const NotificationController = require('../controllers/notificationController');

    // 1. Clone Workflow definition
    const nodeMap = {};
    const newNodes = template.nodes.map(node => {
        const newId = `node_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;
        nodeMap[node.id] = newId;
        return { ...node, id: newId };
    });

    const newEdges = template.edges.map(edge => ({
        ...edge,
        id: `edge_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`,
        source: nodeMap[edge.source],
        target: nodeMap[edge.target]
    }));

    const workflow = new Workflow({
        name: options.title || `${template.name} - ${new Date().toLocaleString()}`,
        description: options.description || template.description,
        domainId: template.domainId,
        nodes: newNodes,
        edges: newEdges,
        status: 'active',
        isTemplate: false,
        projectId: options.projectId,
        createdBy: user.id || user._id
    });

    await workflow.save();

    // 2. Identify Start Node
    const startNode = workflow.nodes.find(n => n.type === 'start');
    if (!startNode) throw new Error('Workflow template has no start node');

    // 3. Create Instance
    const instance = new WorkflowInstance({
        workflowId: workflow._id,
        createdBy: user.id || user._id,
        title: workflow.name,
        description: workflow.description,
        data: options.data || {},
        variables: new Map(Object.entries(options.data || {})),
        status: 'in_progress',
        priority: options.priority || 'medium',
        timeStarted: new Date(),
        executionPath: [{
            nodeId: startNode.id,
            nodeType: 'start',
            action: 'start',
            performedBy: user.id || user._id,
            timestamp: new Date()
        }],
        history: [{
            action: 'instance_created',
            title: 'Démarrage via Quick Action',
            performedBy: user.id || user._id,
            comments: 'Instance démarrée automatiquement'
        }]
    });

    // 4. Handle initial transition (Auto-progress from Start node)
    // We need to find the next nodes after Start
    const nextEdges = workflow.edges.filter(e => e.source === startNode.id);
    const initialNodes = [];

    for (const edge of nextEdges) {
        const targetNode = workflow.nodes.find(n => n.id === edge.target);
        if (targetNode && targetNode.type !== 'end') {
            const nodeData = targetNode.data || {};
            
            // Basic assignment logic (simplified version of WorkflowInstanceController)
            let respUser = null;
            let respDomain = nodeData.responsibleDomain || nodeData.domain;
            
            if (nodeData.assignmentType === 'SINGLE' && nodeData.assigneeSelectionType === 'user') {
                respUser = nodeData.assignedTo;
            }

            initialNodes.push({
                nodeId: targetNode.id,
                status: 'in_progress',
                startedAt: new Date(),
                responsibleUser: respUser,
                responsibleDomain: respDomain,
                assignees: nodeData.assigneeIds || []
            });
        }
    }

    instance.currentNodes = initialNodes;
    await instance.save();

    // 5. Create Checklist
    const checklistTasks = workflow.nodes
        .filter(node => node.type === 'action' || node.type === 'condition' || node.type === 'task')
        .map(node => ({
            id: node.id,
            title: node.data?.label || 'Étape',
            completed: false,
            priority: node.data?.priority || 'medium'
        }));

    const checklist = new Checklist({
        name: `Checklist: ${instance.title}`,
        tasks: checklistTasks,
        createdBy: user.id || user._id,
        status: 'draft',
        instanceId: instance._id,
        workflowId: workflow._id
    });
    await checklist.save();
    instance.checklistId = checklist._id;
    await instance.save();

    return { workflow, instance };
}

module.exports = { cloneAndStartWorkflow };

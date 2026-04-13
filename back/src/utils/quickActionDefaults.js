// back/src/utils/quickActionDefaults.js

const createNode = (id, type, label, data = {}) => ({
    id,
    type,
    position: { x: Math.random() * 400, y: Math.random() * 400 },
    data: { label, ...data }
});

const createEdge = (source, target) => ({
    id: `e-${source}-${target}-${Math.random().toString(36).substr(2, 5)}`,
    source,
    target,
    animated: true
});

const getStandardWorkflow = (key) => {
    switch (key) {
        case 'purchase_request':
            return {
                name: "Intelligent Purchase Protocol",
                formSchema: [
                    { id: "productName", type: "text", label: "Product Name", placeholder: "Ex: MacBook Pro M3", required: true },
                    { id: "quantity", type: "number", label: "Quantity", placeholder: "1", required: true },
                    { id: "estimatedBudget", type: "number", label: "Estimated Budget ($)", placeholder: "2500", required: true },
                    { id: "supplierName", type: "text", label: "Supplier Name", placeholder: "Apple Inc." },
                    { id: "managerApprover", type: "user", label: "Manager Approver", placeholder: "Select your direct manager", required: true },
                    { id: "financeValidator", type: "user", label: "Finance Validator", placeholder: "Select finance officer", required: true },
                    { id: "priority", type: "select", label: "Priority", options: ["High", "Medium", "Low"], required: true },
                    { id: "deadline", type: "date", label: "Required Deadline", required: true }
                ],
                nodes: [
                    createNode('start', 'start', 'Start'),
                    createNode('node_1', 'action', 'Manager Approval', { assignmentType: 'SINGLE', label: 'Review Purchase Request' }),
                    createNode('node_2', 'action', 'Finance Validation', { assignmentType: 'SINGLE', label: 'Validate Financial Impact' }),
                    createNode('node_3', 'action', 'Final Approval', { assignmentType: 'SINGLE', label: 'Executive Clearance' }),
                    createNode('node_4', 'task', 'Generate Purchase Order', { assignmentType: 'AUTOMATIC', label: 'PO Creation' }),
                    createNode('end', 'end', 'End')
                ],
                edges: [
                    createEdge('start', 'node_1'),
                    createEdge('node_1', 'node_2'),
                    createEdge('node_2', 'node_3'),
                    createEdge('node_3', 'node_4'),
                    createEdge('node_4', 'end')
                ]
            };
        case 'document_creation':
            return {
                name: "Dynamic Document Lifecycle",
                formSchema: [
                    { id: "documentName", type: "text", label: "Document Name", placeholder: "Ex: Q2 Marketing Plan", required: true },
                    { id: "documentType", type: "select", label: "Document Type", options: ["Contract", "Invoice", "Report", "Policy"], required: true },
                    { id: "description", type: "textarea", label: "Document Description", placeholder: "Briefly explain the intent...", required: true },
                    { id: "reviewer", type: "user", label: "Document Reviewer", placeholder: "Assign a peer reviewer", required: true },
                    { id: "validator", type: "user", label: "Final Validator", placeholder: "Select final authority", required: true },
                    { id: "uploadFile", type: "file", label: "Attach Document Draft", required: true }
                ],
                nodes: [
                    createNode('start', 'start', 'Start'),
                    createNode('node_1', 'task', 'Document Drafting', { assignmentType: 'SINGLE', label: 'Initial Submission' }),
                    createNode('node_2', 'action', 'Peer Review', { assignmentType: 'SINGLE', label: 'Verification Step' }),
                    createNode('node_3', 'task', 'Refinement', { assignmentType: 'SINGLE', label: 'Apply Changes' }),
                    createNode('node_4', 'action', 'Final Validation', { assignmentType: 'SINGLE', label: 'Compliance Sign-off' }),
                    createNode('node_5', 'task', 'Central Archiving', { assignmentType: 'AUTOMATIC', label: 'System Storage' }),
                    createNode('end', 'end', 'End')
                ],
                edges: [
                    createEdge('start', 'node_1'),
                    createEdge('node_1', 'node_2'),
                    createEdge('node_2', 'node_3'),
                    createEdge('node_3', 'node_4'),
                    createEdge('node_4', 'node_5'),
                    createEdge('node_5', 'end')
                ]
            };
        case 'payment_request':
            return {
                name: "Automated Payment Workflow",
                formSchema: [
                    { id: "amount", type: "number", label: "Transaction Amount ($)", placeholder: "500", required: true },
                    { id: "paymentType", type: "select", label: "Payment Type", options: ["Cash", "Bank Transfer", "Check"], required: true },
                    { id: "reason", type: "textarea", label: "Business Reason", placeholder: "Detailed justification for payment", required: true },
                    { id: "financeApprover", type: "user", label: "Finance Approver", placeholder: "Select authorizing officer", required: true },
                    { id: "invoiceFile", type: "file", label: "Invoice Attachment", required: true }
                ],
                nodes: [
                    createNode('start', 'start', 'Start'),
                    createNode('node_1', 'action', 'Finance Validation', { assignmentType: 'SINGLE', label: 'Verify Invoice & Funds' }),
                    createNode('node_2', 'task', 'Payment Execution', { assignmentType: 'AUTOMATIC', label: 'Bank Transfer Protocol' }),
                    createNode('node_3', 'task', 'Payment Confirmation', { assignmentType: 'SINGLE', label: 'Receipt Upload' }),
                    createNode('end', 'end', 'End')
                ],
                edges: [
                    createEdge('start', 'node_1'),
                    createEdge('node_1', 'node_2'),
                    createEdge('node_2', 'node_3'),
                    createEdge('node_3', 'end')
                ]
            };
        case 'transport_request':
            return {
                name: "Logistics Orchestration",
                formSchema: [
                    { id: "destination", type: "text", label: "Destination Point", placeholder: "Ex: Warehouse 7, Block B", required: true },
                    { id: "transportDate", type: "date", label: "Execution Date", required: true },
                    { id: "cargoType", type: "text", label: "Cargo Specifications", placeholder: "Ex: 2 Tons, Fragile Electronics", required: true },
                    { id: "logisticsManager", type: "user", label: "Logistics Coordinator", placeholder: "Route to logistics team", required: true },
                    { id: "driver", type: "user", label: "Assigned Driver", placeholder: "Select transport personnel", required: true }
                ],
                nodes: [
                    createNode('start', 'start', 'Start'),
                    createNode('node_1', 'action', 'Logistics Coordination', { assignmentType: 'SINGLE', label: 'Assign Vehicle & Route' }),
                    createNode('node_2', 'task', 'Transport Execution', { assignmentType: 'SINGLE', label: 'On-road Logistics' }),
                    createNode('node_3', 'action', 'Delivery Confirmation', { assignmentType: 'SINGLE', label: 'Post-delivery Verification' }),
                    createNode('end', 'end', 'End')
                ],
                edges: [
                    createEdge('start', 'node_1'),
                    createEdge('node_1', 'node_2'),
                    createEdge('node_2', 'node_3'),
                    createEdge('node_3', 'end')
                ]
            };
        default:
            return null;
    }
};

module.exports = { getStandardWorkflow };

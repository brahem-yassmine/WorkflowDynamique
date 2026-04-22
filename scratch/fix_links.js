const mongoose = require('mongoose');

async function fixWorkflow() {
    try {
        console.log("Connecting to mongo...");
        await mongoose.connect('mongodb://localhost:27017/workflow_dynamique?authSource=admin');
        const db = mongoose.connection;
        
        // Since it's a multi-tenant app, I need to check all tenant DBs or find the right one.
        // Let's assume it's in the default 'workflow_dynamique' for now or list collections.
        const collections = await db.db.listCollections().toArray();
        console.log("Collections:", collections.map(c => c.name));

        const Workflow = db.collection('workflows');
        const workflow = await Workflow.findOne({ name: /Request/i }); // Try to find by name
        
        if (workflow) {
            console.log("Found workflow:", workflow.name, workflow._id);
            // I'll look for the nodes by label
            const nodes = workflow.nodes;
            const managerNode = nodes.find(n => n.data?.label?.includes('Manager'));
            const financeNode = nodes.find(n => n.data?.label?.includes('Financière'));
            const approvalNode = nodes.find(n => n.data?.label?.includes('Approbation'));
            const rejectedNode = nodes.find(n => n.data?.label?.includes('Rejetée'));
            
            let newEdges = [...workflow.edges];
            
            if (managerNode && financeNode && !newEdges.some(e => e.source === managerNode.id && e.target === financeNode.id)) {
                console.log("Adding link Manager -> Finance");
                newEdges.push({ id: 'edge_fix_1', source: managerNode.id, target: financeNode.id, sourceHandle: 'yes', label: 'Yes' });
            }
            if (financeNode && approvalNode && !newEdges.some(e => e.source === financeNode.id && e.target === approvalNode.id)) {
                console.log("Adding link Finance -> Approval");
                newEdges.push({ id: 'edge_fix_2', source: financeNode.id, target: approvalNode.id, sourceHandle: 'yes', label: 'Yes' });
            }
            
            // Add rejected links if missing
            [managerNode, financeNode, approvalNode].forEach((node, i) => {
                if (node && rejectedNode && !newEdges.some(e => e.source === node.id && e.target === rejectedNode.id)) {
                    console.log(`Adding link ${node.data.label} -> Rejected`);
                    newEdges.push({ id: `edge_fix_rej_${i}`, source: node.id, target: rejectedNode.id, sourceHandle: 'no', label: 'No' });
                }
            });

            await Workflow.updateOne({ _id: workflow._id }, { $set: { edges: newEdges } });
            console.log("Workflow updated successfully!");
        } else {
            console.log("Workflow not found with broad search.");
        }
        
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
fixWorkflow();

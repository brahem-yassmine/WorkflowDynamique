const mongoose = require('mongoose');

async function fixWorkflow() {
    try {
        console.log("Connecting to mongo...");
        await mongoose.connect('mongodb://localhost:27017/workflow_dynamique?authSource=admin');
        const admin = mongoose.connection.db.admin();
        const dbs = await admin.listDatabases();
        
        for (const dbInfo of dbs.databases) {
            const dbName = dbInfo.name;
            if (dbName === 'admin' || dbName === 'local' || dbName === 'config') continue;
            
            console.log(`Checking DB: ${dbName}`);
            const db = mongoose.connection.useDb(dbName);
            const Workflow = db.collection('workflows');
            const workflow = await Workflow.findOne({ name: /Demande/i }); // Broad search
            
            if (workflow) {
                console.log(`Found workflow "${workflow.name}" in DB: ${dbName}`);
                const nodes = workflow.nodes;
                const managerNode = nodes.find(n => n.data?.label?.toLowerCase().includes('manager'));
                const financeNode = nodes.find(n => n.data?.label?.toLowerCase().includes('finan'));
                const approvalNode = nodes.find(n => n.data?.label?.toLowerCase().includes('approb'));
                const rejectedNode = nodes.find(n => n.data?.label?.toLowerCase().includes('rejet'));
                
                let newEdges = [...workflow.edges];
                let count = 0;
                
                if (managerNode && financeNode && !newEdges.some(e => e.source === managerNode.id && e.target === financeNode.id)) {
                    newEdges.push({ id: `fixed_edge_${Date.now()}_1`, source: managerNode.id, target: financeNode.id, sourceHandle: 'yes', label: 'Yes' });
                    count++;
                }
                if (financeNode && approvalNode && !newEdges.some(e => e.source === financeNode.id && e.target === approvalNode.id)) {
                    newEdges.push({ id: `fixed_edge_${Date.now()}_2`, source: financeNode.id, target: approvalNode.id, sourceHandle: 'yes', label: 'Yes' });
                    count++;
                }
                
                [managerNode, financeNode, approvalNode].forEach((node, i) => {
                    if (node && rejectedNode && !newEdges.some(e => e.source === node.id && e.target === rejectedNode.id)) {
                        newEdges.push({ id: `fixed_edge_rej_${Date.now()}_${i}`, source: node.id, target: rejectedNode.id, sourceHandle: 'no', label: 'No' });
                        count++;
                    }
                });

                if (count > 0) {
                    await Workflow.updateOne({ _id: workflow._id }, { $set: { edges: newEdges } });
                    console.log(`Updated workflow with ${count} new edges.`);
                } else {
                    console.log("No missing edges found in this match.");
                }
            }
        }
        
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
fixWorkflow();

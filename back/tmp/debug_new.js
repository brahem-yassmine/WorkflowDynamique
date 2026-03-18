const mongoose = require('mongoose');

async function debug() {
  try {
    const dbName = 'tenant_israbrahem_1773843513119';
    const conn = await mongoose.createConnection(`mongodb://localhost:27017/${dbName}`).asPromise();
    
    // We get the models dynamically from the connection
    const Workflow = conn.model('Workflow', new mongoose.Schema({ nodes: Array, edges: Array, workflowId: String }, { strict: false }));
    const Instance = conn.model('WorkflowInstance', new mongoose.Schema({ workflowId: mongoose.Schema.Types.ObjectId, currentNodes: Array, status: String, title: String }, { strict: false }));
    
    const instances = await Instance.find({ status: 'in_progress' });
    
    for (const inst of instances) {
      console.log(`\n--- Instance: ${inst.title} [${inst._id}] ---`);
      console.log(`Current Nodes in Instance: ${inst.currentNodes.map(n => n.nodeId).join(', ')}`);
      
      const workflow = await Workflow.findById(inst.workflowId);
      if (workflow) {
        console.log(`Workflow Definition [${workflow._id}]:`);
        workflow.nodes.forEach(n => {
          const assignment = n.data?.assignedTo || n.data?.responsibleDomain || n.data?.validatorIds || n.data?.assignedUser;
          console.log(`  - Node: ${n.id} Type: ${n.type} Label: ${n.data?.label} | Assignment Strategy: ${n.data?.assignmentType} | Assigned: ${assignment}`);
        });
        console.log(`Edges:`);
        workflow.edges.forEach(e => console.log(`  - ${e.source} -> ${e.target}`));
      } else {
          console.log(`Workflow not found for ID: ${inst.workflowId}`);
      }
    }
    
    await conn.close();
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

debug();

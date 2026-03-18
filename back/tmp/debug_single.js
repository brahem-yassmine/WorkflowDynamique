const mongoose = require('mongoose');

async function debug() {
  try {
    const dbName = 'tenant_israbrahem_1773843513119';
    const conn = await mongoose.createConnection(`mongodb://localhost:27017/${dbName}`).asPromise();
    
    // We get the models dynamically from the connection
    const Instance = conn.model('WorkflowInstance', new mongoose.Schema({}, { strict: false }));
    
    const targetId = '69bad297479efed24713176d';
    const inst = await Instance.findById(targetId);
    
    if (inst) {
      console.log(`\nDetailed Data for 69bad297479efed24713176d:`);
      console.log(`Status: ${inst.status}`);
      console.log(`Current Nodes: ${JSON.stringify(inst.currentNodes, null, 2)}`);
      console.log(`CreatedBy: ${inst.createdBy}`);
      console.log(`WorkflowId: ${inst.workflowId}`);
    } else {
      console.log('Instance not found');
    }
    
    await conn.close();
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

debug();

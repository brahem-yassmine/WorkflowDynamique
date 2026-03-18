const mongoose = require('mongoose');

async function debug() {
  try {
    const dbName = 'tenant_israbrahem_1773843513119';
    const conn = await mongoose.createConnection(`mongodb://localhost:27017/${dbName}`).asPromise();
    
    const Instance = conn.model('WorkflowInstance', new mongoose.Schema({}, { strict: false }));
    const instances = await Instance.find({});
    
    console.log(`Found ${instances.length} instances in ${dbName}`);
    instances.forEach(inst => {
      console.log(`- Instance: ${inst.title} [${inst._id}] Status: ${inst.status} Creator: ${inst.createdBy}`);
      console.log(`  Current Nodes:`, JSON.stringify(inst.currentNodes, null, 2));
    });
    
    await conn.close();
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

debug();

const mongoose = require('mongoose');

async function fix_last() {
  try {
    const dbName = 'tenant_israbrahem_1773843513119';
    const conn = await mongoose.createConnection(`mongodb://localhost:27017/${dbName}`).asPromise();
    
    const Instance = conn.model('WorkflowInstance', new mongoose.Schema({ currentNodes: Array }, { strict: false }));
    const inst = await Instance.findById('69bad297479efed24713176d');
    
    if (inst) {
      console.log(`Fixing instance 69bad297479efed24713176d...`);
      inst.currentNodes.forEach(n => {
        if (n.nodeId === 'node_action_1773851230487_394') {
          n.responsibleUser = new mongoose.Types.ObjectId('69bab7c476a66a03d4c5532f');
          console.log(`✅ Set responsibleUser to Mimi's ID`);
        }
      });
      inst.markModified('currentNodes');
      await inst.save();
    }
    
    await conn.close();
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

fix_last();

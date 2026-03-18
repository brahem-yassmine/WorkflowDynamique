const mongoose = require('mongoose');

async function debug() {
  try {
    const masterUri = 'mongodb://localhost:27017/workflow_master';
    await mongoose.connect(masterUri);
    
    const TenantSchema = new mongoose.Schema({}, { strict: false });
    const Tenant = mongoose.model('Tenant', TenantSchema);

    const t = await Tenant.findOne({ name: 'yassmineBrahem', databaseName: 'tenant_yassminebrahem_1773494263290' });
    if (!t) return console.log('Tenant not found');

    const tConn = mongoose.createConnection(`mongodb://localhost:27017/${t.databaseName}`);
    
    const Workflow = tConn.model('Workflow', new mongoose.Schema({
      nodes: Array,
      edges: Array,
      name: String
    }, { strict: false }));
    
    const WorkflowInstance = tConn.model('WorkflowInstance', new mongoose.Schema({
      workflowId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workflow' },
      currentNodes: Array,
      title: String,
      status: String
    }, { strict: false }));
    
    const inst = await WorkflowInstance.findOne({ title: { $regex: /test---100000000000/i } }).populate('workflowId');
    if (!inst) return console.log('Instance not found');
    
    console.log(`Instance: ${inst.title} | Status: ${inst.status}`);
    console.log(`Workflow populated: ${!!inst.workflowId}`);
    if (inst.workflowId) {
      console.log(`Workflow Name: ${inst.workflowId.name}`);
      console.log(`Workflow nodes count: ${inst.workflowId.nodes?.length || 0}`);
      if (inst.workflowId.nodes) {
        inst.workflowId.nodes.forEach(n => console.log(`  Node: ${n.id} Type: ${n.type} Label: ${n.data?.label}`));
      }
    } else {
      console.log(`WorkflowID in Instance: ${inst.workflowId}`);
    }
    
    console.log('Current Nodes:');
    if (inst.currentNodes) {
      inst.currentNodes.forEach(n => console.log(`  NodeId: ${n.nodeId} Status: ${n.status}`));
    }

    await tConn.close();
    await mongoose.disconnect();
  } catch (err) {
    console.error('Debug Error:', err);
  }
}

debug();

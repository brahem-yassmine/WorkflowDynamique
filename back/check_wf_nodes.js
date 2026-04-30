const mongoose = require('mongoose');
require('dotenv').config();

async function checkWfNodes() {
  const MASTER_DB_URI = process.env.MASTER_DB_URI || 'mongodb://localhost:27017/workflow_master';
  const masterConn = await mongoose.createConnection(MASTER_DB_URI).asPromise();
  
  const Tenant = masterConn.model('Tenant', new mongoose.Schema({ databaseName: String }, { strict: false }));
  const tenant = await Tenant.findOne({ name: 'BuildTech' });
  const dbUri = `mongodb://localhost:27017/${tenant.databaseName}`;
  const conn = await mongoose.createConnection(dbUri).asPromise();
  
  const Workflow = conn.model('Workflow', new mongoose.Schema({ nodes: Array }, { strict: false }));
  const wfs = await Workflow.find({});
  
  wfs.forEach(wf => {
    console.log(`Workflow: ${wf.name}`);
    wf.nodes.forEach(n => {
      console.log(`  Node: ${n.id} (${n.type}) | Label: ${n.data?.label} | Domain: ${n.data?.responsibleDomain || n.data?.domain}`);
      console.log(`    Assignees: ${JSON.stringify(n.data?.assigneeIds || n.data?.validatorIds)}`);
    });
  });

  await conn.close();
  await masterConn.close();
}

checkWfNodes().catch(console.error);

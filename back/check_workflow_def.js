const mongoose = require('mongoose');
require('dotenv').config();

async function checkWorkflowDef() {
  const MASTER_DB_URI = process.env.MASTER_DB_URI || 'mongodb://localhost:27017/workflow_master';
  const masterConn = await mongoose.createConnection(MASTER_DB_URI).asPromise();
  
  const Tenant = masterConn.model('Tenant', new mongoose.Schema({
    databaseUri: String,
    name: String,
    databaseName: String
  }));

  const tenant = await Tenant.findOne({ name: 'BuildTech' });
  const dbUri = tenant.databaseUri || `mongodb://localhost:27017/${tenant.databaseName}`;
  const conn = await mongoose.createConnection(dbUri).asPromise();
  
  const Workflow = conn.model('Workflow', new mongoose.Schema({}, { strict: false }));
  const workflow = await Workflow.findOne({ name: "création d'une demande" });
  
  console.log('Workflow Definition:', workflow.name);
  workflow.nodes.forEach(n => {
      console.log(`Node: ${n.id} (${n.type}) | Label: ${n.data?.label}`);
      console.log(`- Assignment: ${JSON.stringify(n.data?.assignment)}`);
      console.log(`- AssigneeIds: ${JSON.stringify(n.data?.assigneeIds)}`);
      console.log(`- ResponsibleDomain: ${n.data?.responsibleDomain}`);
  });

  await conn.close();
  await masterConn.close();
}

checkWorkflowDef().catch(console.error);

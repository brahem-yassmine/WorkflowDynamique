const mongoose = require('mongoose');
require('dotenv').config();

async function checkRawInstance() {
  const MASTER_DB_URI = process.env.MASTER_DB_URI || 'mongodb://localhost:27017/workflow_master';
  const masterConn = await mongoose.createConnection(MASTER_DB_URI).asPromise();
  
  const Tenant = masterConn.model('Tenant', new mongoose.Schema({ databaseName: String }, { strict: false }));
  const tenant = await Tenant.findOne({ name: 'BuildTech' });
  const dbUri = `mongodb://localhost:27017/${tenant.databaseName}`;
  const conn = await mongoose.createConnection(dbUri).asPromise();
  
  const WorkflowInstance = conn.model('WorkflowInstance', new mongoose.Schema({}, { strict: false }));
  const instances = await WorkflowInstance.find({ status: 'in_progress' });
  
  instances.forEach(inst => {
    console.log('--- Instance:', inst._id);
    console.log('CurrentNodes:', JSON.stringify(inst.currentNodes, null, 2));
    console.log('State:', JSON.stringify(inst.state, null, 2));
  });

  await conn.close();
  await masterConn.close();
}

checkRawInstance().catch(console.error);

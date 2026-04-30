const mongoose = require('mongoose');
require('dotenv').config();

async function checkTasks() {
  const MASTER_DB_URI = process.env.MASTER_DB_URI || 'mongodb://localhost:27017/workflow_master';
  const masterConn = await mongoose.createConnection(MASTER_DB_URI).asPromise();
  
  const Tenant = masterConn.model('Tenant', new mongoose.Schema({
    databaseUri: String,
    name: String,
    databaseName: String
  }));

  const tenant = await Tenant.findOne({ name: 'BuildTech' }); // Assuming this is the tenant
  if (!tenant) throw new Error('Tenant not found');

  const dbUri = tenant.databaseUri || `mongodb://localhost:27017/${tenant.databaseName}`;
  const conn = await mongoose.createConnection(dbUri).asPromise();
  
  const User = conn.model('User', new mongoose.Schema({ email: String, role: String }, { strict: false }));
  const Instance = conn.model('WorkflowInstance', new mongoose.Schema({}, { strict: false }));

  const admin = await User.findOne({ role: 'admin' });
  console.log(`Checking for user: ${admin.email} (ID: ${admin._id})`);

  const instances = await Instance.find({ status: { $in: ['in_progress', 'pending'] } });
  console.log(`Found ${instances.length} active instances`);

  for (const inst of instances) {
    console.log(`Instance: ${inst.title} (ID: ${inst._id})`);
    console.log(`- State steps: ${inst.state?.length || 0}`);
    console.log(`- CurrentNodes steps: ${inst.currentNodes?.length || 0}`);
    
    if (inst.state) {
        inst.state.forEach(s => console.log(`  * Step: ${s.stepId} | Status: ${s.status} | Assignees: ${s.assignees}`));
    }
  }

  await conn.close();
  await masterConn.close();
}

checkTasks().catch(console.error);

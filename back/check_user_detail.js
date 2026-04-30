const mongoose = require('mongoose');
require('dotenv').config();

async function checkUserDetail() {
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
  
  const User = conn.model('User', new mongoose.Schema({}, { strict: false }));
  const user = await User.findOne({ email: 'test21@gmail.com' });
  console.log('User Detail:', JSON.stringify(user, null, 2));

  await conn.close();
  await masterConn.close();
}

checkUserDetail().catch(console.error);

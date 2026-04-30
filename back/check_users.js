const mongoose = require('mongoose');
require('dotenv').config();

async function checkAllUsers() {
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
  
  const User = conn.model('User', new mongoose.Schema({ firstName: String, lastName: String, email: String, role: String }, { strict: false }));
  const users = await User.find();
  console.log(`Users in tenant ${tenant.name}:`);
  users.forEach(u => console.log(`- ${u.firstName} ${u.lastName} | ${u.email} | Role: ${u.role} | ID: ${u._id}`));

  await conn.close();
  await masterConn.close();
}

checkAllUsers().catch(console.error);

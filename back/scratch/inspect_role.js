// back/scratch/inspect_role.js
const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

async function run() {
  const MASTER_DB_URI = process.env.MASTER_DB_URI || 'mongodb://localhost:27017/workflow_master';
  console.log('🔄 Connecting to Master DB...');
  
  const masterConn = await mongoose.createConnection(MASTER_DB_URI).asPromise();
  console.log('✅ Connected to Master DB');

  // We need to find the tenant ID first or search all roles across all tenants?
  // Actually, roles are per tenant. Let's find all tenants and their roles.
  const Tenant = masterConn.model('Tenant', new mongoose.Schema({ name: String, domain: String }));
  const tenants = await Tenant.find();
  
  for (const tenant of tenants) {
    const tenantDbUri = `${MASTER_DB_URI.split('/').slice(0, -1).join('/')}/workflow_${tenant._id}`;
    console.log(`🔍 Checking Tenant: ${tenant.name} (${tenant._id}) at ${tenantDbUri}`);
    
    try {
      const tenantConn = await mongoose.createConnection(tenantDbUri).asPromise();
      const RoleSchema = new mongoose.Schema({ name: String, permissions: [String] });
      const Role = tenantConn.model('Role', RoleSchema);
      
      const testRole = await Role.findOne({ name: /TEST/i });
      if (testRole) {
        console.log(`✅ Found Role [${testRole.name}]:`, JSON.stringify(testRole.permissions, null, 2));
      }
      await tenantConn.close();
    } catch (err) {
      console.warn(`⚠️ Failed to connect to tenant DB for ${tenant.name}`);
    }
  }

  await masterConn.close();
  process.exit(0);
}

run().catch(err => {
  console.error('❌ Inspection failed:', err);
  process.exit(1);
});

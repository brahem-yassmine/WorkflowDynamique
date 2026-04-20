const mongoose = require('mongoose');

async function testUserPermissions() {
  const masterUri = 'mongodb://localhost:27017/WorkflowDynamique';
  const masterConn = mongoose.createConnection(masterUri);

  const Tenant = masterConn.model('Tenant', require('../src/models/master/Tenant')(masterConn).schema);

  const tenants = await Tenant.find({});
  for (const t of tenants) {
    console.log(`\n=== Checking tenant: ${t.name} (${t.databaseName}) ===`);
    const conn = mongoose.createConnection(t.databaseUri);
    const User = require('../src/models/tenant/User')(conn);
    const Role = require('../src/models/tenant/role.model')(conn);

    const users = await User.find();
    console.log(`Found ${users.length} users.`);
    for (const u of users) {
      console.log(` - User ID: ${u._id}`);
      console.log(`   Email: ${u.email}`);
      console.log(`   Role (String): ${u.role}`);
      console.log(`   SpecificRole: ${u.specificRole}`);
      console.log(`   SpecificRoleId: ${u.specificRoleId}`);

      let userRole = null;
      if (u.specificRoleId) {
        userRole = await Role.findById(u.specificRoleId);
      }
      if (!userRole) {
         userRole = await Role.findOne({ name: { $regex: new RegExp(`^${u.role}$`, 'i') } });
      }

      console.log(`   Found Role Model: ${userRole ? userRole.name : 'NONE'}`);
      if (userRole) {
         console.log(`   Role Permissions:`, userRole.permissions.length, 'items');
         if (userRole.permissions.includes('all')) {
            console.log('   *** HAS "all" IN PERMISSIONS! ***');
         }
      }
    }
    await conn.close();
  }
  await masterConn.close();
  process.exit(0);
}

testUserPermissions().catch(console.error);

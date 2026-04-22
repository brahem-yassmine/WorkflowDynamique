const mongoose = require('mongoose');

// Robust normalization function (Synchronized with backend utils)
function normalizePermission(perm) {
  if (!perm || typeof perm !== 'string') return "";
  const clean = perm.replace("_", ".").toLowerCase();
  const parts = clean.split(".");
  if (parts.length !== 2) return perm;
  const [entity, action] = parts;
  if (!entity || !action) return perm;
  return entity.charAt(0).toUpperCase() + entity.slice(1) + "." + action.toUpperCase();
}

async function migratePermissions() {
  const masterUri = 'mongodb://localhost:27017/workflow_master';
  const masterConn = await mongoose.createConnection(masterUri).asPromise();
  console.log('✅ Connected to master database');

  const Tenant = masterConn.model('Tenant', require('../src/models/master/Tenant')(masterConn).schema);
  const tenants = await Tenant.find({ status: 'active' });
  console.log(`🔍 Found ${tenants.length} active tenants to migrate.`);

  for (const tenant of tenants) {
    console.log(`\n📦 Migrating tenant: ${tenant.name} (${tenant.databaseName})`);
    const tenantConn = await mongoose.createConnection(tenant.databaseUri).asPromise();
    
    try {
      const Role = require('../src/models/tenant/role.model')(tenantConn);
      const roles = await Role.find({});
      console.log(`   - Found ${roles.length} roles.`);

      for (const role of roles) {
        if (!role.permissions || role.permissions.length === 0) continue;

        const normalized = role.permissions.map(normalizePermission).filter(p => p !== "");
        
        // Remove duplicates if any after normalization
        const unique = Array.from(new Set(normalized));

        if (JSON.stringify(role.permissions) !== JSON.stringify(unique)) {
            await Role.findByIdAndUpdate(role._id, { permissions: unique });
            console.log(`     ✅ Role "${role.name}" updated: [${role.permissions.length} items] -> [${unique.length} normalized items]`);
        } else {
            console.log(`     ⏩ Role "${role.name}" already normalized.`);
        }
      }
    } catch (err) {
      console.error(`   ❌ Failed to migrate tenant ${tenant.name}:`, err.message);
    } finally {
      await tenantConn.close();
    }
  }

  await masterConn.close();
  console.log('\n🏁 [Migration Complete] All tenant roles are now normalized to PascalCase.UPPERCASE format.');
  process.exit(0);
}

migratePermissions().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});

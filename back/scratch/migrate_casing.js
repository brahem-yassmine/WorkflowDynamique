// back/scratch/migrate_casing.js
const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

async function run() {
  const MASTER_DB_URI = process.env.MASTER_DB_URI || 'mongodb://localhost:27017/workflow_master';
  console.log('🔄 Connecting to Master DB...');
  
  const masterConn = await mongoose.createConnection(MASTER_DB_URI).asPromise();
  console.log('✅ Connected to Master DB');

  const Tenant = masterConn.model('Tenant', new mongoose.Schema({ name: String, domain: String }));
  const tenants = await Tenant.find();
  
  const MAP = {
    'DOMAIN': 'Domain',
    'MODULE': 'Module',
    'PROJECT': 'Project',
    'WORKFLOW': 'Workflow',
    'KANBAN': 'Kanban',
    'TEMPLATE': 'Template',
    'FORM': 'Form',
    'CHECKLIST': 'Checklist'
  };

  for (const tenant of tenants) {
    const tenantDbUri = `${MASTER_DB_URI.split('/').slice(0, -1).join('/')}/workflow_${tenant._id}`;
    console.log(`🔨 Migrating Tenant: ${tenant.name} (${tenantDbUri})`);
    
    try {
      const tenantConn = await mongoose.createConnection(tenantDbUri).asPromise();
      const RoleSchema = new mongoose.Schema({ name: String, permissions: [String] });
      const Role = tenantConn.model('Role', RoleSchema);
      
      const roles = await Role.find();
      for (const role of roles) {
        let changed = false;
        const newPermissions = role.permissions.map(p => {
          const parts = p.split('.');
          if (parts.length === 2) {
            const cat = parts[0];
            const action = parts[1];
            if (MAP[cat]) {
              changed = true;
              return `${MAP[cat]}.${action}`;
            }
          }
          return p;
        });

        if (changed) {
          console.log(`   ✨ Updating Role [${role.name}] for ${tenant.name}`);
          role.permissions = [...new Set(newPermissions)]; // Unique
          await role.save();
        }
      }
      await tenantConn.close();
    } catch (err) {
      console.warn(`⚠️ Failed to migrate tenant ${tenant.name}:`, err.message);
    }
  }

  await masterConn.close();
  console.log('🚀 Migration finished. All roles are now in TitleCase.ACTION format.');
  process.exit(0);
}

run().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});

// back/scratch/sync_all_roles.js
const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

async function run() {
  const MASTER_DB_URI = process.env.MASTER_DB_URI || 'mongodb://localhost:27017/workflow_master';
  console.log('🔄 Connecting to Master DB...');
  
  const masterConn = await mongoose.createConnection(MASTER_DB_URI).asPromise();
  console.log('✅ Connected to Master DB');

  const Tenant = masterConn.model('Tenant', new mongoose.Schema({ name: String, domain: String }));
  const tenants = await Tenant.find();
  
  // Mapping for normalization
  const CASING_MAP = {
    'DOMAIN': 'Domain',
    'MODULE': 'Module',
    'PROJECT': 'Project',
    'WORKFLOW': 'Workflow',
    'KANBAN': 'Kanban',
    'TEMPLATE': 'Template',
    'FORM': 'Form',
    'CHECKLIST': 'Checklist'
  };

  const MANDATORY_VIEW_PERMS = [
    'Domain.VIEW',
    'Module.VIEW',
    'Project.VIEW',
    'Workflow.VIEW',
    'Form.VIEW',
    'Checklist.VIEW'
  ];

  // 1. Process Master Roles
  const RoleSchema = new mongoose.Schema({ name: String, permissions: [String] }, { collection: 'system_roles' });
  const MasterRole = masterConn.model('Role', RoleSchema);
  const mRoles = await MasterRole.find();

  for (const role of mRoles) {
    let perms = role.permissions || [];
    let changed = false;

    // A. Fix Casing and Underscore -> Dot
    const normalized = perms.map(p => {
      let newP = p;
      // Replace underscore with dot if it's in Category_ACTION format
      if (newP.includes('_') && !newP.includes('.')) {
          newP = newP.replace('_', '.');
      }
      
      const parts = newP.split('.');
      if (parts.length === 2) {
        const cat = parts[0].toUpperCase();
        if (CASING_MAP[cat]) {
          changed = true;
          return `${CASING_MAP[cat]}.${parts[1].toUpperCase()}`;
        }
      }
      return newP;
    });

    // B. Add Mandatory View Perms
    MANDATORY_VIEW_PERMS.forEach(mvp => {
        if (!normalized.some(p => p.toLowerCase() === mvp.toLowerCase())) {
            normalized.push(mvp);
            changed = true;
        }
    });

    if (changed) {
      role.permissions = [...new Set(normalized)];
      await role.save();
      console.log(`✨ Updated Master Role: ${role.name}`);
    }
  }

  // 2. Process Tenant Roles
  for (const tenant of tenants) {
    const tenantDbUri = `${MASTER_DB_URI.split('/').slice(0, -1).join('/')}/workflow_${tenant._id}`;
    console.log(`🔨 Processing Tenant: ${tenant.name}`);
    
    try {
      const tenantConn = await mongoose.createConnection(tenantDbUri).asPromise();
      const Role = tenantConn.model('Role', new mongoose.Schema({ name: String, permissions: [String] }));
      
      const roles = await Role.find();
      for (const role of roles) {
        let perms = role.permissions || [];
        let changed = false;

        const normalized = perms.map(p => {
          let newP = p;
          if (newP.includes('_') && !newP.includes('.')) {
              newP = newP.replace('_', '.');
          }
          const parts = newP.split('.');
          if (parts.length === 2) {
            const cat = parts[0].toUpperCase();
            if (CASING_MAP[cat]) {
              changed = true;
              return `${CASING_MAP[cat]}.${parts[1].toUpperCase()}`;
            }
          }
          return newP;
        });

        MANDATORY_VIEW_PERMS.forEach(mvp => {
            if (!normalized.some(p => p.toLowerCase() === mvp.toLowerCase())) {
                normalized.push(mvp);
                changed = true;
            }
        });

        if (changed) {
          role.permissions = [...new Set(normalized)];
          await role.save();
          console.log(`   ✅ Updated Role [${role.name}] for ${tenant.name}`);
        }
      }
      await tenantConn.close();
    } catch (err) {
      console.warn(`⚠️ Skipping tenant ${tenant.name}:`, err.message);
    }
  }

  await masterConn.close();
  console.log('🚀 Sync finished. All roles now have basic VIEW permissions in TitleCase.ACTION format.');
  process.exit(0);
}

run().catch(err => {
  console.error('❌ Sync failed:', err);
  process.exit(1);
});

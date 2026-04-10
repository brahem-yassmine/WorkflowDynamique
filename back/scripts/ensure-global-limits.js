const mongoose = require('mongoose');
require('dotenv').config();

const MASTER_DB_URI = process.env.MASTER_DB_URI || 'mongodb://localhost:27017/workflow_master';

async function run() {
  console.log('🔌 Connecting to MASTER DB:', MASTER_DB_URI);
  const conn = await mongoose.createConnection(MASTER_DB_URI).asPromise();
  console.log('✅ Connected.');

  // Define Models
  const Plan = conn.model('Plan', new mongoose.Schema({
    name: String,
    code: String,
    features: mongoose.Schema.Types.Mixed
  }));

  const Tenant = conn.model('Tenant', new mongoose.Schema({
    name: String,
    planDetails: mongoose.Schema.Types.Mixed
  }));

  // 1. Update Master Plans to match target limits
  console.log('\n📊 Updating Master Plans...');
  const plans = await Plan.find({});
  for (const plan of plans) {
    const code = plan.code?.toUpperCase();
    let updatedWorkflows = 0;
    
    if (code === 'PRO') updatedWorkflows = 999;
    else if (code === 'STARTER') updatedWorkflows = 20;
    else if (code === 'DEMO') updatedWorkflows = 5;

    if (updatedWorkflows > 0) {
      const features = plan.features || {};
      features.maxWorkflows = updatedWorkflows;
      await Plan.findByIdAndUpdate(plan._id, { features });
      console.log(`✅ Plan ${plan.name} (${code}) updated to ${updatedWorkflows} workflows.`);
    }
  }

  // 2. Synchronize Tenants
  console.log('\n🏢 Synchronizing Tenants...');
  const tenants = await Tenant.find({});
  let updatedCount = 0;

  for (const tenant of tenants) {
    const planDetails = tenant.planDetails || {};
    const code = (planDetails.code || '').toUpperCase();
    
    let targetWorkflows = 0;
    if (code === 'PRO') targetWorkflows = 999;
    else if (code === 'STARTER') targetWorkflows = 20;
    else if (code === 'DEMO' || !code) targetWorkflows = 5; // Default to 5 for safety

    if (targetWorkflows > 0) {
      if (!tenant.planDetails) tenant.planDetails = {};
      if (!tenant.planDetails.features) tenant.planDetails.features = {};
      
      const current = tenant.planDetails.features.maxWorkflows;
      
      if (current !== targetWorkflows) {
        tenant.planDetails.features.maxWorkflows = targetWorkflows;
        // Also ensure maxNodes is high if missing
        if (!tenant.planDetails.features.maxNodes) {
            tenant.planDetails.features.maxNodes = 999999;
        }
        
        await Tenant.findByIdAndUpdate(tenant._id, { planDetails: tenant.planDetails });
        console.log(`✅ [${tenant.name}] Fixed workflow limit: ${current || 'N/A'} -> ${targetWorkflows}`);
        updatedCount++;
      }
    }
  }

  console.log(`\n🎉 Done! Updated ${updatedCount} tenants.`);
  await conn.close();
  process.exit(0);
}

run().catch(err => {
  console.error('❌ Script failed:', err);
  process.exit(1);
});

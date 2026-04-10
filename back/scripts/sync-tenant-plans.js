// back/scripts/sync-tenant-plans.js
require('dotenv').config();
const mongoose = require('mongoose');

async function syncTenantPlans() {
  try {
    const MASTER_DB_URI = process.env.MASTER_DB_URI || 'mongodb://localhost:27017/workflow_master';
    console.log('Connecting to Master DB...');
    const conn = await mongoose.createConnection(MASTER_DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    // Define Schemas
    const PlanSchema = new mongoose.Schema({
      name: String,
      code: String,
      features: Object
    });

    const TenantSchema = new mongoose.Schema({
      name: String,
      planDetails: Object,
      selectedPlan: mongoose.Schema.Types.ObjectId
    });

    const Plan = conn.model('Plan', PlanSchema);
    const Tenant = conn.model('Tenant', TenantSchema);

    // Fetch all reference plans
    const referencePlans = await Plan.find({});
    console.log(`Loaded ${referencePlans.length} reference plans.`);

    const plansByCode = {};
    const plansById = {};
    referencePlans.forEach(p => {
      plansByCode[p.code] = p;
      plansById[p._id.toString()] = p;
    });

    // Fetch all tenants
    const tenants = await Tenant.find({});
    console.log(`Found ${tenants.length} tenants. Syncing...`);

    let updatedCount = 0;
    for (const tenant of tenants) {
      let sourcePlan = null;
      
      // Try finding by selectedPlan ID first
      if (tenant.selectedPlan && plansById[tenant.selectedPlan.toString()]) {
        sourcePlan = plansById[tenant.selectedPlan.toString()];
      } 
      // Fallback to planDetails code
      else if (tenant.planDetails && tenant.planDetails.code && plansByCode[tenant.planDetails.code]) {
        sourcePlan = plansByCode[tenant.planDetails.code];
      }

      if (sourcePlan) {
        console.log(`Syncing Tenant: ${tenant.name} (${sourcePlan.code})`);
        tenant.planDetails = {
          name: sourcePlan.name,
          code: sourcePlan.code,
          price: sourcePlan.price,
          currency: sourcePlan.currency,
          features: sourcePlan.features
        };
        tenant.markModified('planDetails');
        await tenant.save();
        updatedCount++;
      } else {
        console.warn(`⚠️  No reference plan found for Tenant: ${tenant.name} (Plan ID: ${tenant.selectedPlan})`);
      }
    }

    console.log(`✅ Synchronization complete. ${updatedCount} tenants updated.`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error syncing tenant plans:', error);
    process.exit(1);
  }
}

syncTenantPlans();

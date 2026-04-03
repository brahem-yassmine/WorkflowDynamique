const mongoose = require('mongoose');
const plansConfig = require('../src/config/plans');
require('dotenv').config();

const MASTER_DB_URI = process.env.MASTER_DB_URI || 'mongodb://localhost:27017/workflow_master';

async function reconcilePlans() {
    console.log('Connecting to', MASTER_DB_URI);
    const conn = await mongoose.createConnection(MASTER_DB_URI).asPromise();
    
    // Define Schema for Plan
    const PlanSchema = new mongoose.Schema({
        name: String,
        code: String,
        price: Number,
        currency: String,
        features: Object,
        isActive: Boolean
    }, { strict: false });
    const Plan = conn.model('Plan', PlanSchema);

    // Define Schema for Tenant
    const TenantSchema = new mongoose.Schema({
        selectedPlan: mongoose.Schema.Types.ObjectId,
        planDetails: Object
    }, { strict: false });
    const Tenant = conn.model('Tenant', TenantSchema);

    console.log('Reconciling plans from config...');

    for (const planData of plansConfig.plans) {
        let plan = await Plan.findOne({ code: planData.code });
        if (plan) {
            console.log(`Updating plan: ${planData.name} (${planData.code})`);
            plan.features = planData.features;
            plan.price = planData.price;
            await plan.save();
        } else {
            console.log(`Creating plan: ${planData.name} (${planData.code})`);
            plan = await Plan.create(planData);
        }

        // Update all tenants currently on this plan
        const result = await Tenant.updateMany(
            { selectedPlan: plan._id },
            { 
                $set: { 
                    'planDetails.name': plan.name,
                    'planDetails.code': plan.code,
                    'planDetails.features': plan.features
                } 
            }
        );
        console.log(`Updated ${result.modifiedCount} tenants on plan ${planData.code}`);
    }

    await conn.close();
    console.log('Done.');
}

reconcilePlans().catch(console.error);

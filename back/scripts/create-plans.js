// back/create-plans.js
require('dotenv').config();
const mongoose = require('mongoose');

async function createPlans() {
  try {
    // Connection to MASTER database
    const MASTER_DB_URI = process.env.MASTER_DB_URI || 'mongodb://localhost:27017/workflow_master';

    console.log(' Connecting to MongoDB...');
    const conn = await mongoose.createConnection(MASTER_DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    // Define Plan model
    const PlanSchema = new mongoose.Schema({
      name: { type: String, required: true },
      code: { type: String, required: true, unique: true },
      price: { type: Number, required: true },
      currency: { type: String, default: 'D' },
      interval: { type: String, default: 'month' },
      features: {
        maxUsers: { type: Number, default: 10 },
        maxWorkflows: { type: Number, default: 10 },
        maxNodes: { type: Number, default: 10 },
        maxStaff: { type: Number, default: 0 },
        maxLocations: { type: Number, default: 0 },
        analysis: { type: String, default: 'Fixed' },
        reports: { type: Boolean, default: false },
        aiSupport: { type: Boolean, default: false },
        customSupport: { type: Boolean, default: false }
      },
      isActive: { type: Boolean, default: true },
      createdAt: { type: Date, default: Date.now }
    });

    const Plan = conn.model('Plan', PlanSchema);

    // Delete old plans (optional)
    await Plan.deleteMany({});
    console.log(' Old plans deleted');

    // Create new plans based on the image
    const plans = [
      {
        name: 'Demo Plan',
        code: 'DEMO',
        price: 0,
        currency: 'D',
        interval: 'month',
        trialDays: 7,
        features: {
          maxStaff: 5,
          maxLocations: 5,
          maxWorkflows: 5,
          analysis: 'Fixed',
          reports: false,
          aiSupport: false,
          customSupport: false
        },
        description: 'To start with basic features'
      },
      {
        name: 'Starter Plan',
        code: 'STARTER',
        price: 79,
        currency: 'D',
        interval: 'month',
        trialDays: 30,
        features: {
          maxStaff: 10,
          maxLocations: 10,
          maxWorkflows: 20,
          analysis: 'Pro analysis',
          reports: true,
          aiSupport: false,
          customSupport: false
        },
        description: 'For growing small businesses'
      },
      {
        name: 'Pro Plan',
        code: 'PRO',
        price: 299,
        currency: 'D',
        interval: 'month',
        trialDays: 30,
        features: {
          maxStaff: -1, // -1 means unlimited
          maxLocations: -1, // -1 means unlimited
          maxWorkflows: 999, // Specific limit requested by admin
          analysis: 'Advanced AI',
          reports: true,
          aiSupport: true,
          customSupport: true
        },
        description: 'Complete solution for large companies'
      }
    ];

    // Insert plans
    for (const planData of plans) {
      const plan = new Plan(planData);
      await plan.save();
      console.log(` Plan created: ${plan.name} (${plan.price}${plan.currency}/${plan.interval})`);
    }

    console.log('\n All plans have been created successfully!');

    // Display summary
    const allPlans = await Plan.find();
    console.log('\n Plans summary:');
    allPlans.forEach(plan => {
      console.log(`\n${plan.name}:`);
      console.log(`  - Price: ${plan.price}${plan.currency}/${plan.interval}`);
      console.log(`  - Staff: ${plan.features.maxStaff === -1 ? 'Unlimited' : plan.features.maxStaff}`);
      console.log(`  - Locations: ${plan.features.maxLocations === -1 ? 'Unlimited' : plan.features.maxLocations}`);
      console.log(`  - Analysis: ${plan.features.analysis}`);
    });

    process.exit(0);
  } catch (error) {
    console.error(' Error:', error);
    process.exit(1);
  }
}

createPlans();
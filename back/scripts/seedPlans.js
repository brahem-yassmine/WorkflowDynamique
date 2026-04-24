// back/scripts/seedPlans.js
const mongoose = require('mongoose');
require('dotenv').config();
const Plan = require('../src/models/master/Plan');

const defaultPlans = [
  {
    name: 'Demo Plan',
    code: 'DEMO',
    price: 0,
    currency: 'TND',
    interval: 'month',
    trialDays: 15,
    features: {
      maxUsers: 999999,
      maxWorkflows: 30,
      maxNodes: 999999,
      reports: false,
      aiSupport: true
    },
    description: 'Exploration initiale du système et tests.',
    isActive: true
  },
  {
    name: 'Starter Plan',
    code: 'STARTER',
    price: 79,
    currency: 'TND',
    interval: 'month',
    trialDays: 15,
    features: {
      maxUsers: 999999,
      maxWorkflows: 50,
      maxNodes: 999999,
      reports: true,
      aiSupport: true
    },
    description: 'Solution professionnelle pour petites équipes.',
    isActive: true
  },
  {
    name: 'Pro Plan',
    code: 'PRO',
    price: 299,
    currency: 'TND',
    interval: 'month',
    trialDays: 15,
    features: {
      maxUsers: 999999,
      maxWorkflows: 999999,
      maxNodes: 999999,
      reports: true,
      aiSupport: true
    },
    description: 'Contrôle total pour entreprises en croissance.',
    isActive: true
  }
];

async function seedPlans() {
  try {
    const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/workflow_dynamique';
    await mongoose.connect(MONGO_URI);
    
    // The Plan export is a function that takes a connection
    const PlanModel = Plan(mongoose.connection);

    console.log('🚀 Seeding plans with updated limits...');

    await PlanModel.deleteMany({});
    console.log('✅ Old plans removed');

    for (const planData of defaultPlans) {
      const plan = new PlanModel(planData);
      await plan.save();
      console.log(`✅ Plan created: ${plan.name} (${plan.code}) - Workflows: ${plan.features.maxWorkflows}`);
    }

    console.log('\n✨ All plans seeded successfully!');

  } catch (error) {
    console.error('❌ Error seeding plans:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 MongoDB disconnected');
  }
}

seedPlans();

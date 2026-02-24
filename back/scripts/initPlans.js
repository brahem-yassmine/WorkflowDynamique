// back/scripts/cleanPlans.js
require('dotenv').config();
const mongoose = require('mongoose');
const Plan = require('../src/models/Plan');

//  Default plans with CORRECT names
const defaultPlans = [
  {
    name: 'free_trial',
    displayName: 'Demo',
    description: '15 days to discover all features',
    monthlyPrice: 0,
    yearlyPrice: 0,
    trialPeriodDays: 15,
    features: {
      maxUsers: 1,
      maxWorkflows: 3,
      aiAssistance: false,
      customBranding: false,
      prioritySupport: false,
      apiAccess: false,
      advancedAnalytics: false,
      maxStorage: 0.5
    },
    highlights: [
      '15-day free trial',
      '1 user',
      '3 workflows',
      'Email support'
    ],
    displayOrder: 1,
    isPopular: false,
    isActive: true
  },
  {
    name: 'starter',
    displayName: 'Starter',
    description: 'For small teams getting started',
    monthlyPrice: 29,
    yearlyPrice: 279,
    trialPeriodDays: 14,
    features: {
      maxUsers: 5,
      maxWorkflows: 10,
      aiAssistance: false,
      customBranding: false,
      prioritySupport: true,
      apiAccess: false,
      advancedAnalytics: false,
      maxStorage: 5
    },
    highlights: [
      'Up to 5 users',
      '10 workflows',
      '5 GB storage',
      'Priority support'
    ],
    displayOrder: 2,
    isPopular: false,
    isActive: true
  },
  {
    name: 'pro',
    displayName: 'Pro',
    description: 'For growing teams',
    monthlyPrice: 79,
    yearlyPrice: 759,
    trialPeriodDays: 14,
    features: {
      maxUsers: 999999,
      maxWorkflows: 999999,
      aiAssistance: true,
      customBranding: true,
      prioritySupport: true,
      apiAccess: true,
      advancedAnalytics: true,
      maxStorage: 50
    },
    highlights: [
      'Unlimited users',
      'Unlimited workflows',
      'AI Assistance',
      'Custom branding',
      '50 GB storage',
      'Advanced API',
      'Advanced analytics'
    ],
    displayOrder: 3,
    isPopular: true,
    badge: {
      text: 'Recommended',
      color: 'blue'
    },
    isActive: true
  }
];

async function seedPlans() {
  try {
    //  Connection to MongoDB
    const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/workflow_dynamique';
    await mongoose.connect(MONGO_URI);
    console.log(' Connected to MongoDB');

    // DELETE ALL existing plans
    console.log('\n Deleting old plans...');
    await Plan.deleteMany({});
    console.log(' Old plans deleted');

    // CREATE new plans
    console.log('\n Creating new plans...');
    for (const planData of defaultPlans) {
      const plan = new Plan(planData);
      await plan.save();
      console.log(` Plan created: ${plan.displayName} (${plan.name}) - ${plan.monthlyPrice === 0 ? 'Free' : plan.monthlyPrice + '€'}`);
    }

    // VERIFY the result
    const finalPlans = await Plan.find({}).sort({ displayOrder: 1 });
    console.log('\n Final plans in the database:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    finalPlans.forEach(plan => {
      console.log(`\n ${plan.displayName} ${plan.isPopular ? '' : ''}`);
      console.log(`   ID: ${plan._id}`);
      console.log(`   Name: ${plan.name}`);
      console.log(`   Price: ${plan.monthlyPrice === 0 ? 'Free' : plan.monthlyPrice + 'D'}`);
      console.log(`   Trial: ${plan.trialPeriodDays} days`);
    });

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(` ${finalPlans.length} active plans`);

  } catch (error) {
    console.error(' Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n Disconnected from MongoDB');
  }
}

// Execute
seedPlans();
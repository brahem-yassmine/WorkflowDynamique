// scripts/seedPlans.js

const mongoose = require('mongoose');
require('dotenv').config();
const Plan = require('../src/models/Plan');

const defaultPlans = [
  {
    name: 'demo',
    displayName: 'Demo Trial',
    description: '15 days to test all features',
    trialPeriodDays: 15,
    monthlyPrice: 0,
    yearlyPrice: 0,
    currency: 'TND',
    features: {
      maxUsers: 3,
      maxWorkflows: 5,
      maxNodes: 999999,
      maxStaff: 3,
      maxStorageGB: 1,
      aiAssistance: true,
      customDomains: false,
      apiAccess: false,
      prioritySupport: false,
      customCriteria: [
        { name: 'workflowComplexity', value: 'basic', description: 'Basic workflows' },
        { name: 'exportFormat', value: 'pdf', description: 'PDF export only' },
        { name: 'collaborators', value: 1, description: '1 collaborator' },
        { name: 'automationRules', value: 3, description: '3 automation rules' },
        { name: 'emailNotifications', value: true, description: 'Basic email notifications' }
      ]
    },
    displayOrder: 1,
    isActive: true
  },
  {
    name: 'starter',
    displayName: 'Starter Plan',
    description: 'Perfect for small teams',
    trialPeriodDays: 15,
    monthlyPrice: 79,
    yearlyPrice: 790, // 2 free months
    currency: 'TND',
    features: {
      maxUsers: 10,
      maxWorkflows: 20,
      maxNodes: 999999,
      maxStaff: 10,
      maxStorageGB: 10,
      aiAssistance: true,
      customDomains: true,
      apiAccess: false,
      prioritySupport: false,
      customCriteria: [
        { name: 'workflowComplexity', value: 'advanced', description: 'Advanced workflows' },
        { name: 'exportFormat', value: ['pdf', 'excel'], description: 'Export PDF & Excel' },
        { name: 'customReports', value: 5, description: '5 custom reports' },
        { name: 'collaborators', value: 5, description: '5 collaborators' },
        { name: 'automationRules', value: 15, description: '15 automation rules' },
        { name: 'templates', value: 10, description: '10 templates' },
        { name: 'basicAnalytics', value: true, description: 'Basic analytics dashboard' }
      ]
    },
    displayOrder: 2,
    isActive: true
  },
  {
    name: 'pro',
    displayName: 'Pro Plan',
    description: 'For growing companies',
    trialPeriodDays: 15,
    monthlyPrice: 299,
    yearlyPrice: 2990, // 2 free months
    currency: 'TND',
    features: {
      maxUsers: 999999,
      maxWorkflows: 999999,
      maxNodes: 999999,
      maxStaff: 999999,
      maxStorageGB: 50,
      aiAssistance: true,
      customDomains: true,
      apiAccess: true,
      prioritySupport: true,
      customCriteria: [
        { name: 'workflowComplexity', value: 'expert', description: 'Expert workflows' },
        { name: 'exportFormat', value: ['pdf', 'excel', 'csv', 'json'], description: 'Multiple formats' },
        { name: 'customReports', value: 'unlimited', description: 'Unlimited reports' },
        { name: 'sla', value: '99%', description: 'SLA 99% guarantee' },
        { name: 'collaborators', value: 25, description: '25 collaborators' },
        { name: 'automationRules', value: 100, description: '100 rules' },
        { name: 'templates', value: 50, description: '50 templates' },
        { name: 'advancedAnalytics', value: true, description: 'Advanced analytics' },
        { name: 'webhookIntegrations', value: 10, description: '10 webhooks' },
        { name: 'customBranding', value: true, description: 'Custom branding' },
        { name: 'auditLog', value: true, description: 'Full audit log' },
        { name: 'dataBackup', value: 'daily', description: 'Daily backup' }
      ]
    },
    displayOrder: 3,
    isActive: true
  }
];

async function seedPlans() {
  try {
    const MONGO_URI =
      process.env.MONGODB_URI ||
      'mongodb://127.0.0.1:27017/workflow_dynamique';

    await mongoose.connect(MONGO_URI);

    console.log(' Seeding plans (Tunisia - TND)...');

    await Plan.deleteMany({});
    console.log(' Old plans removed');

    for (const planData of defaultPlans) {
      const plan = new Plan(planData);
      await plan.save();
      console.log(` Plan created: ${plan.displayName}`);
    }

    console.log('\n All plans seeded successfully!');

    const plans = await Plan.find({}).sort({ displayOrder: 1 });

    console.log('\n Available Plans (TND):');
    console.log('==========================');

    plans.forEach(plan => {
      console.log(`\n${plan.displayName.toUpperCase()}:`);
      console.log(`  Description: ${plan.description}`);
      console.log(`  Monthly: ${plan.monthlyPrice} TND`);
      console.log(
        `  Yearly: ${plan.yearlyPrice} TND (savings ${plan.monthlyPrice * 12 - plan.yearlyPrice
        } TND)`
      );
      console.log(`  Trial: ${plan.trialPeriodDays} days`);
      console.log(`  Max Users: ${plan.features.maxUsers}`);
      console.log(`  Max Workflows: ${plan.features.maxWorkflows}`);
      console.log(`  Storage: ${plan.features.maxStorageGB} GB`);
    });

  } catch (error) {
    console.error(' Error seeding plans:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 MongoDB disconnected');
  }
}

seedPlans();

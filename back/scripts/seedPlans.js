// scripts/seedPlans.js

const mongoose = require('mongoose');
require('dotenv').config();
const Plan = require('../src/models/Plan');

const defaultPlans = [
  {
    name: 'demo',
    displayName: 'Demo Trial',
    description: '15 jours pour tester toutes les fonctionnalités',
    trialPeriodDays: 15,
    monthlyPrice: 0,
    yearlyPrice: 0,
    currency: 'TND',
    features: {
      maxUsers: 3,
      maxWorkflows: 5,
      maxStorageGB: 1,
      aiAssistance: true,
      customDomains: false,
      apiAccess: false,
      prioritySupport: false,
      customCriteria: [
        { name: 'workflowComplexity', value: 'basic', description: 'Workflows basiques' },
        { name: 'exportFormat', value: 'pdf', description: 'Export PDF uniquement' },
        { name: 'collaborators', value: 1, description: '1 collaborateur' },
        { name: 'automationRules', value: 3, description: '3 règles d’automatisation' },
        { name: 'emailNotifications', value: true, description: 'Notifications email basiques' }
      ]
    },
    displayOrder: 1,
    isActive: true
  },
  {
    name: 'starter',
    displayName: 'Starter',
    description: 'Parfait pour petites équipes',
    trialPeriodDays: 0,
    monthlyPrice: 19,
    yearlyPrice: 190, // 2 mois gratuits
    currency: 'TND',
    features: {
      maxUsers: 10,
      maxWorkflows: 20,
      maxStorageGB: 10,
      aiAssistance: true,
      customDomains: true,
      apiAccess: false,
      prioritySupport: false,
      customCriteria: [
        { name: 'workflowComplexity', value: 'advanced', description: 'Workflows avancés' },
        { name: 'exportFormat', value: ['pdf', 'excel'], description: 'Export PDF & Excel' },
        { name: 'customReports', value: 5, description: '5 rapports personnalisés' },
        { name: 'collaborators', value: 5, description: '5 collaborateurs' },
        { name: 'automationRules', value: 15, description: '15 règles d’automatisation' },
        { name: 'templates', value: 10, description: '10 templates' },
        { name: 'basicAnalytics', value: true, description: 'Dashboard analytique basique' }
      ]
    },
    displayOrder: 2,
    isActive: true
  },
  {
    name: 'pro',
    displayName: 'Pro',
    description: 'Pour entreprises en croissance',
    trialPeriodDays: 0,
    monthlyPrice: 49,
    yearlyPrice: 490, // 2 mois gratuits
    currency: 'TND',
    features: {
      maxUsers: 50,
      maxWorkflows: 100,
      maxStorageGB: 50,
      aiAssistance: true,
      customDomains: true,
      apiAccess: true,
      prioritySupport: true,
      customCriteria: [
        { name: 'workflowComplexity', value: 'expert', description: 'Workflows experts' },
        { name: 'exportFormat', value: ['pdf', 'excel', 'csv', 'json'], description: 'Formats multiples' },
        { name: 'customReports', value: 'unlimited', description: 'Rapports illimités' },
        { name: 'sla', value: '99%', description: 'Garantie SLA 99%' },
        { name: 'collaborators', value: 25, description: '25 collaborateurs' },
        { name: 'automationRules', value: 100, description: '100 règles' },
        { name: 'templates', value: 50, description: '50 templates' },
        { name: 'advancedAnalytics', value: true, description: 'Analytics avancé' },
        { name: 'webhookIntegrations', value: 10, description: '10 webhooks' },
        { name: 'customBranding', value: true, description: 'Branding personnalisé' },
        { name: 'auditLog', value: true, description: 'Audit log complet' },
        { name: 'dataBackup', value: 'daily', description: 'Backup quotidien' }
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

    console.log(' Seeding plans (Tunisie - TND)...');

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
        `  Yearly: ${plan.yearlyPrice} TND (économie ${
          plan.monthlyPrice * 12 - plan.yearlyPrice
        } TND)`
      );
      console.log(`  Trial: ${plan.trialPeriodDays} jours`);
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

// back/scripts/cleanPlans.js
require('dotenv').config();
const mongoose = require('mongoose');
const Plan = require('../src/models/Plan');

// ✅ Plans par défaut avec les BONS noms
const defaultPlans = [
  {
    name: 'free_trial',
    displayName: 'Demo',
    description: '15 jours pour découvrir toutes les fonctionnalités',
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
      '15 jours d\'essai gratuit',
      '1 utilisateur',
      '3 workflows',
      'Support par email'
    ],
    displayOrder: 1,
    isPopular: false,
    isActive: true
  },
  {
    name: 'starter',
    displayName: 'Starter',
    description: 'Pour les petites équipes qui débutent',
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
      'Jusqu\'à 5 utilisateurs',
      '10 workflows',
      '5 Go de stockage',
      'Support prioritaire'
    ],
    displayOrder: 2,
    isPopular: false,
    isActive: true
  },
  {
    name: 'pro',
    displayName: 'Pro',
    description: 'Pour les équipes en pleine croissance',
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
      'Utilisateurs illimités',
      'Workflows illimités',
      'Assistance IA',
      'Marque personnalisée',
      '50 Go de stockage',
      'API avancée',
      'Analytiques avancées'
    ],
    displayOrder: 3,
    isPopular: true,
    badge: {
      text: 'Recommandé',
      color: 'blue'
    },
    isActive: true
  }
];

async function seedPlans() {
  try {
    // ✅ Connexion à MongoDB
    const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/workflow_dynamique';
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connecté à MongoDB');

    // ✅ SUPPRIMER TOUS les plans existants
    console.log('\n🗑️ Suppression des anciens plans...');
    await Plan.deleteMany({});
    console.log('✅ Anciens plans supprimés');

    // ✅ CRÉER les nouveaux plans
    console.log('\n Création des nouveaux plans...');
    for (const planData of defaultPlans) {
      const plan = new Plan(planData);
      await plan.save();
      console.log(` Plan créé: ${plan.displayName} (${plan.name}) - ${plan.monthlyPrice === 0 ? 'Gratuit' : plan.monthlyPrice + '€'}`);
    }

    // ✅ VÉRIFIER le résultat
    const finalPlans = await Plan.find({}).sort({ displayOrder: 1 });
    console.log('\n Plans finaux dans la base:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    finalPlans.forEach(plan => {
      console.log(`\n ${plan.displayName} ${plan.isPopular ? '⭐' : ''}`);
      console.log(`   ID: ${plan._id}`);
      console.log(`   Name: ${plan.name}`);
      console.log(`   Prix: ${plan.monthlyPrice === 0 ? 'Gratuit' : plan.monthlyPrice + 'D'}`);
      console.log(`   Essai: ${plan.trialPeriodDays} jours`);
    });

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ ${finalPlans.length} plans actifs`);

  } catch (error) {
    console.error(' Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Déconnecté de MongoDB');
  }
}

// Exécuter
seedPlans();
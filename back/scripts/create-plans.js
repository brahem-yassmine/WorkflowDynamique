// back/create-plans.js
require('dotenv').config();
const mongoose = require('mongoose');

async function createPlans() {
  try {
    // Connexion à la base MASTER
    const MASTER_DB_URI = process.env.MASTER_DB_URI || 'mongodb://localhost:27017/workflow_master';
    
    console.log('📦 Connexion à MongoDB...');
    const conn = await mongoose.createConnection(MASTER_DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    // Définir le modèle Plan
    const PlanSchema = new mongoose.Schema({
      name: { type: String, required: true },
      code: { type: String, required: true, unique: true },
      price: { type: Number, required: true },
      currency: { type: String, default: 'D' },
      interval: { type: String, default: 'month' },
      features: {
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

    // Supprimer les anciens plans (optionnel)
    await Plan.deleteMany({});
    console.log('🗑️ Anciens plans supprimés');

    // Créer les nouveaux plans basés sur l'image
    const plans = [
      {
        name: 'Demo Plan',
        code: 'DEMO',
        price: 0,
        currency: 'D',
        interval: 'month',
        features: {
          maxStaff: 5,
          maxLocations: 5,
          analysis: 'Fixed',
          reports: false,
          aiSupport: false,
          customSupport: false
        },
        description: 'Pour démarrer avec les fonctionnalités de base'
      },
      {
        name: 'Starter Plan',
        code: 'STARTER',
        price: 79,
        currency: 'D',
        interval: 'month',
        features: {
          maxStaff: 10,
          maxLocations: 10,
          analysis: 'Pro analysis',
          reports: true,
          aiSupport: false,
          customSupport: false
        },
        description: 'Pour les petites entreprises en croissance'
      },
      {
        name: 'Pro Plan',
        code: 'PRO',
        price: 299,
        currency: 'D',
        interval: 'month',
        features: {
          maxStaff: -1, // -1 signifie illimité
          maxLocations: -1, // -1 signifie illimité
          analysis: 'Advanced AI',
          reports: true,
          aiSupport: true,
          customSupport: true
        },
        description: 'Solution complète pour grandes entreprises'
      }
    ];

    // Insérer les plans
    for (const planData of plans) {
      const plan = new Plan(planData);
      await plan.save();
      console.log(`✅ Plan créé: ${plan.name} (${plan.price}${plan.currency}/${plan.interval})`);
    }

    console.log('\n🎉 Tous les plans ont été créés avec succès !');
    
    // Afficher le résumé
    const allPlans = await Plan.find();
    console.log('\n📋 Récapitulatif des plans:');
    allPlans.forEach(plan => {
      console.log(`\n${plan.name}:`);
      console.log(`  - Prix: ${plan.price}${plan.currency}/${plan.interval}`);
      console.log(`  - Staff: ${plan.features.maxStaff === -1 ? 'Illimité' : plan.features.maxStaff}`);
      console.log(`  - Locations: ${plan.features.maxLocations === -1 ? 'Illimité' : plan.features.maxLocations}`);
      console.log(`  - Analysis: ${plan.features.analysis}`);
    });

    process.exit(0);
  } catch (error) {
    console.error(' Erreur:', error);
    process.exit(1);
  }
}

createPlans();
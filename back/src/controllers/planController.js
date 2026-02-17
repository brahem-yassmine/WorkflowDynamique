// back/src/controllers/planController.js
const jwt = require('jsonwebtoken');

// ✅ Obtenir tous les plans disponibles
exports.getPlans = async (req, res) => {
  try {
    console.log('📋 Récupération des plans...');
    
    // ✅ Vérification détaillée
    if (!req.masterDb) {
      console.error('❌ masterDb non disponible');
      return res.status(500).json({ 
        success: false, 
        message: 'Connexion à la base de données non établie' 
      });
    }
    
    console.log('📊 Modèles dans masterDb:', Object.keys(req.masterDb.models));
    
    // ✅ Vérifier si le modèle existe déjà
    let Plan;
    
    if (req.masterDb.models['Plan']) {
      // Si le modèle existe déjà, l'utiliser
      Plan = req.masterDb.model('Plan');
      console.log('✅ Modèle Plan trouvé dans masterDb.models');
    } else {
      console.log('⚠️ Modèle Plan non trouvé, tentative de création...');
      
      // Si le modèle n'existe pas, le créer
      const mongoose = require('mongoose');
      const PlanSchema = new mongoose.Schema({
        name: String,
        code: String,
        price: Number,
        currency: String,
        interval: String,
        features: Object,
        description: String,
        isActive: Boolean
      }, { timestamps: true });
      
      Plan = req.masterDb.model('Plan', PlanSchema);
      console.log('✅ Modèle Plan créé dynamiquement');
    }
    
    // Maintenant faire la requête
    const plans = await Plan.find({ isActive: true })
      .sort({ price: 1 })
      .lean();
    
    console.log(`✅ ${plans.length} plans trouvés`);
    
    res.json({
      success: true,
      data: plans
    });
    
  } catch (error) {
    console.error('❌ Error getPlans:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur: ' + error.message 
    });
  }
};

// ✅ Vérifier si besoin de sélection de plan
exports.checkPlanSelection = async (req, res) => {
  try {
    console.log('🔍 Vérification sélection plan pour user:', req.user?._id);
    
    if (!req.tenantConn) {
      console.error('❌ tenantConn non disponible');
      return res.status(500).json({ 
        success: false, 
        message: 'Connexion à la base tenant non établie' 
      });
    }
    
    const User = req.tenantConn.model('User');
    
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Utilisateur non trouvé' 
      });
    }

    const requiresPlanSelection = user.role === 'admin' && !user.hasSelectedPlan;
    
    console.log('✅ Vérification terminée:', { requiresPlanSelection, role: user.role });
    
    res.json({
      success: true,
      data: {
        requiresPlanSelection,
        hasSelectedPlan: user.hasSelectedPlan,
        role: user.role
      }
    });
    
  } catch (error) {
    console.error('❌ Error checkPlanSelection:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur' 
    });
  }
};

// ✅ Sélectionner un plan
exports.selectPlan = async (req, res) => {
  try {
    const { planId, billingCycle } = req.body;
    const userId = req.user._id;
    const tenantId = req.user.tenantId;
    
    console.log('📝 Sélection de plan:', { planId, billingCycle, userId, tenantId });
    
    if (!req.masterDb) {
      return res.status(500).json({ 
        success: false, 
        message: 'Connexion master non établie' 
      });
    }
    
    if (!req.tenantConn) {
      return res.status(500).json({ 
        success: false, 
        message: 'Connexion tenant non établie' 
      });
    }
    
    // Vérifier si le modèle Plan existe dans masterDb
    if (!req.masterDb.models['Plan']) {
      console.log('⚠️ Modèle Plan non trouvé dans masterDb, création...');
      const mongoose = require('mongoose');
      const PlanSchema = new mongoose.Schema({
        name: String,
        code: String,
        price: Number,
        currency: String,
        interval: String,
        features: Object,
        description: String,
        isActive: Boolean
      }, { timestamps: true });
      
      req.masterDb.model('Plan', PlanSchema);
    }
    
    const Plan = req.masterDb.model('Plan');
    const User = req.tenantConn.model('User');
    const Subscription = req.tenantConn.model('Subscription');
    const Tenant = req.masterDb.model('Tenant');
    
    // Vérifier que le plan existe
    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({ 
        success: false, 
        message: 'Plan non trouvé' 
      });
    }
    
    // Mettre à jour l'utilisateur
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Utilisateur non trouvé' 
      });
    }
    
    user.hasSelectedPlan = true;
    user.planSelectedAt = new Date();
    await user.save();
    
    // Créer la souscription
    const subscription = new Subscription({
      tenantId,
      planId: plan._id,
      planName: plan.name,
      billingCycle: billingCycle || 'monthly',
      price: plan.price,
      status: 'trial',
      selectedBy: userId,
      trialStartDate: new Date(),
      trialEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });
    
    await subscription.save();
    
    // Mettre à jour le tenant
    const tenant = await Tenant.findById(tenantId);
    if (tenant) {
      tenant.selectedPlan = plan._id;
      tenant.currentSubscription = subscription._id;
      tenant.planDetails = {
        name: plan.name,
        code: plan.code,
        price: plan.price,
        currency: plan.currency,
        interval: plan.interval,
        features: plan.features
      };
      tenant.trialPeriod = {
        startDate: new Date(),
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        isActive: true
      };
      await tenant.save();
    }
    
    // Générer un nouveau token
    const token = jwt.sign(
      { 
        userId: user._id,
        tenantId: user.tenantId,
        role: user.role,
        email: user.email,
        hasSelectedPlan: true
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      success: true,
      message: 'Plan sélectionné avec succès',
      data: {
        user: {
          _id: user._id,
          email: user.email,
          role: user.role,
          hasSelectedPlan: user.hasSelectedPlan
        },
        plan,
        subscription,
        token
      }
    });
    
  } catch (error) {
    console.error('❌ Error selectPlan:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur: ' + error.message 
    });
  }
};
// back/src/controllers/subscriptionController.js
const Subscription = require('../models/tenant/Subscription.js');
const Tenant = require('../models/master/Tenant.js');
const Plan = require('../models/master/Plan.js');

// ✅ Récupérer l'historique des souscriptions
exports.getSubscriptionHistory = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    
    const subscriptions = await Subscription.find({ tenantId })
      .populate('planId', 'displayName name')
      .populate('selectedBy', 'email firstName lastName')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: subscriptions
    });
  } catch (error) {
    console.error('Erreur getSubscriptionHistory:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// ✅ Récupérer la souscription active
exports.getCurrentSubscription = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    
    // Soit depuis le tenant directement
    const tenant = await Tenant.findById(tenantId)
      .populate('currentSubscription')
      .populate('selectedPlan');
    
    // Soit chercher la souscription active
    const subscription = await Subscription.findOne({
      tenantId,
      status: { $in: ['trial', 'active'] }
    }).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: {
        subscription,
        tenantSubscription: tenant.currentSubscription,
        plan: tenant.selectedPlan
      }
    });
  } catch (error) {
    console.error('Erreur getCurrentSubscription:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// ✅ Changer de plan (upgrade/downgrade)
exports.changePlan = async (req, res) => {
  try {
    const { planId, billingCycle } = req.body;
    const tenantId = req.user.tenantId;
    const userId = req.user._id;
    
    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan non trouvé'
      });
    }
    
    // 1️⃣ ANNULER L'ANCIENNE SOUSCRIPTION
    await Subscription.updateMany(
      { tenantId, status: { $in: ['trial', 'active'] } },
      { 
        status: 'canceled',
        canceledAt: new Date()
      }
    );
    
    // 2️⃣ CRÉER LA NOUVELLE SOUSCRIPTION
    const subscription = new Subscription({
      tenantId,
      planId: plan._id,
      planName: plan.displayName,
      billingCycle,
      price: billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice,
      status: 'active', // Plus de trial si déjà client
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      selectedBy: userId
    });
    
    await subscription.save();
    
    // 3️⃣ METTRE À JOUR LE TENANT
    await Tenant.findByIdAndUpdate(tenantId, {
      selectedPlan: plan._id,
      currentSubscription: subscription._id,
      'planDetails': {
        name: plan.name,
        displayName: plan.displayName,
        monthlyPrice: plan.monthlyPrice,
        yearlyPrice: plan.yearlyPrice,
        features: plan.features
      },
      'subscription.status': 'active',
      'subscription.billingCycle': billingCycle,
      'subscription.currentPeriodStart': subscription.currentPeriodStart,
      'subscription.currentPeriodEnd': subscription.currentPeriodEnd
    });
    
    res.json({
      success: true,
      message: 'Plan changé avec succès',
      data: { subscription, plan }
    });
  } catch (error) {
    console.error('Erreur changePlan:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};
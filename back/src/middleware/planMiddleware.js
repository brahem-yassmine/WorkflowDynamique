// back/src/middleware/planMiddleware.js
const Tenant = require('../models/Tenant');
const User = require('../models/User');
const Workflow = require('../models/Workflow');

// Vérifier les limitations du plan
exports.checkPlanLimits = async (req, res, next) => {
  try {
    const tenant = await Tenant.findById(req.user.tenantId).populate('selectedPlan');
    
    if (!tenant || !tenant.selectedPlan) {
      return res.status(403).json({
        success: false,
        message: 'Aucun plan sélectionné',
        requiresPlanSelection: true
      });
    }
    
    // Vérifier la période d'essai
    if (tenant.trialPeriod.isActive && tenant.trialPeriod.endDate < new Date()) {
      tenant.trialPeriod.isActive = false;
      tenant.subscription.status = 'expired';
      await tenant.save();
      
      return res.status(403).json({
        success: false,
        message: 'Période d\'essai expirée',
        trialExpired: true
      });
    }
    
    // Attacher les infos du plan à req
    req.tenantPlan = tenant.planDetails;
    req.planLimits = tenant.planDetails.features;
    
    next();
    
  } catch (error) {
    console.error('Erreur checkPlanLimits:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Vérifier la limite d'utilisateurs
exports.checkUserLimit = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const limits = req.planLimits;
    
    const userCount = await User.countDocuments({ tenantId, isActive: true });
    
    if (userCount >= limits.maxUsers) {
      return res.status(403).json({
        success: false,
        message: `Limite d'utilisateurs atteinte (${limits.maxUsers})`,
        code: 'USER_LIMIT_EXCEEDED'
      });
    }
    
    next();
    
  } catch (error) {
    console.error('Erreur checkUserLimit:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Vérifier la limite de workflows
exports.checkWorkflowLimit = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const limits = req.planLimits;
    
    const workflowCount = await Workflow.countDocuments({ tenantId });
    
    if (workflowCount >= limits.maxWorkflows) {
      return res.status(403).json({
        success: false,
        message: `Limite de workflows atteinte (${limits.maxWorkflows})`,
        code: 'WORKFLOW_LIMIT_EXCEEDED'
      });
    }
    
    next();
    
  } catch (error) {
    console.error('Erreur checkWorkflowLimit:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};
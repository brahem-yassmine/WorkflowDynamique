// back/src/middleware/tenantMiddleware.js
const Tenant = require('../models/master/Tenant');

// ✅ Middleware pour résoudre le tenant à partir des headers
const tenantResolver = (req, res, next) => {
    try {
        // Extraire tenantId du header ou de la query
        const tenantId = req.headers['x-tenant-id'] || req.query.tenantId;
        
        if (!tenantId) {
            return res.status(400).json({ 
                success: false,
                message: 'Tenant ID requis (header x-tenant-id ou query tenantId)' 
            });
        }
        
        req.tenantId = tenantId;
        next();
    } catch (error) {
        console.error('Erreur tenantResolver:', error);
        next(error);
    }
};

// ✅ Vérifie que le tenant est actif
const checkTenantActive = async (req, res, next) => {
  try {
    // Si on a déjà le tenant via tenantResolver
    if (req.tenant) {
      if (req.tenant.status !== 'active') {
        return res.status(403).json({ 
          success: false, 
          message: 'Tenant inactif ou suspendu' 
        });
      }
      return next();
    }
    
    // Sinon, vérifier via la base master
    if (!req.user || !req.user.tenantId) {
      return next();
    }
    
    const TenantModel = req.masterDb?.model('Tenant') || Tenant;
    const tenant = await TenantModel.findById(req.user.tenantId);
    
    if (tenant && tenant.status !== 'active') {
      return res.status(403).json({ 
        success: false, 
        message: 'Tenant inactif' 
      });
    }
    
    next();
  } catch (error) {
    console.error('Erreur checkTenantActive:', error);
    next(error);
  }
};

// ✅ Vérifie les limites du plan
const checkPlanLimits = (resourceType) => {
  return async (req, res, next) => {
    try {
      if (!req.tenant || !req.tenant.planDetails) {
        return next();
      }
      
      const limits = req.tenant.planDetails.features;
      
      if (resourceType === 'users') {
        const User = req.tenantConn?.model('User');
        if (User) {
          const count = await User.countDocuments();
          if (count >= limits.maxUsers) {
            return res.status(403).json({ 
              success: false, 
              message: `Limite de ${limits.maxUsers} utilisateurs atteinte` 
            });
          }
        }
      }
      
      // Ajouter d'autres types de ressources si nécessaire
      if (resourceType === 'workflows') {
        const Workflow = req.tenantConn?.model('Workflow');
        if (Workflow) {
          const count = await Workflow.countDocuments();
          if (count >= limits.maxWorkflows) {
            return res.status(403).json({ 
              success: false, 
              message: `Limite de ${limits.maxWorkflows} workflows atteinte` 
            });
          }
        }
      }
      
      next();
    } catch (error) {
      console.error('Erreur checkPlanLimits:', error);
      next(error);
    }
  };
};

// ✅ Middleware pour requirePlan (si nécessaire)
const requirePlan = (requiredPlan) => {
  return (req, res, next) => {
    try {
      if (!req.tenant || !req.tenant.plan) {
        return res.status(403).json({ 
          success: false,
          message: 'Plan non défini pour ce tenant' 
        });
      }
      
      if (req.tenant.plan !== requiredPlan) {
        return res.status(403).json({ 
          success: false,
          message: `Ce plan (${requiredPlan}) est requis pour cette action` 
        });
      }
      
      next();
    } catch (error) {
      console.error('Erreur requirePlan:', error);
      next(error);
    }
  };
};

// ✅ EXPORT UNIQUE ET COHÉRENT - TOUS LES MIDDLEWARES DANS UN OBJET
module.exports = {
  tenantResolver,
  checkTenantActive,
  checkPlanLimits,
  requirePlan
};
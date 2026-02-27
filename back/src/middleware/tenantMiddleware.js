const mongoose = require('mongoose');
const { getTenantConnection } = require('../services/tenantConnection');

// ✅ Middleware pour résoudre le tenant à partir des headers

const tenantResolver = async (req, res, next) => {
  try {
    // Extraire tenantId du header ou de la query
    let tenantId = req.headers['x-tenant-id'] || req.query.tenantId;

    console.log('🔍 [TenantResolver] tenantId reçue:', tenantId);

    if (!tenantId) {
      // Si pas de tenantId, on laisse passer (les middlewares suivants bloqueront si nécessaire)
      return next();
    }

    // S'assurer que le tenantId est une chaîne
    tenantId = String(tenantId);
    req.tenantId = tenantId;

    // Si on a accès à la base master, on récupère les infos du tenant
    if (req.masterDb) {
      const TenantModel = req.masterDb.model('Tenant');

      // Validation du format ObjectId pour éviter un crash findById
      if (!mongoose.Types.ObjectId.isValid(tenantId)) {
        console.error('❌ [TenantResolver] format tenantId invalide:', tenantId);
        return res.status(400).json({ success: false, message: 'Format de Tenant ID invalide' });
      }

      const tenant = await TenantModel.findById(tenantId);

      if (!tenant) {
        console.error('❌ [TenantResolver] Tenant non trouvé pour ID:', tenantId);
        return res.status(404).json({
          success: false,
          message: 'Tenant non trouvé dans la base master'
        });
      }

      req.tenant = tenant;
      console.log('✅ [TenantResolver] Tenant résolu:', tenant.domain);

      // Établir la connexion à la base spécifique du tenant
      const tenantConn = await getTenantConnection(tenant.domain, tenant.databaseName);
      req.tenantConn = tenantConn;
    } else {
      console.warn('⚠️ [TenantResolver] req.masterDb est manquant !');
    }

    next();
  } catch (error) {
    console.error('❌ [TenantResolver] CRASH:', error);
    res.status(500).json({
      success: false,
      message: `Erreur résolution tenant: ${error.message}`,
      error: error.stack // Ajout du stack pour plus de détails
    });
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
    console.error('❌ tenantResolver Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Technical error accessing domain: ' + error.message
    });
  }
};

// Checks plan limits
const checkPlanLimits = (resourceType) => {
  return async (req, res, next) => {
    try {
      if (!req.tenant) {
        return next();
      }

      // Default limits if planDetails or features are missing
      const defaultLimits = {
        maxUsers: 10,
        maxWorkflows: 5
      };

      const limits = req.tenant.planDetails?.features || defaultLimits;

      if (resourceType === 'users') {
        const User = req.tenantConn?.model('User');
        if (User) {
          const count = await User.countDocuments();
          // Use limit from plan or default
          const maxUsers = limits.maxUsers || defaultLimits.maxUsers;
          if (count >= maxUsers) {
            return res.status(403).json({
              success: false,
              message: `Limite de ${maxUsers} utilisateurs atteinte`
            });
          }
        }
      }

      if (resourceType === 'workflows') {
        const Workflow = req.tenantConn?.model('Workflow');
        if (Workflow) {
          const count = await Workflow.countDocuments();
          const maxWorkflows = limits.maxWorkflows || defaultLimits.maxWorkflows;
          if (count >= maxWorkflows) {
            return res.status(403).json({
              success: false,
              message: `Limite de ${maxWorkflows} workflows atteinte`
            });
          }
        }
      }

      next();
    } catch (error) {
      console.error('❌ checkPlanLimits Error:', error);
      next(); // Don't block the request if limit check fails technically
    }
  };
};

// Middleware for requirePlan (if needed)
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
      console.error('requirePlan Error:', error);
      next(error);
    }
  };
};

// COHERENT EXPORTS
module.exports = {
  tenantResolver,
  checkTenantActive,
  checkPlanLimits,
  requirePlan
};

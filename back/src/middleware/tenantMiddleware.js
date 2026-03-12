const mongoose = require('mongoose');
const { getTenantConnection } = require('../services/tenantConnection');

// ✅ Middleware pour résoudre le tenant à partir des headers
const tenantResolver = async (req, res, next) => {
  try {
    let tenantId = req.headers['x-tenant-id'] || req.query.tenantId;
    console.log(`🔍 [TenantResolver] URL: ${req.url} | TenantID: ${tenantId}`);

    // If no tenantId, try to get it from JWT if Authorization header exists
    if (!tenantId && req.headers.authorization) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'votre_secret_jwt');
        if (decoded && decoded.tenantId) {
          tenantId = decoded.tenantId;
          console.log(`🔑 [TenantResolver] Resolved tenant from JWT: ${tenantId}`);
        }
      } catch (e) {
        // Token invalid, ignore and proceed
      }
    }

    console.log(`🔌 [TenantResolver] Resolving tenant for path: ${req.path}, ID: ${tenantId}`);

    if (!tenantId) {
      console.warn('⚠️ [TenantResolver] No TenantID found in headers or query');
      return next();
    }

    tenantId = String(tenantId);
    req.tenantId = tenantId;

    if (req.masterDb) {
      const TenantModel = req.masterDb.model('Tenant');
      if (!mongoose.Types.ObjectId.isValid(tenantId)) {
        return res.status(400).json({ success: false, message: 'Format de Tenant ID invalide' });
      }

      const tenant = await TenantModel.findById(tenantId);
      if (!tenant) {
        return res.status(404).json({ success: false, message: 'Tenant non trouvé' });
      }

      req.tenant = tenant;
      const tenantConn = await getTenantConnection(tenant.domain, tenant.databaseName);
      req.tenantConn = tenantConn;
    }

    next();
  } catch (error) {
    console.error('❌ [TenantResolver] Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ✅ Vérifie que le tenant est actif
const checkTenantActive = async (req, res, next) => {
  try {
    if (req.tenant) {
      if (req.tenant.status !== 'active') {
        return res.status(403).json({ success: false, message: 'Tenant inactif' });
      }
      return next();
    }

    if (!req.user || !req.user.tenantId) {
      return next();
    }

    const TenantModel = req.masterDb?.model('Tenant');
    const tenant = await TenantModel.findById(req.user.tenantId);

    if (tenant && tenant.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Tenant inactif' });
    }

    next();
  } catch (error) {
    console.error('❌ checkTenantActive Error:', error.message);
    res.status(500).json({ success: false, message: 'Technical error' });
  }
};

// ✅ Checks plan limits
const checkPlanLimits = (resourceType) => {
  return async (req, res, next) => {
    try {
      if (!req.tenant) return next();

      const defaultLimits = { maxUsers: 10, maxWorkflows: 5 };
      const limits = req.tenant.planDetails?.features || defaultLimits;

      if (resourceType === 'users') {
        const User = req.tenantConn?.model('User');
        if (User) {
          const count = await User.countDocuments();
          const maxUsers = limits.maxUsers || defaultLimits.maxUsers;
          if (count >= maxUsers) {
            return res.status(403).json({ success: false, message: `Limite de ${maxUsers} utilisateurs atteinte` });
          }
        }
      }

      if (resourceType === 'workflows') {
        const Workflow = req.tenantConn?.model('Workflow');
        if (Workflow) {
          const count = await Workflow.countDocuments();
          const maxWorkflows = limits.maxWorkflows || defaultLimits.maxWorkflows;
          if (count >= maxWorkflows) {
            return res.status(403).json({ success: false, message: `Limite de ${maxWorkflows} workflows atteinte` });
          }
        }
      }

      next();
    } catch (error) {
      console.error('❌ checkPlanLimits Error:', error);
      next();
    }
  };
};

function requirePlan(requiredPlan) {
  // If used as a direct middleware (e.g., router.get('/logs', requirePlan, ...))
  if (arguments.length >= 3 && typeof arguments[2] === 'function') {
    const req = arguments[0];
    const res = arguments[1];
    const next = arguments[2];

    if (!req.tenant || !req.tenant.selectedPlan) {
      return res.status(403).json({ success: false, message: 'Plan non défini ou inactif' });
    }
    return next();
  }

  // If used as a factory (e.g., requirePlan('pro'))
  return (req, res, next) => {
    try {
      const tenantPlan = req.tenant?.selectedPlan?.code || req.tenant?.selectedPlan;

      if (!req.tenant || !tenantPlan) {
        return res.status(403).json({ success: false, message: 'Plan non défini' });
      }

      // If a specific plan code is required, check for it
      if (typeof requiredPlan === 'string' && tenantPlan !== requiredPlan) {
        return res.status(403).json({ success: false, message: `Plan ${requiredPlan} requis` });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

module.exports = {
  tenantResolver,
  checkTenantActive,
  checkPlanLimits,
  requirePlan
};

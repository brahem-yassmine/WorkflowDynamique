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
      
      // If it's a super_admin trying to access something without tenantId, 
      // we might want to let it pass if the controller can handle it, 
      // but for workflows/tasks, it will definitely crash.
      return next();
    }

    tenantId = String(tenantId);
    req.tenantId = tenantId;

    if (req.masterDb) {
      const TenantModel = req.masterDb.model('Tenant');
      if (!mongoose.Types.ObjectId.isValid(tenantId)) {
        console.warn(`⚠️ [TenantResolver] Invalid Tenant ID format: ${tenantId}`);
        return res.status(400).json({ success: false, message: 'Format de Tenant ID invalide' });
      }

      const tenant = await TenantModel.findById(tenantId);
      if (!tenant) {
        console.warn(`⚠️ [TenantResolver] Tenant not found for ID: ${tenantId}`);
        return res.status(404).json({ success: false, message: 'Tenant non trouvé' });
      }

      req.tenant = tenant;
      try {
        const tenantConn = await getTenantConnection(tenant.domain, tenant.databaseName);
        req.tenantConn = tenantConn;
      } catch (connErr) {
        console.error(`❌ [TenantResolver] Failed to connect to tenant DB:`, connErr.message);
        return res.status(503).json({ success: false, message: 'Erreur de connexion à la base du tenant' });
      }
    }

    next();
  } catch (error) {
    console.error('❌ [TenantResolver] Critical Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error during tenant resolution' });
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
          // Ne pas compter les administrateurs
          const count = await User.countDocuments({ role: { $nin: ['admin', 'super_admin'] } });
          const maxUsers = limits.maxUsers || defaultLimits.maxUsers;
          if (count >= maxUsers) {
            let nextPlan = maxUsers <= 5 ? 'Starter' : 'Pro';
            let currentPlan = maxUsers <= 5 ? 'Demo' : 'Starter';
            return res.status(403).json({ 
                success: false, 
                message: `LIMIT: You have reached the limit of ${maxUsers} users for the ${currentPlan} plan. Please upgrade to the ${nextPlan} plan to add more users.` 
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
            return res.status(403).json({ success: false, message: `Limite de ${maxWorkflows} workflows atteinte` });
          }
        }
      }

      if (resourceType === 'nodes') {
        const Workflow = req.tenantConn?.model('Workflow');
        if (Workflow) {
          // Calculate total nodes across all workflows
          const workflows = await Workflow.find({});
          const currentTotalNodes = workflows.reduce((acc, wf) => {
            // If we are updating an existing workflow, don't count its old nodes yet
            if (req.params.workflowId && wf._id.toString() === req.params.workflowId) return acc;
            return acc + (wf.nodes?.length || 0);
          }, 0);

          const incomingNodesCount = req.body.nodes?.length || 0;
          const totalAfterOperation = currentTotalNodes + incomingNodesCount;

          const maxNodes = limits.maxNodes || 20; // Default fallback

          if (totalAfterOperation > maxNodes) {
            return res.status(403).json({ 
              success: false, 
              message: `Maximum system capacity reached (${maxNodes} Flow Nodes). You are trying to use ${totalAfterOperation} nodes total across the organization.`,
              currentTotal: currentTotalNodes,
              limit: maxNodes
            });
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

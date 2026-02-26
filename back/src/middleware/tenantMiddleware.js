// back/src/middleware/tenantMiddleware.js
const Tenant = require('../models/master/Tenant');
const mongoose = require('mongoose');
const roleSchema = require('../models/tenant/role.model');
const domainSchema = require('../models/tenant/domain.model');

// Tenants connections cache
const tenantConnections = {};

// Helper to register all tenant-specific models on a connection
const registerTenantModels = (conn) => {
  if (!conn) return;
  if (!conn.models['Role']) conn.model('Role', roleSchema);
  if (!conn.models['Domain']) conn.model('Domain', domainSchema);
  if (!conn.models['User']) require('../models/tenant/User')(conn);
  if (!conn.models['Workflow']) require('../models/tenant/Workflow')(conn);
  if (!conn.models['WorkflowInstance']) require('../models/tenant/WorkflowInstance')(conn);
  if (!conn.models['Project']) require('../models/tenant/Project')(conn);
  if (!conn.models['Form']) require('../models/tenant/Form')(conn);
  if (!conn.models['FormResponse']) require('../models/tenant/FormResponse')(conn);
  if (!conn.models['Checklist']) require('../models/tenant/Checklist')(conn);
  if (!conn.models['Task']) require('../models/tenant/Task')(conn);
  if (!conn.models['Notification']) require('../models/tenant/Notification')(conn);
};

// Middleware to resolve tenant from headers AND create/manage the connection
const tenantResolver = async (req, res, next) => {
  try {
    const tenantId = req.headers['x-tenant-id'] || req.query.tenantId;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant ID required (x-tenant-id header)'
      });
    }

    req.tenantId = tenantId;

    // 1. Check if we already have an active and ready connection
    if (tenantConnections[tenantId] && tenantConnections[tenantId].readyState === 1) {
      req.tenantConn = tenantConnections[tenantId];
      req.tenant = tenantConnections[tenantId].tenant;
      registerTenantModels(req.tenantConn);
      return next();
    }

    // 2. Otherwise, load tenant and/or create connection
    console.log(`🔌 Resolving tenant: ${tenantId}`);

    if (!req.masterDb) {
      return res.status(503).json({ success: false, message: 'Master Database unavailable' });
    }

    const TenantModel = req.masterDb.model('Tenant');
    const tenant = await TenantModel.findById(tenantId);

    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Organization not found' });
    }

    // 3. Create connection if it doesn't exist
    if (!tenantConnections[tenantId]) {
      console.log(`📡 Creating database connection: ${tenant.databaseName}`);

      const conn = mongoose.createConnection(tenant.databaseUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
      });

      // Register models immediately
      registerTenantModels(conn);

      // Wait for connection (with timeout)
      await Promise.race([
        new Promise((resolve) => conn.once('connected', resolve)),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Tenant database connection timeout')), 8000))
      ]);

      conn.tenant = tenant;
      tenantConnections[tenantId] = conn;
    }

    req.tenantConn = tenantConnections[tenantId];
    req.tenant = tenant;

    // Ensure models are registered even if we just fetched from cache (safety check)
    registerTenantModels(req.tenantConn);

    next();
  } catch (error) {
    console.error('❌ tenantResolver Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Technical error accessing domain: ' + error.message
    });
  }
};

// Checks if tenant is active
const checkTenantActive = async (req, res, next) => {
  try {
    if (!req.tenant) {
      return next();
    }

    if (req.tenant.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Tenant inactive or suspended'
      });
    }

    next();
  } catch (error) {
    console.error('checkTenantActive Error:', error);
    next(error);
  }
};

// Checks plan limits
const checkPlanLimits = (resourceType) => {
  return async (req, res, next) => {
    try {
      if (!req.tenant || !req.tenant.selectedPlan) {
        return next();
      }

      // Get plan details
      const Plan = req.masterDb.model('Plan');
      const plan = await Plan.findById(req.tenant.selectedPlan);

      if (!plan) {
        return next();
      }

      const limits = plan.features || {};

      if (resourceType === 'users' && req.tenantConn) {
        const User = req.tenantConn.model('User');
        if (User) {
          const count = await User.countDocuments();
          if (count >= (limits.maxUsers || 999)) {
            return res.status(403).json({
              success: false,
              message: `Limit of ${limits.maxUsers || 999} users reached`
            });
          }
        }
      }

      next();
    } catch (error) {
      console.error('checkPlanLimits Error:', error);
      next(error);
    }
  };
};

// Middleware for requirePlan (if needed)
const requirePlan = (requiredPlan) => {
  return (req, res, next) => {
    try {
      if (!req.tenant || !req.tenant.selectedPlan) {
        return res.status(403).json({
          success: false,
          message: 'Plan not defined for this tenant'
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

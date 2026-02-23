// back/src/middleware/tenantMiddleware.js
const Tenant = require('../models/master/Tenant');
const mongoose = require('mongoose');
const roleSchema = require('../models/tenant/role.model');
const domainSchema = require('../models/tenant/domain.model');

// Cache des connexions tenants
const tenantConnections = {};

// Middleware pour résoudre le tenant à partir des headers ET créer la connexion
const tenantResolver = async (req, res, next) => {
  try {
    const tenantId = req.headers['x-tenant-id'] || req.query.tenantId;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant ID requis (header x-tenant-id)'
      });
    }

    req.tenantId = tenantId;

    // 1. Vérifier si on a déjà une connexion active et prête
    if (tenantConnections[tenantId] && tenantConnections[tenantId].readyState === 1) {
      req.tenantConn = tenantConnections[tenantId];
      req.tenant = tenantConnections[tenantId].tenant;
      return next();
    }

    // 2. Sinon, on doit charger le tenant et/ou créer la connexion
    console.log(`🔌 Résolution du tenant: ${tenantId}`);

    if (!req.masterDb) {
      return res.status(503).json({ success: false, message: 'Base Master indisponible' });
    }

    const TenantModel = req.masterDb.model('Tenant');
    const tenant = await TenantModel.findById(tenantId);

    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Entreprise non trouvée' });
    }

    // 3. Créer la connexion si elle n'existe pas
    if (!tenantConnections[tenantId]) {
      console.log(`📡 Création connexion database: ${tenant.databaseName}`);

      const conn = mongoose.createConnection(tenant.databaseUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
      });

      // Attacher les modèles au démarrage de la connexion
      conn.model('Role', roleSchema);
      conn.model('Domain', domainSchema);
      require('../models/tenant/User')(conn);

      // Attendre la connexion (avec timeout)
      await Promise.race([
        new Promise((resolve) => conn.once('connected', resolve)),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout de connexion à la base tenant')), 8000))
      ]);

      conn.tenant = tenant;
      tenantConnections[tenantId] = conn;
    }

    req.tenantConn = tenantConnections[tenantId];
    req.tenant = tenant;

    next();
  } catch (error) {
    console.error('❌ Erreur tenantResolver:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erreur technique d\'accès au domaine: ' + error.message
    });
  }
};

// Vérifie que le tenant est actif
const checkTenantActive = async (req, res, next) => {
  try {
    if (!req.tenant) {
      return next();
    }

    if (req.tenant.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Tenant inactif ou suspendu'
      });
    }

    next();
  } catch (error) {
    console.error('Erreur checkTenantActive:', error);
    next(error);
  }
};

// Vérifie les limites du plan
const checkPlanLimits = (resourceType) => {
  return async (req, res, next) => {
    try {
      if (!req.tenant || !req.tenant.selectedPlan) {
        return next();
      }

      // Récupérer les détails du plan
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
              message: `Limite de ${limits.maxUsers || 999} utilisateurs atteinte`
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

// Middleware pour requirePlan (si nécessaire)
const requirePlan = (requiredPlan) => {
  return (req, res, next) => {
    try {
      if (!req.tenant || !req.tenant.selectedPlan) {
        return res.status(403).json({
          success: false,
          message: 'Plan non défini pour ce tenant'
        });
      }

      next();
    } catch (error) {
      console.error('Erreur requirePlan:', error);
      next(error);
    }
  };
};

// EXPORT UNIQUE ET COHÉRENT
module.exports = {
  tenantResolver,
  checkTenantActive,
  checkPlanLimits,
  requirePlan
};
// back/src/middleware/auth.js
const jwt = require('jsonwebtoken');
const { normalizePermission } = require('../utils/permission.utils');

//  Verify that this function exists and is exported
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token manquant'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'votre_secret_jwt');
    req.user = decoded;

    // ✅ SECURITY: Tenant isolation
    const requestedTenantId = req.headers['x-tenant-id'] || req.query.tenantId;

    if (requestedTenantId && req.user.role !== 'super_admin') {
      if (req.user.tenantId && req.user.tenantId !== requestedTenantId) {
        console.warn(`🛑 Inter-tenant access attempt blocked: User(${req.user.email}) -> Tenant(${requestedTenantId})`);
        return res.status(403).json({
          success: false,
          message: 'Access denied: Domain isolation enabled.'
        });
      }
    }

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Token invalide ou expiré'
    });
  }
};

// Function to verify roles
const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié'
      });
    }

    if (req.user.role !== role && req.user.role !== 'super_admin' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: `Forbidden: This action requires the ${role} role.`
      });
    }

    next();
  };
};

// Function to verify permissions
const hasPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    // Role-based bypass (Total Authority)
    const role = (req.user.role || '').toLowerCase();
    if (role === 'super_admin' || role === 'admin') {
      return next();
    }

    // Permission-based bypass
    if (req.user.permissions?.includes('all')) {
      return next();
    }

    // Robust Normalized comparison + Case-insensitive fallback
    const target = normalizePermission(permission);
    const hasPerm = req.user.permissions?.some(p => {
      const normalizedP = normalizePermission(p);
      return normalizedP === target || p.toLowerCase() === permission.toLowerCase();
    });

    if (hasPerm) {
      return next();
    }

    // ✅ DEBUG LOGGING
    console.warn(`🛑 [Permission Denied] User: ${req.user.email} | Required: ${permission}`);
    
    return res.status(403).json({
      success: false,
      message: `Forbidden: Permission [${permission}] is required.`
    });
  };
};

// EXPORT ALL
module.exports = { auth, requireRole, hasPermission };
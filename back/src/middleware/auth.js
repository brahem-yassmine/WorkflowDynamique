// back/src/middleware/auth.js
const jwt = require('jsonwebtoken');

//  Verify that this function exists and is exported
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Missing token'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
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
      message: 'Invalid token'
    });
  }
};

// Function to verify roles
const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    if (req.user.role !== role && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: `Role ${role} required`
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

    if (req.user.role === 'super_admin') return next();

    if (!req.user.permissions || !req.user.permissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        message: `Missing required permission: ${permission}`
      });
    }

    next();
  };
};

// EXPORT ALL
module.exports = { auth, requireRole, hasPermission };
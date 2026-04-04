// back/src/middleware/auth.js
const jwt = require('jsonwebtoken');

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

    if (req.user.role !== role && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: `Rôle ${role} requis`
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

// Check granular authority (Domain, Module, Action)
const checkUserAuthority = (user, requiredAuth) => {
  if (!user) return false;
  
  // Super Admins bypass all checks
  if (user.role === 'super_admin') return true;
  
  const { domain, module, action } = requiredAuth;
  
  // If no specific authority is required, allow access
  if (!domain || !module || !action) return true;
  
  if (!user.permissions || !Array.isArray(user.permissions)) return false;
  
  // Find a matching permission entry
  return user.permissions.some(p => 
    p.domain === domain && 
    p.module === module && 
    (p.actions.includes(action) || p.actions.includes('all') || p.actions.includes('*'))
  );
};

// EXPORT ALL
module.exports = { auth, requireRole, hasPermission, checkUserAuthority };
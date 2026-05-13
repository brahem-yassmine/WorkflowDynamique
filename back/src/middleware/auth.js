// back/src/middleware/auth.js
const jwt = require('jsonwebtoken');
const { normalizePermission } = require('../utils/permission.utils');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token manquant'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    req.user = decoded;

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

const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }

    const rawRole = req.user.role;
    const userRole = typeof rawRole === 'object' ? rawRole?.name || rawRole?.label || rawRole?.slug : rawRole;
    const roleString = String(userRole || '').toLowerCase();

    // Aggressive Admin detection
    const isAdmin = 
      roleString === 'admin' || 
      roleString === 'super_admin' || 
      roleString.includes('admin') || 
      roleString.includes('super') || 
      roleString.includes('owner') ||
      req.user.permissions?.includes('all');

    if (isAdmin || roleString === role.toLowerCase()) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Forbidden: This action requires the ${role} role.`
    });
  };
};

const hasPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const rawRole = req.user.role;
    const userRole = typeof rawRole === 'object' ? rawRole?.name || rawRole?.label || rawRole?.slug : rawRole;
    const roleString = String(userRole || '').toLowerCase();

    // Total Authority Bypass (Admin, Super, Owner, etc.)
    const isFullAuth = 
      roleString.includes('admin') || 
      roleString.includes('super') || 
      roleString.includes('owner') ||
      req.user.permissions?.includes('all') ||
      req.user.permissions?.map(p => String(p).toLowerCase()).includes('all');

    if (isFullAuth) {
      return next();
    }

    // Special Case: Form.SUBMIT is often required for active workflow participants
    // If the user is authenticated and the permission is Form.SUBMIT, we allow it
    // if it's coming from a legitimate submission endpoint.
    if (permission === 'Form.SUBMIT' || permission === 'Form.VIEW') {
       // We can be more permissive here as the controller will check if the user 
       // actually has access to that specific form instance/task.
       return next();
    }

    const target = normalizePermission(permission);
    const hasPerm = req.user.permissions?.some(p => {
      const normalizedP = normalizePermission(p);
      return normalizedP === target || p.toLowerCase() === permission.toLowerCase();
    });

    if (hasPerm) {
      return next();
    }

    console.warn(`🛑 [Permission Denied] User: ${req.user.email} | Required: ${permission}`);
    
    return res.status(403).json({
      success: false,
      message: `Forbidden: Permission [${permission}] is required.`
    });
  };
};

module.exports = { auth, requireRole, hasPermission };
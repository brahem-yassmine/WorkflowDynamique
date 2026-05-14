const jwt = require('jsonwebtoken');
const { normalizePermission } = require('../utils/permission.utils');

/**
 * Helper to robustly extract role string from user object or string
 */
const extractRole = (role) => {
  const userRole = typeof role === 'object' ? role?.name || role?.label || role?.slug : role;
  return String(userRole || '').toLowerCase();
};

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

    // NORMALIZE ROLE: Ensure it's always a string for the rest of the app
    req.user.role = extractRole(req.user.role);

    let requestedTenantId = req.headers['x-tenant-id'] || req.query.tenantId;
    
    // Safety check for common frontend storage issues
    if (requestedTenantId === 'undefined' || requestedTenantId === 'null') {
      requestedTenantId = null;
    }

    const isSuperAdmin = req.user.role === 'super_admin';

    // Domain isolation bypass for Super Admins
    if (requestedTenantId && !isSuperAdmin) {
      const userTenantId = req.user.tenantId?.toString();
      const targetTenantId = requestedTenantId?.toString();

      if (userTenantId && userTenantId !== targetTenantId) {
        console.warn(`🛑 [AuthIsolation] Blocked: User(${req.user.email}) [Tenant: ${userTenantId}] -> Requested Tenant(${targetTenantId})`);
        return res.status(403).json({
          success: false,
          message: `Access denied: Domain isolation enabled. User belongs to ${userTenantId} but requested ${targetTenantId}.`
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

    const roleString = extractRole(req.user.role);
    const requiredRole = String(role || '').toLowerCase();

    // Super Admin always passes everything
    const isSuperAdmin = roleString === 'super_admin';
    if (isSuperAdmin) return next();

    // Aggressive Admin detection (but only if requested role is 'admin' or matches exactly)
    const isAdmin = 
      roleString === 'admin' || 
      roleString.includes('admin') || 
      roleString.includes('owner') ||
      req.user.permissions?.includes('all');

    // If super_admin is required, ONLY super_admin (handled above) can pass
    if (requiredRole === 'super_admin') {
        console.warn(`🛑 [Access Denied] User: ${req.user.email} (Role: ${roleString}) attempted to access super_admin only route.`);
        return res.status(403).json({
            success: false,
            message: "Forbidden: This action requires the super_admin role."
        });
    }

    if (isAdmin && (requiredRole === 'admin' || roleString === requiredRole)) {
      return next();
    }

    if (roleString === requiredRole) {
      return next();
    }

    console.warn(`🛑 [Access Denied] User: ${req.user.email} (Role: ${roleString}) | Required: ${requiredRole}`);

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
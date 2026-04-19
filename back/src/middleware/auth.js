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

    const userRole = req.user.role?.toLowerCase();
    if (userRole !== role.toLowerCase() && userRole !== 'super_admin' && userRole !== 'admin') {
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
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const userRole = req.user.role?.toLowerCase();
    
    // ✅ SUPER ADMIN & ADMIN bypass for matrix checks
    if (userRole === 'super_admin' || userRole === 'admin') return next();

    // 1. JWT TOKEN CHECK (Fast Path - Static Snapshot)
    const userPerms = req.user.permissions || [];
    if (userPerms.some(p => p.toLowerCase() === permission.toLowerCase())) {
      return next();
    }

    // 2. DYNAMIC DATABASE CHECK (Authority Node Synchronization)
    // If permission is not in token, verify against the live database state.
    if (req.tenantConn && req.user.id) {
        try {
            // Use existing models on the connection to avoid compilation errors
            const User = req.tenantConn.models.User || require('../models/tenant/User')(req.tenantConn);
            const Role = req.tenantConn.models.Role || require('../models/tenant/role.model')(req.tenantConn);

            // Fetch the most recent authority mapping for this specific user
            const dbUser = await User.findById(req.user.id).select('specificRoleId role');
            
            if (dbUser) {
                let targetRoleId = dbUser.specificRoleId;

                // Fallback: If no specific authority node, check the base role (e.g., 'user')
                if (!targetRoleId && dbUser.role) {
                    const baseRole = await Role.findOne({ name: dbUser.role });
                    if (baseRole) targetRoleId = baseRole._id;
                }

                if (targetRoleId) {
                    const activeNode = await Role.findById(targetRoleId).select('permissions');
                    if (activeNode) {
                        const livePerms = activeNode.permissions || [];
                        const hasPerm = livePerms.some(p => p.toLowerCase() === permission.toLowerCase());
                        
                        if (hasPerm) {
                            // console.log(`✅ [MatrixSync] Permission [${permission}] verified via live DB check.`);
                            return next();
                        }
                    }
                }
            }
        } catch (dbErr) {
            console.error('⚠️ [PermissionEngine] Dynamic check failed:', dbErr.message);
        }
    }

    // Rejection if the protocol identifier is missing from both token and database
    return res.status(403).json({
      success: false,
      message: `Forbidden: Matrix restricted identifier [${permission}] is required.`
    });
  };
};

// EXPORT ALL
module.exports = { auth, requireRole, hasPermission };
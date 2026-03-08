/**
 * Audit Logger Service
 * Records user actions into the tenant's ActivityLog collection.
 */

const recordActivity = async (req, action, resource, details = {}) => {
    try {
        const tenantConn = req.tenantConn;
        if (!tenantConn) {
            console.error('AuditLogger: No tenantConn found on request object');
            return;
        }

        // Ensure ActivityLog model is loaded on this connection
        if (!tenantConn.models['ActivityLog']) {
            require('../models/tenant/ActivityLog')(tenantConn);
        }
        const ActivityLog = tenantConn.model('ActivityLog');

        // Extract user info from request (assuming auth middleware is used)
        const user = req.user || {};

        // Infer category based on action
        let category = 'LOG';
        if (action.includes('CREATE') || action.includes('DELETE') || action.includes('CLONE') || action.includes('INVITE') || action.includes('PROCESS')) {
            category = 'HISTORY';
        } else if (action.includes('UPDATE') || action.includes('REORDER')) {
            category = 'AUDIT';
        } else if (action === 'SIGN_IN' || action === 'SIGN_OUT') {
            category = 'LOG';
        }

        const logData = {
            user: {
                id: user.id || user._id,
                email: user.email,
                name: user.name || user.firstName || user.username,
                role: user.role
            },
            action,
            category,
            resource: {
                type: resource.type,
                id: resource.id,
                name: resource.name
            },
            details,
            ip: req.ip || req.connection.remoteAddress,
            timestamp: new Date()
        };

        const log = new ActivityLog(logData);
        await log.save();
    } catch (error) {
        console.error('AuditLogger Error:', error.message);
    }
};

module.exports = {
    recordActivity
};

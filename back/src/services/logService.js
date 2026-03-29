const mongoose = require('mongoose');

class LogService {
  constructor(connection) {
    this.Log = require('../models/master/Log')(connection);
    this.Notification = require('../models/master/Notification')(connection);
    this.SuperAdmin = require('../models/master/SuperAdmin')(connection);
    this.connection = connection;
  }

  // Success login log
  async logLoginSuccess(user, req) {
    return this.Log.createLog({
      userId: user._id,
      userModel: user.role === 'super_admin' ? 'SuperAdmin' : 'Tenant',
      userEmail: user.email,
      userName: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email,
      userRole: user.role === 'super_admin' ? 'super_admin' : 'tenant_admin',
      actionType: 'LOGIN_SUCCESS',
      entityType: 'LOGIN',
      description: `Success login for ${user.email}`,
      details: {
        method: 'password',
        timestamp: new Date()
      },
      ipAddress: req.clientInfo.ipAddress,
      userAgent: req.clientInfo.userAgent,
      browser: req.clientInfo.browser,
      os: req.clientInfo.os,
      device: req.clientInfo.device,
      status: 'SUCCESS',
      requestId: req.requestId,
      sessionId: req.sessionID,
      tenantId: user.role !== 'super_admin' ? user._id : null
    });
  }

  // Internal helper to notify all Super Admins
  async _notifySuperAdmins(title, message, link = '/super_admin/security') {
    try {
      const superAdmins = await this.SuperAdmin.find({ isActive: true });
      const notifications = superAdmins.map(admin => ({
        recipient: admin._id,
        recipientModel: 'SuperAdmin',
        title,
        message,
        type: 'security',
        link,
        read: false
      }));

      if (notifications.length > 0) {
        await this.Notification.insertMany(notifications);
      }
    } catch (err) {
      console.error('❌ Failed to broadcast security notification:', err.message);
    }
  }

  // Failed login log
  async logLoginFailed(email, req, errorMessage) {
    const log = await this.Log.createLog({
      userId: null,
      userEmail: email,
      userRole: 'tenant_admin',
      actionType: 'LOGIN_FAILED',
      entityType: 'LOGIN',
      description: `Failed login attempt for ${email}`,
      details: {
        error: errorMessage,
        timestamp: new Date()
      },
      ipAddress: req.clientInfo.ipAddress,
      userAgent: req.clientInfo.userAgent,
      browser: req.clientInfo.browser,
      os: req.clientInfo.os,
      device: req.clientInfo.device,
      status: 'FAILED',
      errorMessage,
      requestId: req.requestId
    });

    // Notify Super Admins
    await this._notifySuperAdmins(
      'Security Alert: Failed Login',
      `Suspicious attempt detected for ${email} from ${req.clientInfo.ipAddress}`
    );

    return log;
  }

  // Error log
  async logError(user, error, req, context = {}) {
    const log = await this.Log.createLog({
      userId: user ? user._id : null,
      userModel: user ? (user.role === 'super_admin' ? 'SuperAdmin' : 'Tenant') : null,
      userEmail: user ? user.email : 'system',
      userRole: user ? (user.role === 'super_admin' ? 'super_admin' : 'tenant_admin') : 'tenant_admin',
      actionType: 'ERROR',
      entityType: 'OTHER',
      description: `Error: ${error.message}`,
      details: {
        context,
        stack: error.stack
      },
      ipAddress: req ? req.clientInfo.ipAddress : '',
      userAgent: req ? req.clientInfo.userAgent : '',
      browser: req ? req.clientInfo.browser : '',
      os: req ? req.clientInfo.os : '',
      device: req ? req.clientInfo.device : '',
      status: 'FAILED',
      errorMessage: error.message,
      errorStack: error.stack,
      requestId: req ? req.requestId : null,
      sessionId: req ? req.sessionID : null,
      tenantId: user && user.role !== 'super_admin' ? user._id : null
    });

  // Notify Super Admins of system criticals
    await this._notifySuperAdmins(
      'System Alert: Critical Error',
      `Unexpected error detected: ${error.message}. Check forensics for details.`
    );

    return log;
  }

  // Logout log
  async logLogout(user, req) {
    return this.Log.createLog({
      userId: user._id,
      userModel: user.role === 'super_admin' ? 'SuperAdmin' : 'Tenant',
      userEmail: user.email,
      userName: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email,
      userRole: user.role === 'super_admin' ? 'super_admin' : 'tenant_admin',
      actionType: 'LOGOUT',
      entityType: 'LOGIN',
      description: `Logout of ${user.email}`,
      ipAddress: req.clientInfo.ipAddress,
      userAgent: req.clientInfo.userAgent,
      browser: req.clientInfo.browser,
      os: req.clientInfo.os,
      device: req.clientInfo.device,
      status: 'SUCCESS',
      requestId: req.requestId,
      sessionId: req.sessionID,
      tenantId: user.role !== 'super_admin' ? user._id : null
    });
  }

  // Entity creation log
  async logCreate(user, entityType, entity, req, details = {}) {
    return this.Log.createLog({
      userId: user._id,
      userModel: user.role === 'super_admin' ? 'SuperAdmin' : 'Tenant',
      userEmail: user.email,
      userName: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email,
      userRole: user.role === 'super_admin' ? 'super_admin' : 'tenant_admin',
      actionType: 'CREATE',
      entityType,
      entityId: entity._id,
      entityName: entity.name || entity.email || entity._id.toString(),
      description: `Creation of ${entityType.toLowerCase()}: ${entity.name || entity.email || entity._id}`,
      details,
      changes: { after: entity },
      ipAddress: req.clientInfo.ipAddress,
      userAgent: req.clientInfo.userAgent,
      browser: req.clientInfo.browser,
      os: req.clientInfo.os,
      device: req.clientInfo.device,
      status: 'SUCCESS',
      requestId: req.requestId,
      sessionId: req.sessionID,
      tenantId: user.role !== 'super_admin' ? user._id : null
    });
  }

  // Update log
  async logUpdate(user, entityType, entityId, before, after, req, details = {}) {
    return this.Log.createLog({
      userId: user._id,
      userModel: user.role === 'super_admin' ? 'SuperAdmin' : 'Tenant',
      userEmail: user.email,
      userName: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email,
      userRole: user.role === 'super_admin' ? 'super_admin' : 'tenant_admin',
      actionType: 'UPDATE',
      entityType,
      entityId,
      entityName: after.name || after.email || entityId.toString(),
      description: `Update of ${entityType.toLowerCase()}: ${after.name || after.email || entityId}`,
      details,
      changes: { before, after },
      ipAddress: req.clientInfo.ipAddress,
      userAgent: req.clientInfo.userAgent,
      browser: req.clientInfo.browser,
      os: req.clientInfo.os,
      device: req.clientInfo.device,
      status: 'SUCCESS',
      requestId: req.requestId,
      sessionId: req.sessionID,
      tenantId: user.role !== 'super_admin' ? user._id : null
    });
  }

  // Deletion log
  async logDelete(user, entityType, entity, req) {
    return this.Log.createLog({
      userId: user._id,
      userModel: user.role === 'super_admin' ? 'SuperAdmin' : 'Tenant',
      userEmail: user.email,
      userName: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email,
      userRole: user.role === 'super_admin' ? 'super_admin' : 'tenant_admin',
      actionType: 'DELETE',
      entityType,
      entityId: entity._id,
      entityName: entity.name || entity.email || entity._id.toString(),
      description: `Deletion of ${entityType.toLowerCase()}: ${entity.name || entity.email || entity._id}`,
      details: { deleted: entity },
      ipAddress: req.clientInfo.ipAddress,
      userAgent: req.clientInfo.userAgent,
      browser: req.clientInfo.browser,
      os: req.clientInfo.os,
      device: req.clientInfo.device,
      status: 'SUCCESS',
      requestId: req.requestId,
      sessionId: req.sessionID,
      tenantId: user.role !== 'super_admin' ? user._id : null
    });
  }
  // Fetch logs with filters
  async getLogs(filters = {}, page = 1, limit = 50) {
    const query = {};

    if (filters.userId) query.userId = filters.userId;
    if (filters.userEmail) query.userEmail = { $regex: filters.userEmail, $options: 'i' };
    if (filters.userRole) query.userRole = filters.userRole;
    if (filters.actionType) query.actionType = filters.actionType;
    if (filters.entityType) query.entityType = filters.entityType;
    if (filters.entityId) query.entityId = filters.entityId;
    if (filters.status) query.status = filters.status;
    if (filters.tenantId) query.tenantId = filters.tenantId;
    if (filters.ipAddress) query.ipAddress = { $regex: filters.ipAddress };

    if (filters.startDate || filters.endDate) {
      query.timestamp = {};
      if (filters.startDate) query.timestamp.$gte = new Date(filters.startDate);
      if (filters.endDate) query.timestamp.$lte = new Date(filters.endDate);
    }

    if (filters.search) {
      query.$or = [
        { description: { $regex: filters.search, $options: 'i' } },
        { userEmail: { $regex: filters.search, $options: 'i' } },
        { entityName: { $regex: filters.search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      this.Log.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.Log.countDocuments(query)
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Get log statistics
  async getLogStats(startDate, endDate) {
    const match = {};
    if (startDate || endDate) {
      match.timestamp = {};
      if (startDate) match.timestamp.$gte = new Date(startDate);
      if (endDate) match.timestamp.$lte = new Date(endDate);
    }

    return this.Log.aggregate([
      { $match: match },
      {
        $facet: {
          byActionType: [
            { $group: { _id: '$actionType', count: { $sum: 1 } } }
          ],
          byUserRole: [
            { $group: { _id: '$userRole', count: { $sum: 1 } } }
          ],
          byStatus: [
            { $group: { _id: '$status', count: { $sum: 1 } } }
          ],
          totalLogs: [
            { $count: 'total' }
          ],
          byHour: [
            {
              $group: {
                _id: { $hour: '$timestamp' },
                count: { $sum: 1 }
              }
            },
            { $sort: { _id: 1 } }
          ],
          byDay: [
            {
              $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
                count: { $sum: 1 }
              }
            },
            { $sort: { _id: 1 } }
          ],
          latestLog: [
            { $sort: { timestamp: -1 } },
            { $limit: 1 },
            { $project: { timestamp: 1 } }
          ],
          byTopActors: [
            { $match: { actionType: { $in: ['LOGIN_FAILED', 'ERROR'] } } },
            { $group: { _id: '$userEmail', count: { $sum: 1 }, lastIP: { $first: '$ipAddress' }, lastStatus: { $first: '$status' } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
          ],
          byTopIPs: [
            { $match: { actionType: { $in: ['LOGIN_FAILED', 'ERROR'] } } },
            { $group: { _id: '$ipAddress', count: { $sum: 1 }, lastUser: { $first: '$userEmail' } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
          ]
        }
      }
    ]);
  }
  
  // Delete a single log by ID
  async deleteLog(id) {
    return this.Log.findByIdAndDelete(id);
  }

  // Bulk delete logs by UI category (matching frontend logic)
  async deleteLogsByCategory(category, isSecurityView = false) {
    let query = {};
    
    if (isSecurityView) {
      if (category === 'LOG') {
        query.actionType = { $in: ['LOGIN_FAILED', 'ERROR'] };
      } else if (category === 'HISTORY') {
        query.actionType = { $in: ['LOGIN_SUCCESS', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE'] };
      } else if (category === 'AUDIT') {
        query.actionType = { $nin: ['LOGIN_FAILED', 'ERROR', 'LOGIN_SUCCESS', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE'] };
      }
    } else {
      if (category === 'LOG') {
        query.actionType = { $in: ['LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT', 'ERROR'] };
      } else if (category === 'HISTORY') {
        query.actionType = { $in: ['CREATE', 'DELETE', 'STATUS_CHANGE', 'SUBSCRIPTION_RENEWAL', 'SUBSCRIPTION_EXPIRATION'] };
      } else if (category === 'AUDIT') {
        query.actionType = { $nin: ['LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT', 'ERROR', 'CREATE', 'DELETE', 'STATUS_CHANGE', 'SUBSCRIPTION_RENEWAL', 'SUBSCRIPTION_EXPIRATION'] };
      }
    }

    return this.Log.deleteMany(query);
  }
}

module.exports = LogService;
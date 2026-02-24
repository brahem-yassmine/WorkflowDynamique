const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  // User who performed the action
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'userModel'
  },
  userModel: {
    type: String,
    required: true,
    enum: ['SuperAdmin', 'Tenant']
  },
  userEmail: {
    type: String,
    required: true
  },
  userName: {
    type: String,
    default: ''
  },
  userRole: {
    type: String,
    enum: ['super_admin', 'tenant_admin'],
    required: true
  },

  // Action type
  actionType: {
    type: String,
    required: true,
    enum: [
      'LOGIN_SUCCESS',
      'LOGIN_FAILED',
      'LOGOUT',
      'CREATE',
      'UPDATE',
      'DELETE',
      'VIEW',
      'EXPORT',
      'IMPORT',
      'PASSWORD_CHANGE',
      'PASSWORD_RESET',
      'STATUS_CHANGE',
      'PERMISSION_CHANGE',
      'CONFIGURATION_CHANGE',
      'BACKUP_CREATED',
      'BACKUP_RESTORED',
      'ERROR'
    ]
  },

  // Affected entity
  entityType: {
    type: String,
    enum: [
      'TENANT',
      'USER',
      'PLAN',
      'SETTINGS',
      'DATABASE',
      'BACKUP',
      'LOGIN',
      'OTHER'
    ],
    default: 'OTHER'
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  entityName: {
    type: String,
    default: ''
  },

  // Action details
  description: {
    type: String,
    required: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  changes: {
    before: mongoose.Schema.Types.Mixed,
    after: mongoose.Schema.Types.Mixed
  },

  // Request information
  ipAddress: {
    type: String,
    default: ''
  },
  userAgent: {
    type: String,
    default: ''
  },
  browser: String,
  os: String,
  device: String,

  // Action status
  status: {
    type: String,
    enum: ['SUCCESS', 'FAILED', 'PENDING'],
    default: 'SUCCESS'
  },
  errorMessage: String,
  errorStack: String,

  // Metadata
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  sessionId: String,
  requestId: String,
  duration: Number, // in milliseconds

  // Affected tenant (if applicable)
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    default: null
  }

}, {
  timestamps: true,
  collection: 'logs'
});

// Index to improve query performance
logSchema.index({ userId: 1, timestamp: -1 });
logSchema.index({ actionType: 1, timestamp: -1 });
logSchema.index({ userEmail: 1, timestamp: -1 });
logSchema.index({ entityType: 1, entityId: 1 });
logSchema.index({ timestamp: -1 });
logSchema.index({ tenantId: 1, timestamp: -1 });

// Static method to create a log
logSchema.statics.createLog = async function (data) {
  try {
    const log = new this(data);
    await log.save();
    return log;
  } catch (error) {
    console.error('Error creating log:', error);
    return null;
  }
};

// Method to clean old logs (optional)
logSchema.statics.cleanOldLogs = async function (daysToKeep = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  return this.deleteMany({
    timestamp: { $lt: cutoffDate }
  });
};

module.exports = (connection) => {
  return connection.model('Log', logSchema);
};
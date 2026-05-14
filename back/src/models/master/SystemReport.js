const mongoose = require('mongoose');

module.exports = function (masterConn) {
  const systemReportSchema = new mongoose.Schema({
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant'
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'senderRole'
    },
    senderRole: {
      type: String,
      enum: ['user', 'admin', 'super_admin'],
      default: 'admin'
    },
    senderName: {
      type: String
    },
    senderEmail: {
      type: String
    },
    adminId: {
      type: String
    },
    adminEmail: {
      type: String
    },
    subject: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['bug', 'improvement', 'question', 'error', 'help_request', 'comment', 'other'],
      default: 'bug'
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    status: {
      type: String,
      enum: ['pending', 'in_review', 'resolved', 'closed', 'deleted'],
      default: 'pending'
    },
    response: {
      type: String
    },
    respondedAt: {
      type: Date
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  });

  return masterConn.model('SystemReport', systemReportSchema);
};

const mongoose = require('mongoose');

module.exports = function(masterConn) {
  const systemReportSchema = new mongoose.Schema({
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true
    },
    adminId: {
      type: String, // Or ObjectId if admins are in a collection, but here it's likely the admin profile info
      required: true
    },
    adminEmail: {
      type: String,
      required: true
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
      enum: ['bug', 'improvement', 'question', 'other'],
      default: 'bug'
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    status: {
      type: String,
      enum: ['pending', 'in_review', 'resolved', 'closed'],
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

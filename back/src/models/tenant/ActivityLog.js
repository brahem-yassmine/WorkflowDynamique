const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
    user: {
        id: { type: mongoose.Schema.Types.ObjectId, required: true },
        email: { type: String, required: true },
        name: { type: String },
        role: { type: String }
    },
    action: {
        type: String,
        required: true,
        enum: [
            'CREATE_FORM', 'UPDATE_FORM', 'DELETE_FORM', 'CLONE_FORM',
            'CREATE_USER', 'UPDATE_USER', 'DELETE_USER',
            'CREATE_WORKFLOW', 'UPDATE_WORKFLOW', 'DELETE_WORKFLOW', 'CLONE_WORKFLOW',
            'CREATE_TASK', 'UPDATE_TASK', 'DELETE_TASK', 'REORDER_TASKS',
            'SIGN_IN', 'SIGN_OUT',
            'CREATE_PROJECT', 'UPDATE_PROJECT', 'DELETE_PROJECT',
            'INVITE_USER', 'PROCESS_INVITATION'
        ]
    },
    category: {
        type: String,
        required: true,
        enum: ['LOG', 'HISTORY', 'AUDIT'],
        default: 'LOG'
    },
    resource: {
        type: { type: String, required: true }, // e.g., 'Form', 'User', 'Workflow'
        id: { type: mongoose.Schema.Types.ObjectId },
        name: { type: String }
    },
    details: { type: mongoose.Schema.Types.Mixed },
    ip: { type: String },
    timestamp: { type: Date, default: Date.now }
}, {
    timestamps: true,
    collection: 'activity_logs'
});

activityLogSchema.index({ 'user.id': 1, timestamp: -1 });
activityLogSchema.index({ action: 1, timestamp: -1 });
activityLogSchema.index({ timestamp: -1 });

module.exports = (connection) => {
    return connection.model('ActivityLog', activityLogSchema);
};

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
            'PROJECT_CREATE', 'PROJECT_DELETE', 'PROJECT_EDIT', 'PROJECT_VIEW',
            'WORKFLOW_CREATE', 'WORKFLOW_CLONE', 'WORKFLOW_DELETE', 'WORKFLOW_EDIT', 'WORKFLOW_VIEW',
            'DOMAIN_CREATE', 'DOMAIN_DELETE', 'DOMAIN_EDIT', 'DOMAIN_VIEW',
            'MODULE_CREATE', 'MODULE_DELETE', 'MODULE_EDIT', 'MODULE_VIEW',
            'FORM_ADD', 'FORM_CLONE', 'FORM_CREATE', 'FORM_DELETE', 'FORM_EDIT', 'FORM_FILL', 'FORM_MANAGE_STATUS', 'FORM_VIEW',
            'CHECKLIST_ADD_TASK', 'CHECKLIST_CLONE', 'CHECKLIST_CREATE', 'CHECKLIST_DELETE', 'CHECKLIST_EDIT',
            'TASK_CREATE', 'TASK_ASSIGN_TO_USER', 'TASK_MANAGE_VALIDATION', 'TASK_ASSIGN_KANBAN', 'TASK_EDIT', 'TASK_VIEW', 'TASK_ACTION',
            'SIGN_IN', 'SIGN_OUT', 'INVITE_USER', 'PROCESS_INVITATION'
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

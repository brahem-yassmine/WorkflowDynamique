const mongoose = require('mongoose');

const formFieldSchema = new mongoose.Schema({
    id: { type: String, required: true },
    type: { type: String, required: true },
    label: { type: String, required: true },
    placeholder: { type: String },
    required: { type: Boolean, default: false },
    options: [{ type: String }],
    width: { type: String, enum: ['full', 'half'], default: 'half' }
});

const stepSchema = new mongoose.Schema({
    id: { type: String, required: true },
    title: { type: String, required: true },
    fields: [formFieldSchema],
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    }
});

const dynamicFormSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    steps: [stepSchema],
    status: {
        type: String,
        enum: ['draft', 'published', 'archived'],
        default: 'draft'
    },
    // Note: tenantId is removed here as it is implicit in the tenant-specific database
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    publishedAt: { type: Date },
    version: { type: Number, default: 1 },
    submissionCount: { type: Number, default: 0 },
    settings: {
        allowMultipleSubmissions: { type: Boolean, default: false },
        requireLogin: { type: Boolean, default: true },
        confirmationMessage: { type: String },
        redirectUrl: { type: String }
    }
}, {
    timestamps: true
});

// ✅ Factory pattern pour le multi-tenant
module.exports = (connection) => connection.model('DynamicForm', dynamicFormSchema);
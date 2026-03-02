const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['todo', 'doing', 'done'],
        default: 'todo'
    },
    position: {
        type: Number,
        default: 0
    },
    dueDate: {
        type: Date
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    assignedDomain: {
        type: String,
        description: 'Department assigned to this task'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    boardId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Board'
    },
    type: {
        type: String,
        enum: ['normal', 'form'],
        default: 'normal'
    },
    linkedFormId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Form'
    },
    attachments: [{
        filename: String,
        url: String,
        uploadedAt: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

// Index for performance on status and position
taskSchema.index({ status: 1, position: 1 });

module.exports = (connection) => connection.model('Task', taskSchema);

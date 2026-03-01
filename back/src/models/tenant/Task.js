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
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    boardId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Board'
    }
}, { timestamps: true });

// Index for performance on status and position
taskSchema.index({ status: 1, position: 1 });

module.exports = (connection) => connection.model('Task', taskSchema);

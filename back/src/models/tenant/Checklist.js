const mongoose = require('mongoose');

const checklistTaskSchema = new mongoose.Schema({
    id: { type: String, required: true },
    title: { type: String, required: true },
    completed: { type: Boolean, default: false },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    }
});

const checklistSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    tasks: [checklistTaskSchema],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

// Factory pattern
module.exports = (connection) => connection.model('Checklist', checklistSchema);

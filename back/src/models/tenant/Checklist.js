// back/src/models/tenant/Checklist.js
const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    id: { type: String, required: true },
    title: { type: String, required: true },
    completed: { type: Boolean, default: false },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' }
}, { _id: false });

const checklistSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    tasks: [taskSchema],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

module.exports = (connection) => connection.model('Checklist', checklistSchema);

// back/src/models/tenant/DynamicForm.js
const mongoose = require('mongoose');

const fieldSchema = new mongoose.Schema({
    id: { type: String, required: true },
    type: { type: String, required: true },
    label: { type: String, required: true },
    placeholder: String,
    required: { type: Boolean, default: false },
    width: { type: String, enum: ['full', 'half'], default: 'half' },
    options: [String]
}, { _id: false });

const stepSchema = new mongoose.Schema({
    id: { type: String, required: true },
    title: { type: String, required: true },
    status: { type: String, default: 'active' },
    fields: [fieldSchema]
}, { _id: false });

const dynamicFormSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: String,
    steps: [stepSchema],
    status: {
        type: String,
        enum: ['draft', 'active', 'archived'],
        default: 'draft'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

module.exports = (connection) => connection.model('DynamicForm', dynamicFormSchema);

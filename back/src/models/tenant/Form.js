// back/src/models/tenant/Form.js
const mongoose = require('mongoose');

const fieldSchema = new mongoose.Schema({
    id: { type: String, required: true },
    type: { type: String, required: true },
    label: { type: String, required: true },
    required: { type: Boolean, default: false },
    width: { type: String, default: 'full' },
    placeholder: String,
    options: [String]
}, { _id: false });

const stepSchema = new mongoose.Schema({
    id: { type: String, required: true },
    title: { type: String, required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    fields: [fieldSchema]
}, { _id: false });

const formSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: String,
    steps: [stepSchema],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

module.exports = (connection) => connection.model('Form', formSchema);

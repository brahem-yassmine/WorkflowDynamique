// back/src/models/master/Role.js
const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    permissions: [{
        type: String
    }],
    isDefault: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isSystemRole: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    collection: 'system_roles'
});

module.exports = (connection) => {
    return connection.model('Role', roleSchema);
};

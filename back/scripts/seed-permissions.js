// back/scripts/seed-permissions.js
require('dotenv').config();
const mongoose = require('mongoose');
const Permission = require('../src/models/master/permission.model');

const MASTER_DB_URI = process.env.MASTER_DB_URI || 'mongodb://localhost:27017/workflow_master';

const permissions = [
    // WORKFLOW permissions
    { name: 'WORKFLOW_CREATE', description: 'Can create new workflows', category: 'WORKFLOW' },
    { name: 'WORKFLOW_VIEW', description: 'Can view workflows', category: 'WORKFLOW' },
    { name: 'WORKFLOW_EDIT', description: 'Can edit existing workflows', category: 'WORKFLOW' },
    { name: 'WORKFLOW_DELETE', description: 'Can delete workflows', category: 'WORKFLOW' },
    { name: 'WORKFLOW_PUBLISH', description: 'Can publish workflows', category: 'WORKFLOW' },
    { name: 'WORKFLOW_ARCHIVE', description: 'Can archive workflows', category: 'WORKFLOW' },
    { name: 'WORKFLOW_DUPLICATE', description: 'Can duplicate workflows', category: 'WORKFLOW' },
    { name: 'WORKFLOW_CONFIGURE_ACL', description: 'Can configure access control for workflows', category: 'WORKFLOW' },

    // USER permissions
    { name: 'USER_CREATE', description: 'Can create users', category: 'USER' },
    { name: 'USER_EDIT', description: 'Can edit users', category: 'USER' },
    { name: 'USER_DELETE', description: 'Can delete users', category: 'USER' },
    { name: 'USER_VIEW', description: 'Can view users', category: 'USER' },

    // ROLE permissions
    { name: 'ROLE_CREATE', description: 'Can create roles', category: 'ROLE' },
    { name: 'ROLE_EDIT', description: 'Can edit roles', category: 'ROLE' },
    { name: 'ROLE_DELETE', description: 'Can delete roles', category: 'ROLE' },
    { name: 'ROLE_VIEW', description: 'Can view roles', category: 'ROLE' },

    // PROJECT permissions
    { name: 'PROJECT_CREATE', description: 'Can create projects', category: 'PROJECT' },
    { name: 'PROJECT_EDIT', description: 'Can edit projects', category: 'PROJECT' },
    { name: 'PROJECT_DELETE', description: 'Can delete projects', category: 'PROJECT' },
    { name: 'PROJECT_VIEW', description: 'Can view projects', category: 'PROJECT' },
    { name: 'PROJECT_ARCHIVE', description: 'Can archive projects', category: 'PROJECT' },
    { name: 'PROJECT_PUBLISH', description: 'Can publish projects', category: 'PROJECT' },
];

async function seedPermissions() {
    try {
        const conn = await mongoose.createConnection(MASTER_DB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Connected to Master DB');

        const Permission = require('../src/models/master/permission.model')(conn);

        for (const p of permissions) {
            await Permission.findOneAndUpdate(
                { name: p.name },
                p,
                { upsert: true, new: true }
            );
            console.log(`📦 Seeded permission: ${p.name}`);
        }

        console.log('🚀 Permissions seeded successfully!');

        // Seed Global Roles
        const Role = require('../src/models/master/Role')(conn);
        const globalRoles = [
            {
                name: 'Administrator',
                description: 'Full system access with authority to manage all organizational assets.',
                permissions: permissions.map(p => p.name),
                isDefault: true,
                isSystemRole: true
            },
            {
                name: 'Manager',
                description: 'Manage workflows and users within their assigned domain.',
                permissions: ['WORKFLOW_VIEW', 'WORKFLOW_EDIT', 'USER_VIEW', 'ROLE_VIEW', 'PROJECT_VIEW', 'PROJECT_EDIT'],
                isDefault: false,
                isSystemRole: true
            }
        ];

        for (const r of globalRoles) {
            await Role.findOneAndUpdate(
                { name: r.name },
                r,
                { upsert: true, new: true }
            );
            console.log(`🛡️ Seeded global role: ${r.name}`);
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding permissions:', error);
        process.exit(1);
    }
}

seedPermissions();

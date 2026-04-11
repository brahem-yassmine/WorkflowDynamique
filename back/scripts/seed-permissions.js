// back/scripts/seed-permissions.js
require('dotenv').config();
const mongoose = require('mongoose');
const Permission = require('../src/models/master/permission.model');

const MASTER_DB_URI = process.env.MASTER_DB_URI || 'mongodb://localhost:27017/workflow_master';

const permissions = [


    // FORM permissions
    { name: 'FORM_ADD', description: 'Can add new forms to sectors', category: 'FORM' },
    { name: 'FORM_CREATE', description: 'Can create form templates', category: 'FORM' },
    { name: 'FORM_DELETE', description: 'Can delete forms', category: 'FORM' },
    { name: 'FORM_EDIT', description: 'Can edit form structures', category: 'FORM' },
    { name: 'FORM_FILL', description: 'Can fill out and submit forms', category: 'FORM' },
    { name: 'FORM_CLONE', description: 'Can clone existing forms', category: 'FORM' },
    { name: 'FORM_VIEW', description: 'Can view form', category: 'FORM' },
    { name: 'FORM_MANAGE_STATUS', description: 'Can activate, draft, approve or reject forms', category: 'FORM' },

    // CHECKLIST permissions
    { name: 'CHECKLIST_CLONE', description: 'Can clone checklist templates', category: 'CHECKLIST' },
    { name: 'CHECKLIST_EDIT', description: 'Can edit checklists', category: 'CHECKLIST' },
    { name: 'CHECKLIST_DELETE', description: 'Can delete checklists', category: 'CHECKLIST' },
    { name: 'CHECKLIST_CREATE', description: 'Can create new checklists', category: 'CHECKLIST' },
    { name: 'CHECKLIST_VIEW', description: 'Can view checklists', category: 'CHECKLIST' },
    { name: 'CHECKLIST_ADD_TASK', description: 'Can add tasks to active checklists', category: 'CHECKLIST' },

    // KANBAN permissions
    { name: 'KANBAN_ADD', description: 'Can add tasks to boards', category: 'KANBAN' },
    { name: 'KANBAN_CREATE', description: 'Can create new boards', category: 'KANBAN' },
    { name: 'KANBAN_DELETE', description: 'Can delete boards', category: 'KANBAN' },
    { name: 'KANBAN_CLONE', description: 'Can clone existing boards', category: 'KANBAN' },
    { name: 'KANBAN_VIEW', description: 'Can view boards', category: 'KANBAN' },
];

async function seedPermissions() {
    try {
        const conn = await mongoose.createConnection(MASTER_DB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Connected to Master DB');

        const Permission = require('../src/models/master/permission.model')(conn);
        // 1. Clean up obsolete permissions
        const currentPermissionNames = permissions.map(p => p.name);
        const deleteResult = await Permission.deleteMany({ name: { $nin: currentPermissionNames } });
        if (deleteResult.deletedCount > 0) {
            console.log(`🗑️ Removed ${deleteResult.deletedCount} obsolete permissions`);
        }

        // 2. Upsert current permissions
        for (const p of permissions) {
            await Permission.findOneAndUpdate(
                { name: p.name },
                p,
                { upsert: true, new: true }
            );
            console.log(`📦 Seeded permission: ${p.name}`);
        }

        console.log('🚀 Permissions synchronized successfully!');
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
                description: 'Manage users and assets within their assigned domain.',
                permissions: ['USER_VIEW', 'ROLE_VIEW'],
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

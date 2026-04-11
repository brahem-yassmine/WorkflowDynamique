// back/src/seeds/seedPermissions.js
const mongoose = require('mongoose');

const permissions = [
  // --- PROJECT ---
  { name: 'PROJECT_CREATE', description: 'Can initialize new projects', category: 'PROJECT' },
  { name: 'PROJECT_DELETE', description: 'Can permanently remove projects', category: 'PROJECT' },
  { name: 'PROJECT_EDIT', description: 'Can modify project metadata and settings', category: 'PROJECT' },
  { name: 'PROJECT_VIEW', description: 'Can view project lists and details', category: 'PROJECT' },

  // --- WORKFLOW ---
  { name: 'WORKFLOW_CREATE', description: 'Can design and create new workflows', category: 'WORKFLOW' },
  { name: 'WORKFLOW_CLONE', description: 'Can duplicate existing workflow definitions', category: 'WORKFLOW' },
  { name: 'WORKFLOW_DELETE', description: 'Can remove workflow definitions', category: 'WORKFLOW' },
  { name: 'WORKFLOW_EDIT', description: 'Can modify existing workflow structures', category: 'WORKFLOW' },
  { name: 'WORKFLOW_VIEW', description: 'Can view workflow designs', category: 'WORKFLOW' },

  // --- DOMAIN ---
  { name: 'DOMAIN_CREATE', description: 'Can create new administrative domains', category: 'DOMAIN' },
  { name: 'DOMAIN_DELETE', description: 'Can remove administrative domains', category: 'DOMAIN' },
  { name: 'DOMAIN_EDIT', description: 'Can update domain configurations', category: 'DOMAIN' },
  { name: 'DOMAIN_VIEW', description: 'Can view domain structures', category: 'DOMAIN' },

  // --- MODULE ---
  { name: 'MODULE_CREATE', description: 'Can create new operational modules', category: 'MODULE' },
  { name: 'MODULE_DELETE', description: 'Can remove operational modules', category: 'MODULE' },
  { name: 'MODULE_EDIT', description: 'Can update module settings', category: 'MODULE' },
  { name: 'MODULE_VIEW', description: 'Can view module details', category: 'MODULE' },

  // --- FORM ---
  { name: 'FORM_ADD', description: 'Can add new forms to the repository', category: 'FORM' },
  { name: 'FORM_CLONE', description: 'Can duplicate existing form templates', category: 'FORM' },
  { name: 'FORM_CREATE', description: 'Can design and initialize new forms', category: 'FORM' },
  { name: 'FORM_DELETE', description: 'Can remove form definitions', category: 'FORM' },
  { name: 'FORM_EDIT', description: 'Can modify form structures and fields', category: 'FORM' },
  { name: 'FORM_FILL', description: 'Can fill out and submit form responses', category: 'FORM' },
  { name: 'FORM_MANAGE_STATUS', description: 'Manage status (pour draft ou active ou approved ou rejeceted)', category: 'FORM' },
  { name: 'FORM_VIEW', description: 'Can view form definitions and submissions', category: 'FORM' },

  // --- CHECKLIST ---
  { name: 'CHECKLIST_ADD_TASK', description: 'Can add new tasks to existing checklists', category: 'CHECKLIST' },
  { name: 'CHECKLIST_CLONE', description: 'Can duplicate checklist templates', category: 'CHECKLIST' },
  { name: 'CHECKLIST_CREATE', description: 'Can initialize new standalone checklists', category: 'CHECKLIST' },
  { name: 'CHECKLIST_DELETE', description: 'Can remove checklist matrices', category: 'CHECKLIST' },
  { name: 'CHECKLIST_EDIT', description: 'Can modify checklist tasks and properties', category: 'CHECKLIST' },

  // --- TASK ---
  { name: 'TASK_CREATE', description: 'Can create new tasks', category: 'TASK' },
  { name: 'TASK_ASSIGN_TO_USER', description: 'Can assign tasks to users or groups', category: 'TASK' },
  { name: 'TASK_MANAGE_VALIDATION', description: 'Manage validation (multi ou simple)', category: 'TASK' },
  { name: 'TASK_ASSIGN_KANBAN', description: 'Assign kanban ou non', category: 'TASK' },
  { name: 'TASK_EDIT', description: 'Can modify task details and execution parameters', category: 'TASK' },
  { name: 'TASK_VIEW', description: 'Can view task progress and details', category: 'TASK' },
  { name: 'TASK_ACTION', description: 'Action (pour importer doc/image/form ou ecrire report)', category: 'TASK' },

  // --- KANBAN ---
  { name: 'KANBAN_VIEW', description: 'Can view kanban boards', category: 'KANBAN' },
  { name: 'KANBAN_MANAGE', description: 'Can manage kanban cards and columns', category: 'KANBAN' }
];

async function seedPermissions(masterConnection) {
  try {
    const Permission = masterConnection.models.Permission;
    if (!Permission) {
      console.error('❌ [Seed] Permission model not found on masterConnection');
      return;
    }

    console.log('🌱 [Seed] Synchronizing permissions matrix...');

    // 🧹 Authoritative Cleanup: Remove permissions not in the current list
    const validNames = permissions.map(p => p.name);
    const deleteResult = await Permission.deleteMany({ name: { $nin: validNames } });
    if (deleteResult.deletedCount > 0) {
      console.log(`🧹 [Seed] Purged ${deleteResult.deletedCount} legacy/ghost permissions.`);
    }

    for (const p of permissions) {
      await Permission.findOneAndUpdate(
        { name: p.name },
        p,
        { upsert: true, new: true }
      );
    }

    console.log(`✅ [Seed] Successfully sync'd ${permissions.length} permissions.`);
  } catch (error) {
    console.error('❌ [Seed] Permission seeding error:', error);
  }
}

module.exports = seedPermissions;

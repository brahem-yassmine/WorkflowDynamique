// back/src/seeds/seedPermissions.js
const mongoose = require('mongoose');

const permissions = [
  // --- PROJECT ---
  { name: 'Project.CREATE', description: 'Can initialize new projects', category: 'PROJECT' },
  { name: 'Project.DELETE', description: 'Can permanently remove projects', category: 'PROJECT' },
  { name: 'Project.UPDATE', description: 'Can modify project metadata and settings', category: 'PROJECT' },
  { name: 'Project.VIEW', description: 'Can view project lists and details', category: 'PROJECT' },

  // --- WORKFLOW ---
  { name: 'Workflow.CREATE', description: 'Can design and create new workflows', category: 'WORKFLOW' },
  { name: 'Workflow.CLONE', description: 'Can duplicate existing workflow definitions', category: 'WORKFLOW' },
  { name: 'Workflow.DELETE', description: 'Can remove workflow definitions', category: 'WORKFLOW' },
  { name: 'Workflow.UPDATE', description: 'Can modify existing workflow structures', category: 'WORKFLOW' },
  { name: 'Workflow.VIEW', description: 'Can view workflow designs', category: 'WORKFLOW' },
  // Execution moved to Template category


  // --- DOMAIN ---
  { name: 'Domain.CREATE', description: 'Can create new administrative domains', category: 'DOMAIN' },
  { name: 'Domain.DELETE', description: 'Can remove administrative domains', category: 'DOMAIN' },
  { name: 'Domain.UPDATE', description: 'Can update domain configurations', category: 'DOMAIN' },
  { name: 'Domain.VIEW', description: 'Can view domain structures', category: 'DOMAIN' },

  // --- TEMPLATE ---
  { name: 'Template.CREATE', description: 'Can create operational templates', category: 'TEMPLATE' },
  { name: 'Template.DELETE', description: 'Can remove templates', category: 'TEMPLATE' },
  { name: 'Template.UPDATE', description: 'Can modify templates', category: 'TEMPLATE' },
  { name: 'Template.VIEW', description: 'Can view template registry', category: 'TEMPLATE' },
  { name: 'Template.EXECUTE', description: 'Can launch and use workflows based on templates', category: 'TEMPLATE' },


  // --- FORM ---
  { name: 'Form.CREATE', description: 'Can design and initialize new forms', category: 'FORM' },
  { name: 'Form.DELETE', description: 'Can remove form definitions', category: 'FORM' },
  { name: 'Form.UPDATE', description: 'Can modify form structures and fields', category: 'FORM' },
  { name: 'Form.VIEW', description: 'Can view form definitions and submissions', category: 'FORM' },

  // --- CHECKLIST ---

  { name: 'Checklist.VIEW', description: 'Can view checklist outlines and items', category: 'CHECKLIST' },
  { name: 'Checklist.COMPLETE_ITEM', description: 'Can check/uncheck checklist items', category: 'CHECKLIST' },



  // --- KANBAN ---
  { name: 'Kanban.CREATE', description: 'Can create and initialize new kanban boards', category: 'KANBAN' },
  { name: 'Kanban.VIEW', description: 'Can view kanban board structures', category: 'KANBAN' }
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

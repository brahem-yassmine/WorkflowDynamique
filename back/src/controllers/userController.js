
// back/src/controllers/userController.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { recordActivity } = require('../services/auditLogger');


// ✅ No more User import (via req.tenantConn)


// List company users
exports.getUsers = async (req, res) => {
  try {
    if (!req.tenantConn) {
      console.warn('⚠️ [getUsers] No tenant connection, falling back to master for tenant owners');
      // If no tenantConn, we might still want to list tenant owners from master
      const Tenant = req.masterDb.model('Tenant');
      const tenants = await Tenant.find().select('-password');
      return res.json({ success: true, data: tenants });
    }
    const User = req.tenantConn.model('User');

    const users = await User.find()
      .select('-password')
      .populate('domainId', 'name')
      .populate('moduleId', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: users
    });

  } catch (error) {
    console.error('Erreur getUsers:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Create a new user
exports.createUser = async (req, res) => {
  console.log('👤 userController.createUser - Body:', req.body);
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Permission refusée'
      });
    }

    const { email, password, firstName, lastName, role, domain, specificRole, specificRoleId, domainId, moduleId } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email et mot de passe requis'
      });
    }

    const User = req.tenantConn.model('User');

    // Vérifier si l'utilisateur existe déjà dans ce tenant
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Cet utilisateur existe déjà'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      email,
      password: hashedPassword,
      firstName: firstName || '',
      lastName: lastName || '',
      role: role || 'user',
      domain: domain || 'HR',
      specificRole: specificRole || '',
      specificRoleId: specificRoleId || null,
      domainId: domainId || null,
      moduleId: moduleId || null,
      hasSelectedPlan: false
    });

    await user.save();

    // Log the activity
    await recordActivity(req, 'CREATE_USER', {
      type: 'User',
      id: user._id,
      name: `${user.firstName} ${user.lastName}`.trim() || user.email
    });

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: userResponse
    });

  } catch (error) {
    console.error('Erreur createUser:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Update a user (Multi-DB aware: Tenant User, Tenant Owner, or SuperAdmin)
exports.updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;
    let targetUser = null;
    let userModelName = 'User';

    // 1. Search in Tenant-specific database (Standard Users)
    if (req.tenantConn) {
      try {
        const User = req.tenantConn.model('User');
        targetUser = await User.findById(userId);
      } catch (err) {
        console.log('User not found in tenant DB, checking master...');
      }
    }

    // 2. If not found, check in Master DB - Tenant collection (Owners/Admins)
    if (!targetUser && req.masterDb) {
      const Tenant = req.masterDb.model('Tenant');
      targetUser = await Tenant.findById(userId);
      if (targetUser) userModelName = 'Tenant';
    }

    // 3. If still not found, check in Master DB - SuperAdmin collection
    if (!targetUser && req.masterDb) {
      const SuperAdmin = req.masterDb.model('SuperAdmin');
      targetUser = await SuperAdmin.findById(userId);
      if (targetUser) userModelName = 'SuperAdmin';
    }

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Permission check
    const isSelf = req.user.id.toString() === userId;
    const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin';

    if (!isAdmin && !isSelf) {
      return res.status(403).json({
        success: false,
        message: 'Permission refusée'
      });
    }

    // Don't allow changing role if not authorized
    if (!isAdmin && updates.role) {
      delete updates.role;
    }

    // Password hashing
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    // Field Mapping for Models with different name fields
    if (updates.name && !updates.firstName && !updates.lastName) {
      const parts = updates.name.trim().split(/\s+/);
      updates.firstName = parts[0] || '';
      updates.lastName = parts.slice(1).join(' ') || '';
    }

    if (userModelName === 'Tenant') {
      // For Tenant model, we use adminName
      const fName = updates.firstName || targetUser.adminName?.split(' ')[0] || 'Admin';
      const lName = updates.lastName || targetUser.adminName?.split(' ').slice(1).join(' ') || '';
      updates.adminName = `${fName} ${lName}`.trim();
    }

    // Apply updates
    Object.assign(targetUser, updates);
    await targetUser.save();

    // Log the activity
    await recordActivity(req, 'UPDATE_USER', {
      type: userModelName,
      id: targetUser._id,
      name: userModelName === 'Tenant' ? targetUser.adminName : (`${targetUser.firstName} ${targetUser.lastName}`.trim() || targetUser.email)
    });

    const userResponse = targetUser.toObject();
    delete userResponse.password;

    res.json({
      success: true,
      message: 'User updated successfully',
      data: userResponse
    });

  } catch (error) {
    console.error('❌ [userController.updateUser] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur: ' + (error.message || 'Unknown error')
    });
  }
};

// Delete a user
exports.deleteUser = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Permission refusée'
      });
    }

    const { userId } = req.params;
    const User = req.tenantConn.model('User');

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Empêcher la suppression de soi-même
    if (user._id.toString() === req.user.id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Vous ne pouvez pas supprimer votre propre compte'
      });
    }

    await user.deleteOne();

    // Log the activity
    await recordActivity(req, 'DELETE_USER', {
      type: 'User',
      id: user._id,
      name: `${user.firstName} ${user.lastName}`.trim() || user.email
    });

    res.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Erreur deleteUser:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Get tasks assigned to the user (Workflow + Kanban)
exports.getUserTasks = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User ID not found in token' });
    }

    if (!req.tenantConn) {
      console.error('❌ [getUserTasks] No tenant connection found in request');
      return res.status(500).json({ success: false, message: 'Tenant database connection missing' });
    }

    const User = req.tenantConn.model('User');
    const Role = req.tenantConn.model('Role');
    const WorkflowInstance = req.tenantConn.model('WorkflowInstance');
    const Task = req.tenantConn.model('Task');
    const Workflow = req.tenantConn.model('Workflow');

    const user = await User.findById(userId);
    const domain = (user?.domain || req.user.domain || '').trim();
    const userRoleStr = user?.role || req.user.role || 'user';
    const isAdmin = userRoleStr === 'admin' || userRoleStr === 'super_admin';

    const userRole = await Role.findOne({ name: { $regex: new RegExp(`^${userRoleStr}$`, 'i') } });
    const userRoleId = userRole?._id;
    const roleIdStr = userRoleId?.toString();

    const specificRoleStr = user?.specificRole || req.user.specificRole || '';
    const specificRoleIdStr = user?.specificRoleId?.toString() || req.user.specificRoleId?.toString() || '';

    // 0. Identity & Domains for visibility
    const matchingIds = [new mongoose.Types.ObjectId(userId)];
    if (roleIdStr && mongoose.Types.ObjectId.isValid(roleIdStr)) {
      matchingIds.push(new mongoose.Types.ObjectId(roleIdStr));
    }
    if (specificRoleIdStr && mongoose.Types.ObjectId.isValid(specificRoleIdStr)) {
      matchingIds.push(new mongoose.Types.ObjectId(specificRoleIdStr));
    }

    // CRITICAL: include current user ID as a potential "domain" (string match) 
    // because some assignments store User IDs as strings in domain fields.
    const domainsToMatch = Array.from(new Set([
      userId.toString(),
      domain, 
      'GLOBAL', 'ALL', 'PUBLIC', 'TOUS', 'EVERYONE'
    ])).filter(Boolean);

    if (domain) {
      const upDomain = domain.toUpperCase();
      if (upDomain === 'HR' || upDomain === 'RH') {
        domainsToMatch.push('RH', 'HR', 'rh', 'hr');
      }
    }

    if (specificRoleStr) {
      domainsToMatch.push(specificRoleStr, specificRoleStr.toUpperCase());
    }
    if (specificRoleIdStr) domainsToMatch.push(specificRoleIdStr);
    if (userRoleStr) domainsToMatch.push(userRoleStr, userRoleStr.toUpperCase());
    if (roleIdStr) domainsToMatch.push(roleIdStr);
    
    // Also include the NAME of the role if we found it
    if (userRole?.name) {
      const rName = userRole.name;
      domainsToMatch.push(rName, rName.toUpperCase(), rName.toLowerCase());
    }

    console.log(`🔍 [getUserTasks] User: ${user?.email} | ID: ${userId} | Matching IDs: [${matchingIds.join(', ')}] | Match Domains: ${domainsToMatch.join(', ')}`);

    // 1. KANBAN TASKS
    let kanbanQuery = { status: { $ne: 'done' } };
    
    if (!isAdmin) {
      kanbanQuery.$or = [
        { assignedTo: { $in: matchingIds } },
        { assignedDomain: { $in: domainsToMatch.map(d => new RegExp(`^${d}$`, 'i')) } }
      ];
    }

    let kanbanTasksRaw = await Task.find(kanbanQuery).populate({
      path: 'boardId',
      select: 'name workflowId'
    }).populate('createdBy', 'firstName lastName avatar email');
    
    const kanbanEnriched = kanbanTasksRaw.map(t => ({
      _id: t._id,
      title: t.title,
      workflowName: t.boardId?.name || 'General Board',
      projectName: t.boardId?.workflowId?.projectId?.name || 'Unassigned',
      instanceTitle: 'Direct Task',
      type: 'kanban',
      taskType: t.type === 'form' ? 'Formulaire' : 'Tâche',
      status: 'pending',
      priority: t.priority || 'medium',
      createdAt: t.createdAt,
      dueDate: t.dueDate,
      description: t.description
    }));

    // 2. WORKFLOW TASKS
    const systemNodeTypes = [
      'start', 'end', 'parallel', 'sync_join', 'exclusive', 'inclusive',
      'condition', 'timer', 'webhook', 'script', 'email', 'delay', 'parallelstart',
      'parallel_split', 'parallel_join', 'start_parallel'
    ];

    let pendingQuery = { status: { $in: ['in_progress', 'pending', 'active'] } };
    
    if (!isAdmin) {
      const domainRegexes = domainsToMatch.map(d => {
          if (mongoose.Types.ObjectId.isValid(d)) return d;
          return new RegExp(`^${d}$`, 'i');
      });
      
      pendingQuery.$or = [
        { 'currentNodes.responsibleDomain': { $in: domainRegexes } },
        { 'currentNodes.restrictedDomain': { $in: domainRegexes } },
        { 'currentNodes.responsibleUser': { $in: matchingIds } },
        { 'currentNodes.assignees': { $in: matchingIds } },
        { 'currentNodes.validatorApprovals': { $in: matchingIds } },
        { createdBy: new mongoose.Types.ObjectId(userId) },
        // Also look for instances where the user of this domain might be a validator
        { 'currentNodes.nodeId': { $exists: true } } // Broaden search so the loop can filter
      ];
      
      // If we have a lot of instances, the above catch-all might be slow, 
      // but for "not showing up" issues, it's better to be permissive and filter in code.
      console.log(`🔍 [getUserTasks] Final query for instances:`, JSON.stringify(pendingQuery, null, 2));
    }


    const activeInstances = await WorkflowInstance.find(pendingQuery).populate({
      path: 'workflowId',
      populate: { path: 'projectId', select: 'name' }
    });

    console.log(`📊 [getUserTasks] Found ${activeInstances.length} active instances for user.`);

    const workflowTasks = [];
    activeInstances.forEach(instance => {
      if (!instance.workflowId || typeof instance.workflowId !== 'object') return;

      const workflowData = instance.workflowId;
      const nodesData = workflowData.nodes || [];

      console.log(`📦 [getUserTasks] Processing instance: ${instance._id} | CurrentNodes: ${instance.currentNodes?.length || 0}`);
      
      instance.currentNodes.forEach((node, index) => {
        if (!['in_progress', 'pending'].includes(node.status)) return;

        // Try to find node in definition
        let nodeDef = nodesData.find(n => n.id === node.nodeId);
        
        // Resilience: if not found by exact ID, maybe the ID mapping shifted or it's a generic node
        if (!nodeDef) {
            console.warn(`⚠️ [getUserTasks] Node ${node.nodeId} not found in definition for instance ${instance._id}`);
            // Fallback: search by label or data.id if possible? Or just proceed with a dummy nodeDef if it has enough info
            nodeDef = { id: node.nodeId, type: 'action', data: { label: 'Étape en cours' } };
        }

        const nodeType = (nodeDef?.type || 'action').toLowerCase();
        
        // Manual verification nodes shouldn't be skipped even if they have "parallel" in name
        const isManualAction = ['action', 'form', 'formulaire', 'task', 'tache', 'upload', 'validation'].includes(nodeType);
        if (systemNodeTypes.includes(nodeType) && !isManualAction) return;

        // Task visibility calculation
            console.log(`🔎 [getUserTasks] Processing node: ${node.nodeId} for instance: ${instance._id} | Node Status: ${node.status}`);
            
            // Task visibility calculation
            const instCreatorId = instance.createdBy?.toString();
            const currentUserIdStr = userId.toString();
            let isVisible = isAdmin || instCreatorId === currentUserIdStr;
            
            console.log(`   - Visibility Initial (isAdmin/Creator): ${isVisible} | Creator: ${instCreatorId} | Me: ${currentUserIdStr}`);
            
            // Only perform assignee checks if not already visible (admins/creators see everything)
            if (!isVisible) {
              const instRespUser = node.responsibleUser?.toString();
              const isInstUserMatch = !!instRespUser && matchingIds.some(mid => mid.toString() === instRespUser);
              
              const isInstAssigneeMatch = node.assignees?.some(a => {
                  const aStr = a.toString();
                  return matchingIds.some(mid => mid.toString() === aStr);
              });

              const isInstDomainMatch = !!node.responsibleDomain && domainsToMatch.some(d => 
                  d && d.toLowerCase() === node.responsibleDomain.toLowerCase()
              );
              
              console.log(`   - Instance Match (User/Assignee/Domain): ${isInstUserMatch}/${isInstAssigneeMatch}/${isInstDomainMatch}`);

            // B. Try matching against LATEST WORKFLOW DEFINITION (Live update)
            const nodeData = nodeDef.data || {};
            const defAssignees = nodeData.assigneeIds || nodeData.validatorIds || [];
            const defDomain = nodeData.responsibleDomain || nodeData.domain;
            
            const isDefAssigneeMatch = defAssignees.some(a => {
                const aStr = a.toString();
                return matchingIds.some(mid => mid.toString() === aStr) || domainsToMatch.some(d => d.toLowerCase() === aStr.toLowerCase());
            });

            const isDefDomainMatch = !!defDomain && domainsToMatch.some(d => 
                d && d.toLowerCase() === defDomain.toLowerCase()
            );

            isVisible = isInstUserMatch || isInstAssigneeMatch || isInstDomainMatch || isDefAssigneeMatch || isDefDomainMatch;
          }

          // Force restricted domain check if it exists (ALWAYS apply restriction if present)
          const nodeRestricted = node.restrictedDomain || nodeDef.data?.restrictedDomain;
          if (nodeRestricted && isVisible) {
              const isGlobalRestriction = ['GLOBAL', 'ALL', 'PUBLIC', 'TOUS'].includes(nodeRestricted.toUpperCase());
              if (!isGlobalRestriction) {
                  const userDomainMatch = domainsToMatch.some(d => d && d.toLowerCase().trim() === nodeRestricted.toLowerCase().trim());
                  if (!userDomainMatch) {
                      // Creators and Admins should still bypass restriction usually 
                      if (!isAdmin && instCreatorId !== currentUserIdStr) isVisible = false;
                  }
              }
          }

        const hasApproved = node.approvedBy?.some(u => u.toString() === userId.toString());

        // 7. Final Visibility Decision
        if (isVisible) {
          
          // Identify if the current specific user has validator privileges for this node
          let isUserValidator = false;
          const vType = String(nodeDef.data?.validationType || '').toLowerCase();
          if (vType === 'simple' || vType === 'multi') {
              const validatorIds = nodeDef.data?.validatorIds || [];
              isUserValidator = validatorIds.includes(userId.toString()) || 
                               (nodeDef.data?.validatorType === 'role' && validatorIds.includes(userRoleStr)) ||
                               isAdmin;
          }

          // If worker has finished, only validators should see it in their pending list
          if (node.workerCompleted && !isUserValidator) {
              isVisible = false;
          }
        }

        if (isVisible) {
          // Add timestamp/index to ensure absolute uniqueness for parallel executions of same node
          const uniqueSuffix = node.startedAt ? new Date(node.startedAt).getTime() : index;
          const taskId = `${instance._id}_${node.nodeId}_${uniqueSuffix}`;
          
          // Check if we already added this logical task
          const exists = workflowTasks.some(t => t._id === taskId);
          
          if (!exists) {
            workflowTasks.push({
              _id: taskId,
              instanceId: instance._id,
              nodeId: node.nodeId,
              title: nodeDef.data?.label || nodeDef.type || 'Task',
              workflowName: workflowData.name || 'Workflow',
              instanceTitle: instance.title,
              projectName: workflowData.projectId?.name || 'No Project',
              type: 'workflow',
              taskType: (nodeDef.type === 'form' || !!nodeDef.data?.formId || !!nodeDef.data?.linkedObjectId) ? 'Formulaire' : 'Tâche',
              status: 'pending',
              priority: instance.priority || 'medium',
              createdAt: node.startedAt || instance.createdAt,
              dueDate: instance.dueDate || workflowData.dueDate,
              description: instance.description || workflowData.description || nodeDef.data?.description
            });
          }
        }
      });
    });

    // 3. HISTORY (Registry)
    const historyQuery = isAdmin ? {} : { 'executionPath.performedBy': new mongoose.Types.ObjectId(userId) };
    const completedInstances = await WorkflowInstance.find(historyQuery)
      .populate({ path: 'workflowId', populate: { path: 'projectId', select: 'name' } })
      .sort({ updatedAt: -1 })
      .limit(isAdmin ? 20 : 50);

    completedInstances.forEach(instance => {
      if (!instance.workflowId || typeof instance.workflowId !== 'object') return;
      const workflowData = instance.workflowId;
      const nodesData = workflowData.nodes || [];

      const actions = (instance.executionPath || []).filter(p => p.performedBy?.toString() === userId.toString());

      actions.forEach(action => {
        const nodeDef = nodesData.find(n => n.id === action.nodeId);
        if (!nodeDef || systemNodeTypes.includes((nodeDef.type || '').toLowerCase())) return;

        // Recursive search for next manual nodes (skip logic blocks)
        const isLogicNode = (type) => {
          if (!type) return false;
          const logicTypes = ['parallel_split', 'parallel_join', 'parallelstart', 'parallelStart', 'parallel_start', 'parallel', 'start', 'syncJoin', 'sync_join', 'condition', 'gateway', 'split', 'join'];
          return logicTypes.some(t => t.toLowerCase() === type.toLowerCase());
        };

        const getNextTaskNodes = (srcId, visited = new Set()) => {
          if (visited.has(srcId)) return [];
          visited.add(srcId);
          
          let tasks = [];
          const edges = (workflowData.edges || []).filter(e => e.source === srcId);
          for (const edge of edges) {
            const target = nodesData.find(n => n.id === edge.target);
            if (!target) continue;
            if (isLogicNode(target.type)) {
              tasks = [...tasks, ...getNextTaskNodes(target.id, visited)];
            } else {
              tasks.push(target.id);
            }
          }
          return tasks;
        };

        // A task is "editable" (meaning awaiting validation) if it's still in currentNodes and has workerCompleted = true
        const currentNodeEntry = instance.currentNodes.find(cn => cn.nodeId === action.nodeId);
        const isAwaitingValidation = currentNodeEntry && currentNodeEntry.workerCompleted;
        
        const nextExecutableIds = getNextTaskNodes(action.nodeId);
        const isActiveNext = instance.currentNodes.some(cn => nextExecutableIds.includes(cn.nodeId));
        
        // It is editable if it's awaiting validation OR if the next step is already active (to allow corrections before it's too late)
        const isEditable = (instance.status === 'in_progress' && (isAwaitingValidation || isActiveNext));

        workflowTasks.push({
          _id: `${instance._id}_${action.nodeId}_${new Date(action.timestamp).getTime()}`,
          instanceId: instance._id,
          nodeId: action.nodeId,
          title: nodeDef.data?.label || nodeDef.type || 'Done',
          workflowName: workflowData.name || 'Workflow',
          instanceTitle: instance.title,
          projectName: workflowData.projectId?.name || 'No Project',
          type: 'workflow',
          taskType: (nodeDef.type === 'form' || !!nodeDef.data?.formId) ? 'Formulaire' : 'Tâche',
          status: 'completed',
          isEditable, // New field
          priority: instance.priority || 'medium',
          createdAt: action.timestamp,
          dueDate: instance.dueDate || workflowData.dueDate,
          description: action.comments || 'Task completed'
        });
      });
    });

    const allTasks = [...kanbanEnriched, ...workflowTasks].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    res.json({ success: true, count: allTasks.length, data: allTasks });

  } catch (error) {
    console.error('❌ [getUserTasks] Critical Error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};
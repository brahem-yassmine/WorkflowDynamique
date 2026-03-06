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

    const { email, password, firstName, lastName, role, domain } = req.body;

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
      domain: domain || 'HR'
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

    // Field Mapping for Tenant (Owner) model: adminName vs firstName/lastName
    if (userModelName === 'Tenant') {
      if (updates.firstName || updates.lastName || updates.name) {
        const fName = updates.firstName || (updates.name ? updates.name.split(' ')[0] : (targetUser.adminName ? targetUser.adminName.split(' ')[0] : 'Admin'));
        const lName = updates.lastName || (updates.name ? updates.name.split(' ').slice(1).join(' ') : (targetUser.adminName ? targetUser.adminName.split(' ').slice(1).join(' ') : ''));
        updates.adminName = `${fName} ${lName}`.trim();
      }
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

    const User = req.tenantConn.model('User');
    const Role = req.tenantConn.model('Role');
    const WorkflowInstance = req.tenantConn.model('WorkflowInstance');
    const Workflow = req.tenantConn.model('Workflow');
    const Project = req.tenantConn.model('Project');
    const Task = req.tenantConn.model('Task');
    const Board = req.tenantConn.model('Board');

    const user = await User.findById(userId);
    const domain = user?.domain || req.user.domain;

    // Find user's role object to handle role-based assignments
    const userRole = user ? await Role.findOne({ name: user.role }) : null;
    const userRoleId = userRole?._id;

    console.log(`🔍 [getUserTasks] User: ${userId} | Domain: ${domain} | Role: ${user?.role} (${userRoleId})`);

    // 1. KANBAN TASKS (Direct assignments)
    const kanbanTasksRaw = await Task.find({
      $or: [
        { assignedTo: userId },
        { assignedDomain: domain }
      ],
      status: { $ne: 'done' }
    }).populate({
      path: 'boardId',
      populate: { path: 'projectId', select: 'name' }
    });

    const kanbanEnriched = kanbanTasksRaw.map(t => ({
      _id: t._id,
      title: t.title,
      workflowName: t.boardId?.name || 'General Board',
      projectName: t.boardId?.projectId?.name || 'Unassigned',
      instanceTitle: 'Direct Task',
      type: 'kanban',
      taskType: t.type === 'form' ? 'Formulaire' : 'Tâche',
      priority: 'medium',
      createdAt: t.createdAt,
      dueDate: t.dueDate,
      description: t.description
    }));

    // 2. WORKFLOW TASKS
    const userObjId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : null;
    const roleIdStr = userRoleId?.toString();
    const roleObjId = roleIdStr && mongoose.Types.ObjectId.isValid(roleIdStr) ? new mongoose.Types.ObjectId(roleIdStr) : null;

    // Define domains to match (handling HR/RH synonymity)
    const domainsToMatch = [domain];
    if (domain === 'HR' || domain === 'RH') {
      domainsToMatch.push(domain === 'HR' ? 'RH' : 'HR');
    }

    const query = {
      status: 'in_progress',
      $or: [
        { 'currentNodes.responsibleUser': userId },
        { 'currentNodes.assignees': userId },
        { 'currentNodes.responsibleDomain': { $in: domainsToMatch } }
      ]
    };

    // Add ObjectId matches for robust Mongoose querying
    if (userObjId) {
      query.$or.push({ 'currentNodes.responsibleUser': userObjId });
      query.$or.push({ 'currentNodes.assignees': userObjId });
    }
    if (roleObjId) {
      query.$or.push({ 'currentNodes.assignees': roleObjId });
      query.$or.push({ 'currentNodes.assignees': roleIdStr });
    }

    const workflowInstances = await WorkflowInstance.find(query).populate({
      path: 'workflowId',
      populate: {
        path: 'projectId',
        select: 'name'
      }
    });

    console.log(`📊 [getUserTasks] Found ${workflowInstances.length} instances in total for query`);

    const workflowTasks = [];
    workflowInstances.forEach(instance => {
      if (!instance.workflowId) return;

      instance.currentNodes.forEach(node => {
        const isAssigned =
          node.responsibleUser?.toString() === userId.toString() ||
          node.assignees?.some(a => a.toString() === userId.toString()) ||
          domainsToMatch.includes(node.responsibleDomain) ||
          (roleIdStr && node.assignees?.some(a => a.toString() === roleIdStr));

        if (isAssigned && node.status === 'in_progress') {
          const nodeDef = instance.workflowId.nodes.find(n => n.id === node.nodeId);
          const nodeLabel = nodeDef?.data?.label || nodeDef?.type || 'Validation Task';
          const nodeType = nodeDef?.type || 'action';
          const isForm = nodeType === 'form' || !!nodeDef?.data?.formId;

          workflowTasks.push({
            _id: `${instance._id}_${node.nodeId}`,
            instanceId: instance._id,
            nodeId: node.nodeId,
            title: nodeLabel,
            workflowName: instance.workflowId.name,
            instanceTitle: instance.title,
            projectName: instance.workflowId.projectId?.name || 'No Project',
            type: 'workflow',
            taskType: isForm ? 'Formulaire' : 'Tâche',
            priority: instance.priority || 'medium',
            createdAt: node.startedAt || instance.createdAt,
            dueDate: instance.dueDate || instance.workflowId.dueDate,
            description: instance.description || instance.workflowId.description
          });
        }
      });
    });

    // Merge and sort
    const allTasks = [...kanbanEnriched, ...workflowTasks].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    console.log(`✅ [getUserTasks] Returning ${allTasks.length} tasks total`);

    res.json({
      success: true,
      data: allTasks
    });

  } catch (error) {
    console.error('❌ [getUserTasks] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
};

// back/src/controllers/userController.js
const bcrypt = require('bcryptjs');
const { recordActivity } = require('../services/auditLogger');


// ✅ No more User import (via req.tenantConn)


// List company users
exports.getUsers = async (req, res) => {
  try {
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
      domain: domain || 'HR',
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
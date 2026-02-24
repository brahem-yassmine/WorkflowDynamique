// back/src/controllers/userController.js
const bcrypt = require('bcryptjs');


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
    console.error('getUsers Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Create a new user
exports.createUser = async (req, res) => {
  console.log('👤 userController.createUser - Body:', req.body);
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      console.warn('🚫 Permission denied for role:', req.user.role);
      return res.status(403).json({
        success: false,
        message: 'Permission denied'
      });
    }

    const { email, password, firstName, lastName, role, domain } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password required'
      });
    }

    const User = req.tenantConn.model('User');

    // Check if user already exists in this tenant
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      console.warn('⚠️ User already exists:', email);
      return res.status(400).json({
        success: false,
        message: 'This user already exists'
      });
    }

    console.log('🔐 Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      email,
      password: hashedPassword,
      firstName: firstName || '',
      lastName: lastName || '',
      role: role || 'user',
      domain: domain || 'HR'
    });

    console.log('💾 Saving user...');
    await user.save();
    console.log('✅ User created:', email);

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: userResponse
    });

  } catch (error) {
    console.error('❌ createUser Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
};

// Update a user
exports.updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;

    const User = req.tenantConn.model('User');

    // Check permissions
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (req.user.role !== 'admin' && req.user.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied'
      });
    }

    // Do not allow non-admin to change role

    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    Object.assign(targetUser, updates);
    await targetUser.save();

    const userResponse = targetUser.toObject();
    delete userResponse.password;

    res.json({
      success: true,
      message: 'User updated',
      data: userResponse
    });

  } catch (error) {
    console.error('updateUser Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Delete a user
exports.deleteUser = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Permission denied'
      });
    }

    const { userId } = req.params;
    const User = req.tenantConn.model('User');

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent self-deletion
    if (user._id.toString() === req.user.userId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }

    await user.deleteOne();

    res.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('deleteUser Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
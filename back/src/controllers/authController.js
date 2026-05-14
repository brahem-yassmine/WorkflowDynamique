// back/src/controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const mongoose = require('mongoose');
const { recordActivity } = require('../services/auditLogger');
const crypto = require('crypto');
const { sendResetPasswordEmail } = require('../services/mailService');
const LogService = require('../services/logService');
const { resolveDependencies, normalizePermission } = require('../utils/permission.utils');


// Helper to get models from a specific connection
const getModel = (conn, modelName, factoryPath) => {
  if (conn.models[modelName]) return conn.models[modelName];
  return require(factoryPath)(conn);
};

// ====================================
// MASTER MODELS
// ====================================
const getTenantModel = (req) => getModel(req.masterDb, 'Tenant', '../models/master/Tenant');
const getPlanModel = (req) => getModel(req.masterDb, 'Plan', '../models/master/Plan');
const getSuperAdminModel = (req) => getModel(req.masterDb, 'SuperAdmin', '../models/master/SuperAdmin');
const getRoleModel = (conn) => getModel(conn, 'Role', '../models/tenant/role.model');
const getSubscriptionModel = (conn) => getModel(conn, 'Subscription', '../models/tenant/Subscription');

// FUNCTION TO CREATE TENANT DATABASE
// ====================================
const createTenantDatabase = async (tenantId, dbName, plan, adminEmail, hashedPassword, paymentDetails = null, startDate = null) => {
  try {
    console.log(`🚀 createTenantDatabase started for ${dbName}`, {
      plan: plan?.name,
      startDate
    });

    const dbUri = `mongodb://localhost:27017/${dbName}`;
    const tenantConn = mongoose.createConnection(dbUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    await new Promise((resolve, reject) => {
      tenantConn.once('connected', resolve);
      tenantConn.once('error', reject);
      setTimeout(() => reject(new Error('Database connection timeout')), 10000);
    });

    // Load models for tenant
    const User = require('../models/tenant/User')(tenantConn);
    const Subscription = require('../models/tenant/Subscription')(tenantConn);

    // Create admin
    const adminUser = new User({
      email: adminEmail,
      password: hashedPassword,
      firstName: 'Admin',
      lastName: '',
      role: 'admin',
      tenantId: tenantId.toString()
    });

    await adminUser.save();
    console.log('✅ Admin created in tenant database');

    // Create subscription if plan is provided
    let subscription = null;
    if (plan) {
      const start = startDate ? new Date(startDate) : new Date();
      const planCode = (plan.code || '').toLowerCase();
      // Demo/Lattice = 7 days, others 15 days
      const trialDays = (planCode.includes('demo') || planCode.includes('lattice')) ? 7 : 15;

      const trialEndDate = new Date(start.getTime() + trialDays * 24 * 60 * 60 * 1000);

      console.log(`📋 Creating subscription for ${plan.name}`, {
        start,
        trialEndDate,
        trialDays
      });

      subscription = new Subscription({
        planId: plan._id.toString(),
        planName: plan.name,
        planCode: plan.code,
        price: plan.price,
        status: 'trial',
        selectedBy: adminUser._id,
        trialStartDate: start,
        trialEndDate: trialEndDate,
        currentPeriodStart: start,
        currentPeriodEnd: trialEndDate,
        paymentInfo: paymentDetails
      });

      await subscription.save();
      console.log('✅ Subscription created successfully');

      // Update admin user to reflect plan selection if it was done at signup
      adminUser.hasSelectedPlan = true;
      adminUser.selectedPlan = plan.name;
      await adminUser.save();
    }

    await tenantConn.close();
    return { adminUser, subscription };

  } catch (error) {
    console.error('❌ Tenant database creation error:', error);
    throw error;
  }
};

// ====================================
// LOGIN
// ====================================
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const logService = new LogService(req.masterDb);

    console.log('🔑 Login attempt:', email);

    if (!email || !password) {
      console.warn('⚠️ Login failed: Missing email or password');
      return res.status(400).json({
        success: false,
        message: 'Email and password required'
      });
    }

    console.log(`🔐 [Login] Processing credentials for: ${email}`);

    // 1. Search in super_admin first
    const SuperAdmin = getSuperAdminModel(req);
    let user = await SuperAdmin.findOne({ email: email.toLowerCase() });
    let role = 'super_admin';
    let tenantId = null;

    // SECURITY CHECK: Only axia@gmail.com can be Super Admin
    if (user && email.toLowerCase() !== 'axia@gmail.com') {
      console.warn(`🛑 Unauthorized Super Admin login attempt: ${email}`);
      await logService.logLoginFailed(email, req, 'Unauthorized Super Admin access attempt');
      user = null; // Important: Clear user so it fallbacks to admin/user search
    }

    // 2. If not found (or unauthorized above), search in tenants (Owners/Admins)
    if (!user) {
      const TenantModel = getTenantModel(req);
      user = await TenantModel.findOne({ email: email.toLowerCase() });
      if (user) {
        role = 'admin';
        tenantId = user._id.toString();
      }
    }

    // 3. If still not found, search in ALL tenant databases (Users/Agents)
    if (!user) {
      console.log('🔍 Searching user in tenant databases...');
      const TenantModel = getTenantModel(req);
      const allTenants = await TenantModel.find({ status: 'active' });

      for (const t of allTenants) {
        try {
          const conn = mongoose.createConnection(t.databaseUri);
          const TenantUser = require('../models/tenant/User')(conn);
          const foundUser = await TenantUser.findOne({ email: email.toLowerCase() });

          if (foundUser) {
            user = foundUser;
            role = foundUser.role || 'user';
            tenantId = t._id.toString();
            await conn.close();
            break;
          }
          await conn.close();
        } catch (connErr) {
          console.error(`❌ Error searching in tenant ${t.name}:`, connErr.message);
        }
      }
    }

    if (!user) {
      console.warn(`🛑 [Login] Identity not found: ${email}`);
      await logService.logLoginFailed(email, req, 'Incorrect email or password');
      return res.status(401).json({
        success: false,
        message: 'Incorrect email or password'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      console.warn(`🛑 [Login] Invalid password for: ${email}`);
      await logService.logLoginFailed(email, req, 'Incorrect email or password');
      return res.status(401).json({
        success: false,
        message: 'Incorrect email or password'
      });
    }

    // Fetch permissions
    let permissions = [];
    const normalizedRole = (role || '').toLowerCase();

    if (normalizedRole === 'super_admin' || normalizedRole === 'admin') {
      permissions = ['all'];
      console.log(`👑 [Auth] Full access granted to ${normalizedRole}: ${email}`);
    } else if (tenantId) {
      try {
        const TenantModel = getTenantModel(req);
        const tenant = await TenantModel.findById(tenantId);
        if (tenant) {
          const conn = mongoose.createConnection(tenant.databaseUri);
          const Role = getRoleModel(conn);
          
          let userRole = null;
          if (user.specificRoleId) {
            userRole = await Role.findById(user.specificRoleId);
          }
          
          if (!userRole) {
            userRole = await Role.findOne({ 
              name: { $regex: new RegExp(`^${role}$`, 'i') } 
            });
          }

          if (userRole) {
            // ✅ RESOLVE & NORMALIZE
            permissions = resolveDependencies(userRole.permissions || []).map(normalizePermission);
          }
          await conn.close();
        }
      } catch (err) {
        console.error('Error fetching role permissions:', err.message);
      }
    }

    const tokenVersion = user.tokenVersion || 1;

    const token = jwt.sign(
      {
        id: user._id,
        userId: user._id,
        email: user.email,
        name: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : (user.name || user.username),
        role: role,
        tenantId: tenantId,
        domain: user.domain || 'HR',
        specificRole: user.specificRole || '',
        specificRoleId: user.specificRoleId || null,
        permissions: permissions,
        tokenVersion: tokenVersion
      },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '10h' }
    );

    const refreshToken = jwt.sign(
      { id: user._id, role, tenantId, type: 'refresh', tokenVersion },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '7d' }
    );

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 jours
    });

    // Record Success Login in Master DB
    await logService.logLoginSuccess({
      _id: user._id,
      email: user.email,
      role: role,
      firstName: user.firstName || user.name || (role === 'admin' ? user.name : 'User'),
      lastName: user.lastName || ''
    }, req);

    // 4. Record Activity & Check Subscription (if not super_admin)
    let subscriptionExpired = false;
    let daysLeft = 0;
    let currentPlan = null;

    if (role !== 'super_admin' && tenantId) {
      try {
        const { getTenantConnection } = require('../services/tenantConnection');
        const TenantModel = getTenantModel(req);
        const tenant = await TenantModel.findById(tenantId);

        if (tenant) {
          const tenantConn = await getTenantConnection(tenant.domain, tenant.databaseName);
          const Subscription = getSubscriptionModel(tenantConn);

          const sub = await Subscription.findOne().sort({ createdAt: -1 });

          if (sub) {
            currentPlan = sub.planName;
            let endDate = sub.currentPeriodEnd || sub.trialEndDate;

            if (req.body.debugStartDate) {
              const debugStart = new Date(req.body.debugStartDate);
              if (!isNaN(debugStart.getTime())) {
                const planCode = (sub.planCode || '').toLowerCase();
                const duration = (planCode.includes('demo') || planCode.includes('lattice')) ? 7 : 15;
                endDate = new Date(debugStart.getTime() + duration * 24 * 60 * 60 * 1000);
              }
            }

            const now = new Date();
            subscriptionExpired = now > endDate;
            daysLeft = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));

            const warningSoon = !subscriptionExpired && daysLeft <= 3;

            const mockReq = {
              tenantConn,
              user: {
                id: user._id,
                email: user.email,
                name: user.name || user.firstName || (role === 'admin' ? user.name : 'User'),
                role: role
              },
              ip: req.ip || req.connection.remoteAddress
            };

            await recordActivity(mockReq, 'SIGN_IN', {
              type: 'Session',
              id: user._id,
              name: 'User Login'
            });

            return res.json({
              success: true,
              data: {
                token,
                user: {
                  id: user._id,
                  _id: user._id,
                  email: user.email,
                  name: user.name || user.firstName,
                  role: role,
                  tenantId,
                  domain: user.domain,
                  currentPlan,
                  permissions: permissions.length > 0 ? permissions : []
                },
                tenantId: tenantId
              }
            });
          }
        }
      } catch (logErr) {
        console.error('❌ Failed to check subscription/log SIGN_IN:', logErr.message);
      }
    }

    res.json({
      success: true,
      data: {
        token,
        user: {
          _id: user._id,
          email: user.email,
          role: role,
          name: user.name || user.firstName || (role === 'admin' ? user.name : 'Admin'),
          hasSelectedPlan: user.hasSelectedPlan ?? (role === 'super_admin' ? true : false),
          tenantId: tenantId,
          domain: user.domain || 'HR',
          subscriptionExpired,
          daysLeft,
          currentPlan,
          permissions: permissions.length > 0 ? permissions : []
        },
        tenantId: tenantId
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
};

// REGISTER NEW TENANT
// ====================================
const registerTenant = async (req, res) => {
  try {
    const {
      companyName,
      adminEmail,
      password,
      planId,
      industry,
      startDate,
      paymentDetails
    } = req.body;

    console.log('📝 Incoming Tenant Registration Request:', {
      companyName,
      adminEmail,
      planId,
      industry,
      startDate,
      hasPassword: !!password,
      hasPayment: !!paymentDetails
    });

    if (!companyName || !adminEmail || !password || !planId || !industry) {
      console.warn('⚠️ Missing required fields in registration request');
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    const Tenant = getTenantModel(req);
    const Plan = getPlanModel(req);

    const existingTenant = await Tenant.findOne({ email: adminEmail.toLowerCase() });
    if (existingTenant) {
      return res.status(400).json({
        success: false,
        message: 'This email is already registered'
      });
    }

    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Selected plan not found'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const timestamp = Date.now();
    const safeCompanyName = companyName.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
    const dbName = `tenant_${safeCompanyName}_${timestamp}`;
    const dbUri = `mongodb://localhost:27017/${dbName}`;

    const tenant = new Tenant({
      name: companyName.trim(),
      email: adminEmail.toLowerCase().trim(),
      password: hashedPassword,
      domain: `${safeCompanyName}_${timestamp}.axia-workflow.com`,
      status: 'active',
      industry: industry || 'Other',
      adminName: adminEmail.split('@')[0],
      selectedPlan: plan ? plan._id : null,
      databaseName: dbName,
      databaseUri: dbUri
    });

    await tenant.save();
    console.log('✅ Tenant record created in master database');

    try {
      console.log('🚀 Initiating tenant database creation...');
      await createTenantDatabase(tenant._id, dbName, plan, adminEmail, hashedPassword, paymentDetails, startDate);
      console.log('✅ Tenant database and admin user created successfully');
    } catch (dbError) {
      console.error('❌ Database initialization failed. Rolling back tenant record.');
      await Tenant.findByIdAndDelete(tenant._id);
      return res.status(500).json({
        success: false,
        message: 'Database initialization failed: ' + dbError.message
      });
    }

    const tokenVersion = tenant.tokenVersion || 1;

    const token = jwt.sign(
      {
        id: tenant._id,
        userId: tenant._id,
        email: tenant.email,
        role: 'admin',
        tenantId: tenant._id.toString(),
        tokenVersion
      },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '10h' }
    );

    const refreshToken = jwt.sign(
      { id: tenant._id, role: 'admin', tenantId: tenant._id.toString(), type: 'refresh', tokenVersion },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '7d' }
    );

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 jours
    });

    res.status(201).json({
      success: true,
      message: 'Company created successfully',
      data: {
        token,
        user: {
          _id: tenant._id,
          email: tenant.email,
          role: 'admin',
          name: companyName,
          tenantId: tenant._id.toString()
        },
        tenant: {
          _id: tenant._id,
          name: tenant.name,
          databaseName: tenant.databaseName
        }
      }
    });

  } catch (error) {
    console.error('❌ registerTenant Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Registration failed'
    });
  }
};

// ====================================
// REGISTER SUPER ADMIN
// ====================================
const registerSuperAdmin = async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // STRICT SECURITY: Only axia@gmail.com can be registered as Super Admin
    if (email.toLowerCase() !== 'axia@gmail.com') {
      return res.status(403).json({
        success: false,
        message: 'Registration of other Super Admin accounts is strictly forbidden.'
      });
    }

    const SuperAdmin = getSuperAdminModel(req);

    const existingUser = await SuperAdmin.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Super Admin already exists.'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new SuperAdmin({
      email: email.toLowerCase(),
      password: hashedPassword,
      firstName: firstName || 'Axia',
      lastName: lastName || 'Solutions',
      role: 'super_admin'
    });

    await newUser.save();

    res.json({
      success: true,
      message: 'Super admin created successfully'
    });

  } catch (error) {
    console.error('❌ registerSuperAdmin Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// ====================================
// FORGOT PASSWORD
// ====================================
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email required' });

    console.log('🔍 Forgot password request for:', email);

    const SuperAdmin = getSuperAdminModel(req);
    const TenantModel = getTenantModel(req);

    let user = await SuperAdmin.findOne({ email: email.toLowerCase() });
    let modelType = 'SuperAdmin';
    let targetTenantId = null;

    if (!user) {
      user = await TenantModel.findOne({ email: email.toLowerCase() });
      if (user) {
        modelType = 'Tenant';
      }
    }

    if (!user) {
      const allTenants = await TenantModel.find({ status: 'active' });
      for (const t of allTenants) {
        try {
          const conn = mongoose.createConnection(t.databaseUri);
          const TenantUser = require('../models/tenant/User')(conn);
          const foundUser = await TenantUser.findOne({ email: email.toLowerCase() });
          if (foundUser) {
            user = foundUser;
            modelType = 'User';
            targetTenantId = t._id.toString();
            await conn.close();
            break;
          }
          await conn.close();
        } catch (err) { }
      }
    }

    if (!user) {
      return res.json({ success: true, message: 'Si un compte existe, un email a été envoyé.' });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000;

    if (modelType === 'User') {
      const tenant = await TenantModel.findById(targetTenantId);
      const conn = mongoose.createConnection(tenant.databaseUri);
      const TenantUser = require('../models/tenant/User')(conn);
      await TenantUser.findByIdAndUpdate(user._id, {
        resetPasswordToken: user.resetPasswordToken,
        resetPasswordExpires: user.resetPasswordExpires
      });
      await conn.close();
    } else {
      await user.save();
    }

    const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`;
    await sendResetPasswordEmail(email, resetLink);

    res.json({ success: true, message: 'Email de réinitialisation envoyé.' });

  } catch (error) {
    console.error('❌ forgotPassword Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ====================================
// RESET PASSWORD
// ====================================
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ success: false, message: 'Token and password required' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const SuperAdmin = getSuperAdminModel(req);
    const TenantModel = getTenantModel(req);

    let user = await SuperAdmin.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      user = await TenantModel.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() }
      });
    }

    if (!user) {
      const allTenants = await TenantModel.find({ status: 'active' });
      for (const t of allTenants) {
        try {
          const conn = mongoose.createConnection(t.databaseUri);
          const TenantUser = require('../models/tenant/User')(conn);
          const foundUser = await TenantUser.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
          });
          if (foundUser) {
            await TenantUser.findByIdAndUpdate(foundUser._id, {
              password: hashedPassword,
              resetPasswordToken: undefined,
              resetPasswordExpires: undefined
            });
            await conn.close();
            return res.json({ success: true, message: 'Mot de passe réinitialisé avec succès.' });
          }
          await conn.close();
        } catch (err) { }
      }
    }

    if (!user) {
      return res.status(400).json({ success: false, message: 'Token invalide ou expiré.' });
    }

    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ success: true, message: 'Mot de passe réinitialisé avec succès.' });

  } catch (error) {
    console.error('❌ resetPassword Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ====================================
// GET PROFILE
// ====================================
const getProfile = async (req, res) => {
  try {
    const { id, role, tenantId } = req.user;
    const normalizedRole = (role || '').toLowerCase();
    let user = null;
    let permissions = [];

    // 1. Fetch User Data & Establish Connection if needed
    if (normalizedRole === 'super_admin') {
      const SuperAdmin = getSuperAdminModel(req);
      user = await SuperAdmin.findById(id).select('-password');
      
      // Auto-repair for "Super" name to "Axia"
      if (user && user.firstName === 'Super') {
        user.firstName = 'Axia';
        user.lastName = 'Solutions';
        await user.save();
      }
      
      permissions = ['all'];
    } else if (tenantId) {
      const TenantModel = getTenantModel(req);
      const tenant = await TenantModel.findById(tenantId);
      
      if (tenant) {
        const conn = mongoose.createConnection(tenant.databaseUri);
        
        try {
          if (normalizedRole === 'admin') {
            user = await TenantModel.findById(id).select('-password');
            permissions = ['all'];
          } else {
            const TenantUser = require('../models/tenant/User')(conn);
            const Role = getRoleModel(conn);
            
            user = await TenantUser.findById(id).select('-password');
            
            if (user) {
              let userRoleNode = null;
              if (user.specificRoleId) {
                userRoleNode = await Role.findById(user.specificRoleId);
              }
              
              if (!userRoleNode) {
                userRoleNode = await Role.findOne({ 
                  name: { $regex: new RegExp(`^${role}$`, 'i') } 
                });
              }

              if (userRoleNode) {
                // ✅ RESOLVE & NORMALIZE
                permissions = resolveDependencies(userRoleNode.permissions || []).map(normalizePermission);
              }
            }
          }
        } finally {
          await conn.close();
        }
      }
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'User profile not found' });
    }

    res.json({
      success: true,
      data: {
        ...user.toObject(),
        role: role,
        tenantId: tenantId,
        permissions: permissions.length > 0 ? permissions : []
      }
    });

  } catch (error) {
    console.error('❌ getProfile error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

module.exports = {
  login,
  registerTenant,
  registerSuperAdmin,
  forgotPassword,
  resetPassword,
  getProfile,
  googleLogin: async (req, res) => {
    try {
      const { idToken } = req.body;
      const logService = new LogService(req.masterDb);

      if (!idToken) {
        return res.status(400).json({ success: false, message: 'Google ID Token required' });
      }

      // 1. Verify Google Token
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID
      });
      const payload = ticket.getPayload();
      const email = payload.email.toLowerCase();
      const name = payload.name;

      console.log('🌐 Google Login attempt:', email);

      // 2. Search hierarchy (Replicating login logic)
      
      // Tier 1: Super Admin
      const SuperAdmin = getSuperAdminModel(req);
      let user = await SuperAdmin.findOne({ email });
      let role = 'super_admin';
      let tenantId = null;

      // Tier 2: Tenant Owner
      if (!user) {
        const TenantModel = getTenantModel(req);
        user = await TenantModel.findOne({ email });
        if (user) {
          role = 'admin';
          tenantId = user._id.toString();
        }
      }

      // Tier 3: Tenant User (across all active databases)
      if (!user) {
        const TenantModel = getTenantModel(req);
        const allTenants = await TenantModel.find({ status: 'active' });

        for (const t of allTenants) {
          try {
            const conn = mongoose.createConnection(t.databaseUri);
            const TenantUser = require('../models/tenant/User')(conn);
            const foundUser = await TenantUser.findOne({ email });

            if (foundUser) {
              user = foundUser;
              role = foundUser.role || 'user';
              tenantId = t._id.toString();
              await conn.close();
              break;
            }
            await conn.close();
          } catch (connErr) {
            console.error(`❌ Google Search in tenant ${t.name} failed`);
          }
        }
      }

      if (!user) {
        return res.status(404).json({
          success: false,
          userNotFound: true,
          message: 'No account found with this Google email. Please register first.'
        });
      }

      // 3. Fetch Matrix Permissions
      let permissions = [];
      const normalizedRole = (role || '').toLowerCase();

      if (normalizedRole === 'super_admin' || normalizedRole === 'admin') {
        permissions = ['all'];
        console.log(`👑 [Auth-Google] Full access granted to ${normalizedRole}: ${email}`);
      } else if (tenantId) {
        try {
          const TenantModel = getTenantModel(req);
          const tenant = await TenantModel.findById(tenantId);
          if (tenant) {
            const conn = mongoose.createConnection(tenant.databaseUri);
            const Role = getRoleModel(conn);
            
            let userRole = null;
            if (user.specificRoleId) {
              userRole = await Role.findById(user.specificRoleId);
            }
            if (!userRole) {
              userRole = await Role.findOne({ 
                name: { $regex: new RegExp(`^${role}$`, 'i') } 
              });
            }

            if (userRole) {
              // ✅ RESOLVE & NORMALIZE
              permissions = resolveDependencies(userRole.permissions || []).map(normalizePermission);
            }
            await conn.close();
          }
        } catch (err) {
          console.error('Google login permission fetch error:', err.message);
        }
      }

      // 4. Generate Token
      const tokenVersion = user.tokenVersion || 1;

      const token = jwt.sign(
        {
          id: user._id,
          userId: user._id,
          email: user.email,
          name: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : (user.name || user.firstName),
          role: role,
          tenantId: tenantId,
          domain: user.domain || 'HR',
          specificRole: user.specificRole || '',
          specificRoleId: user.specificRoleId || null,
          permissions: permissions.length > 0 ? permissions : [],
          tokenVersion: tokenVersion
        },
        process.env.JWT_SECRET || 'your_jwt_secret',
        { expiresIn: '10h' }
      );

      const refreshToken = jwt.sign(
        { id: user._id, role, tenantId, type: 'refresh', tokenVersion: tokenVersion },
        process.env.JWT_SECRET || 'your_jwt_secret',
        { expiresIn: '7d' }
      );

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 jours
      });

      // Success Response (Simplified compared to local login, but providing necessary data)
      res.json({
        success: true,
        data: {
          token,
          user: {
            _id: user._id,
            email: user.email,
            role: role,
            name: user.name || user.firstName,
            tenantId,
            hasSelectedPlan: user.hasSelectedPlan ?? true
          }
        }
      });

    } catch (error) {
      console.error('❌ Google Login Controller Error:', error);
      res.status(500).json({ success: false, message: 'Google Authentication failed: ' + error.message });
    }
  },

  refreshToken: async (req, res) => {
    try {
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
      if (!refreshToken) {
        return res.status(401).json({ success: false, message: 'Refresh token manquant' });
      }

      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET || 'your_jwt_secret');
      if (decoded.type !== 'refresh') {
        return res.status(401).json({ success: false, message: 'Token invalide' });
      }

      const { id, role, tenantId, tokenVersion } = decoded;
      let user = null;

      if (role === 'super_admin') {
        const SuperAdmin = getSuperAdminModel(req);
        user = await SuperAdmin.findById(id);
      } else if (role === 'admin' && !tenantId) {
        // Technically admin has tenantId, but their user doc is in the Master Tenant table
        const TenantModel = getTenantModel(req);
        user = await TenantModel.findById(id);
      } else if (tenantId) {
        if (role === 'admin') {
           const TenantModel = getTenantModel(req);
           user = await TenantModel.findById(tenantId);
        } else {
           const TenantModel = getTenantModel(req);
           const tenant = await TenantModel.findById(tenantId);
           if (tenant) {
             const conn = mongoose.createConnection(tenant.databaseUri);
             const TenantUser = require('../models/tenant/User')(conn);
             user = await TenantUser.findById(id);
             await conn.close();
           }
        }
      }

      if (!user || user.status === 'inactive' || user.isActive === false || user.status === 'suspended') {
        return res.status(401).json({ success: false, message: 'Utilisateur introuvable ou inactif' });
      }

      // Check tokenVersion
      const currentUserTokenVersion = user.tokenVersion || 1;
      if (tokenVersion !== currentUserTokenVersion) {
        return res.status(401).json({ success: false, message: 'Session expirée suite à la mise à jour des accès' });
      }

      // Re-fetch Matrix Permissions
      let permissions = [];
      if (role === 'super_admin') {
        permissions = ['all'];
      } else if (tenantId) {
        try {
          const TenantModel = getTenantModel(req);
          const tenant = await TenantModel.findById(tenantId);
          if (tenant) {
            const conn = mongoose.createConnection(tenant.databaseUri);
            const Role = getRoleModel(conn);
            let userRole = null;
            if (user.specificRoleId) userRole = await Role.findById(user.specificRoleId);
            if (!userRole) {
              userRole = await Role.findOne({ 
                name: { $regex: new RegExp(`^${role}$`, 'i') } 
              });
            }

            if (userRole) {
              // ✅ RESOLVE & NORMALIZE
              permissions = resolveDependencies(userRole.permissions || []).map(normalizePermission);
            }
            await conn.close();
          }
        } catch (err) {}
      }

      // Sign New Access Token
      const token = jwt.sign(
        {
          id: user._id,
          userId: user._id,
          email: user.email,
          name: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : (user.name || user.username),
          role: role,
          tenantId: tenantId,
          domain: user.domain || 'HR',
          specificRole: user.specificRole || '',
          specificRoleId: user.specificRoleId || null,
          permissions: permissions,
          tokenVersion: currentUserTokenVersion
        },
        process.env.JWT_SECRET || 'your_jwt_secret',
        { expiresIn: '10h' }
      );

      res.json({
        success: true,
        data: { token }
      });

    } catch (error) {
      res.status(401).json({ success: false, message: 'Token invalide ou expiré' });
    }
  }
};

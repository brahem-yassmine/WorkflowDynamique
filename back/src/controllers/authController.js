// back/src/controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { recordActivity } = require('../services/auditLogger');

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
const getRoleModel = (conn) => getModel(conn, 'Role', '../models/master/Role');
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
        currentPeriodStart: start, // for frontend compatibility
        currentPeriodEnd: trialEndDate, // for frontend compatibility
        paymentInfo: paymentDetails
      });

      await subscription.save();
      console.log(' Subscription created successfully');
<<<<<<< HEAD
=======

>>>>>>> e6314a902f52656002db49b7c9c2223bf17d346f
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

    console.log('🔑 Login attempt:', email);

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password required'
      });
    }

    // 1. Search in super_admin first
    const SuperAdmin = getSuperAdminModel(req);
    let user = await SuperAdmin.findOne({ email: email.toLowerCase() });
    let role = 'super_admin';
    let tenantId = null;

    // 2. If not found, search in tenants (Owners/Admins)
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
      return res.status(401).json({
        success: false,
        message: 'Incorrect email or password'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect email or password'
      });
    }

    // Fetch permissions
    let permissions = [];
    if (tenantId && role !== 'super_admin') {
      try {
        const TenantModel = getTenantModel(req);
        const tenant = await TenantModel.findById(tenantId);
        if (tenant) {
          const conn = mongoose.createConnection(tenant.databaseUri);
          const Role = getRoleModel(conn);
          const userRole = await Role.findOne({ name: role });
          if (userRole) {
            permissions = userRole.permissions || [];
          }
          await conn.close();
        }
      } catch (err) {
        console.error('Error fetching role permissions:', err.message);
      }
    } else if (role === 'super_admin') {
      permissions = ['all'];
    }

    const token = jwt.sign(
      {
        id: user._id,
        userId: user._id,
        email: user.email,
        name: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : (user.name || user.username),
        role: role,
        tenantId: tenantId,
        domain: user.domain || 'HR',
        permissions: permissions
      },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '30d' }
    );

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

          // Get latest subscription
          const sub = await Subscription.findOne().sort({ createdAt: -1 });

          if (sub) {
            currentPlan = sub.planName;
            let endDate = sub.currentPeriodEnd || sub.trialEndDate;

            // DEBUG: Allow overriding start date for testing
            if (req.body.debugStartDate) {
              const debugStart = new Date(req.body.debugStartDate);
              if (!isNaN(debugStart.getTime())) {
                const planCode = (sub.planCode || '').toLowerCase();
                const duration = (planCode.includes('demo') || planCode.includes('lattice')) ? 7 : 15;
                endDate = new Date(debugStart.getTime() + duration * 24 * 60 * 60 * 1000);
                console.log('🛠️ Debug Start Date active:', debugStart, 'duration:', duration, 'ends:', endDate);
              } else {
                console.warn('⚠️ Invalid debugStartDate provided:', req.body.debugStartDate);
              }
            }

            const now = new Date();
            subscriptionExpired = now > endDate;
            daysLeft = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));

            // Warning logic: 3 days before expiry
            const warningSoon = !subscriptionExpired && daysLeft <= 3;

            // Prepare response data
            return res.json({
              success: true,
              data: {
                token,
                user: {
                  id: user._id,
                  _id: user._id, // Ensure both id and _id are present for compatibility
                  email: user.email,
                  name: user.name || user.firstName,
                  role: role,
                  tenantId,
                  domain: user.domain,
                  hasSelectedPlan: user.hasSelectedPlan ?? false,
                  subscriptionExpired,
                  warningSoon,
                  daysLeft: Math.max(0, daysLeft),
                  currentPlan
                },
                tenantId: tenantId
              }
            });
          }

          // Mimic request object parts for recordActivity
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
          currentPlan
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
    const { companyName, adminEmail, password, planId, industry, paymentDetails, startDate } = req.body;

    console.log('📝 registerTenant Request received:', {
    const {
      companyName,
      adminEmail,
      password,
      planId,
      industry,
      startDate,
      hasPassword,
      hasPayment,
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
      console.log('❌ registerTenant Validation failed: Missing fields');
<<<<<<< HEAD
=======

>>>>>>> e6314a902f52656002db49b7c9c2223bf17d346f
      hasPassword,
      hasPayment
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
      console.warn(`⚠️ Registration failed: Email ${adminEmail} already exists`);
      return res.status(400).json({
        success: false,
        message: 'This email is already registered'
      });
    }

    let plan = null;
    if (planId) {
      plan = await Plan.findById(planId);
      if (!plan) {
        return res.status(404).json({
          success: false,
          message: 'Selected plan not found'
        });
      }
    const plan = await Plan.findById(planId);
    if (!plan) {
      console.warn(`⚠️ Registration failed: Plan ID ${planId} not found`);
      return res.status(404).json({
        success: false,
        message: 'Selected plan not found'
      });
    }

    console.log('✅ Plan found:', plan.name);

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

    // Create the tenant database and admin user
    try {
      await createTenantDatabase(tenant._id, dbName, plan, adminEmail, hashedPassword, paymentDetails, startDate);
    } catch (dbError) {
      console.error('❌ database creation failed:', dbError);
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

    const token = jwt.sign(
      {
        id: tenant._id,
        userId: tenant._id,
        email: tenant.email,
        role: 'admin',
        tenantId: tenant._id.toString()
      },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '30d' }
    );

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
    const SuperAdmin = getSuperAdminModel(req);

    const existingUser = await SuperAdmin.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already in use'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new SuperAdmin({
      email: email.toLowerCase(),
      password: hashedPassword,
      firstName: firstName || 'Super',
      lastName: lastName || 'Admin',
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

const crypto = require('crypto');
const { sendResetPasswordEmail } = require('../services/mailService');

// ====================================
// FORGOT PASSWORD
// ====================================
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email required' });

    console.log('🔍 Forgot password request for:', email);

    // 1. Search in master models first
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

    // 2. Search in tenant databases
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
      // For security, don't reveal if user exists
      return res.json({ success: true, message: 'Si un compte existe, un email a été envoyé.' });
    }

    // 3. Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

    // 4. Save user (handling tenant DB connection if needed)
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

    // 5. Send email
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

    console.log('🔄 Reset password attempt with token:', token);

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 1. Check Master DB
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

    // 2. Check Tenant DBs if not found
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

    // 3. Update Master DB user
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
    let user = null;

    if (role === 'super_admin') {
      const SuperAdmin = getSuperAdminModel(req);
      user = await SuperAdmin.findById(id).select('-password');
    } else if (role === 'admin') {
      const TenantModel = getTenantModel(req);
      user = await TenantModel.findById(tenantId || id).select('-password');
    } else if (tenantId) {
      // User in tenant DB
      const TenantModel = getTenantModel(req);
      const tenant = await TenantModel.findById(tenantId);
      if (tenant) {
        const conn = mongoose.createConnection(tenant.databaseUri);
        const TenantUser = require('../models/tenant/User')(conn);
        user = await TenantUser.findById(id).select('-password');
        await conn.close();
      }
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        ...user.toObject(),
        role: role,
        tenantId: tenantId
      }
    });
  } catch (error) {
    console.error('❌ getProfile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
};

module.exports = {
  login,
  registerTenant,
  registerSuperAdmin,
  forgotPassword,
  resetPassword,
  getProfile
};

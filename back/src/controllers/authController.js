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

// ====================================
// FUNCTION TO CREATE TENANT DATABASE
// ====================================
const createTenantDatabase = async (tenantId, dbName, plan, adminEmail, hashedPassword) => {
  try {
    console.log(` Creating database: ${dbName}`);

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

    // Create subscription
    const subscription = new Subscription({
      tenantId: tenantId.toString(),
      planId: plan._id.toString(),
      planName: plan.name,
      planCode: plan.code,
      price: plan.price,
      status: 'trial',
      selectedBy: adminUser._id,
      trialStartDate: new Date(),
      trialEndDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
    });

    await subscription.save();
    console.log(' Subscription created');

    await tenantConn.close();
    return { adminUser, subscription };

  } catch (error) {
    console.error(' Tenant database creation error:', error);
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
        role: role,
        tenantId: tenantId,
        domain: user.domain || 'HR',
        permissions: permissions
      },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '30d' }
    );

    // 4. Record Activity (if not super_admin)
    if (role !== 'super_admin' && tenantId) {
      try {
        const TenantModel = getTenantModel(req);
        const tenant = await TenantModel.findById(tenantId);
        if (tenant && tenant.databaseUri) {
          const conn = mongoose.createConnection(tenant.databaseUri);
          await new Promise((resolve, reject) => {
            conn.once('open', resolve);
            conn.once('error', reject);
          });

          // Create the model and record
          require('../models/tenant/ActivityLog')(conn);
          const ActivityLog = conn.model('ActivityLog');

          const logData = {
            user: {
              id: user._id,
              email: user.email,
              name: user.name || user.firstName || (role === 'admin' ? user.name : 'User'),
              role: role
            },
            action: 'SIGN_IN',
            resource: {
              type: 'Session',
              id: user._id,
              name: 'User Login'
            },
            ip: req.ip || req.connection.remoteAddress,
            timestamp: new Date()
          };

          await ActivityLog.create(logData);
          await conn.close();
          console.log(`✅ SIGN_IN Logged for tenant ${tenantId}`);
        }
      } catch (logErr) {
        console.error('❌ Failed to log SIGN_IN:', logErr.message);
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
          hasSelectedPlan: role === 'admin' ? true : true,
          tenantId: tenantId,
          domain: user.domain || 'HR'
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

// ====================================
// REGISTER NEW TENANT
// ====================================
const registerTenant = async (req, res) => {
  try {
    const { companyName, adminEmail, password, planId, industry } = req.body;

    console.log('📝 Tenant registration:', { companyName, adminEmail, planId });

    if (!companyName || !adminEmail || !password || !planId || !industry) {
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
      selectedPlan: plan._id,
      databaseName: dbName,
      databaseUri: dbUri
    });

    await tenant.save();

    // Create the tenant database and admin user
    try {
      await createTenantDatabase(tenant._id, dbName, plan, adminEmail, hashedPassword);
    } catch (dbError) {
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

module.exports = {
  login,
  registerTenant,
  registerSuperAdmin
};

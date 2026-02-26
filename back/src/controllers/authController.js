// back/src/controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// ====================================
// MASTER DATABASE CONNECTION
// ====================================
const MASTER_DB_URI = process.env.MASTER_DB_URI || 'mongodb://localhost:27017/workflow_master';

let masterConnection = null;

const getMasterConnection = async () => {
  if (!masterConnection) {
    masterConnection = await mongoose.createConnection(MASTER_DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log(' Direct connection established in authController');
  }
  return masterConnection;
};

// ====================================
// SUPER ADMIN MODEL
// ====================================
const getSuperAdminModel = async () => {
  const conn = await getMasterConnection();

  if (conn.models['SuperAdmin']) {
    return conn.models['SuperAdmin'];
  }

  const superAdminSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    firstName: String,
    lastName: String,
    role: { type: String, default: 'super_admin' },
    lastLogin: Date,
    isActive: { type: Boolean, default: true }
  }, { timestamps: true });

  return conn.model('SuperAdmin', superAdminSchema);
};

// ====================================
// TENANT MODEL (Organization)
// ====================================
const getTenantModel = async () => {
  const conn = await getMasterConnection();

  if (conn.models['Tenant']) {
    return conn.models['Tenant'];
  }

  const tenantSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    domain: { type: String, required: true, unique: true },
    status: { type: String, default: 'active' },
    industry: {
      type: String,
      enum: [
        'Construction & Engineering ',
        'Information Technology & Software',
        'Corporate & Business Services',
        'Healthcare',
        'Other'
      ],
      default: 'Other'
    },
    adminName: { type: String },
    selectedPlan: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan' },
    databaseName: { type: String, required: true, unique: true },
    databaseUri: { type: String, required: true }
  }, { timestamps: true });

  return conn.model('Tenant', tenantSchema);
};

// ====================================
// PLAN MODEL
// ====================================
const getPlanModel = async () => {
  const conn = await getMasterConnection();

  if (conn.models['Plan']) {
    return conn.models['Plan'];
  }

  const planSchema = new mongoose.Schema({
    name: String,
    code: String,
    price: Number,
    currency: String,
    interval: String,
    features: Object,
    isActive: Boolean
  }, { timestamps: true });

  return conn.model('Plan', planSchema);
};

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
      setTimeout(() => reject(new Error('Timeout')), 10000);
    });

    // User model for tenant
    const UserSchema = new mongoose.Schema({
      email: { type: String, required: true, unique: true },
      password: { type: String, required: true },
      firstName: String,
      lastName: String,
      role: { type: String, default: 'user' },
      isActive: { type: Boolean, default: true },
      hasSelectedPlan: { type: Boolean, default: true },
      tenantId: String
    }, { timestamps: true });

    // Subscription model for tenant
    const SubscriptionSchema = new mongoose.Schema({
      tenantId: String,
      planId: String,
      planName: String,
      planCode: String,
      billingCycle: { type: String, default: 'monthly' },
      price: Number,
      status: { type: String, default: 'trial' },
      selectedBy: mongoose.Schema.Types.ObjectId,
      trialStartDate: { type: Date, default: Date.now },
      trialEndDate: { type: Date, default: () => new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) }
    }, { timestamps: true });

    const User = tenantConn.model('User', UserSchema);
    const Subscription = tenantConn.model('Subscription', SubscriptionSchema);

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
      selectedBy: adminUser._id
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
// LOGIN (for super_admin AND admin)
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
    const SuperAdmin = await getSuperAdminModel();
    let user = await SuperAdmin.findOne({ email: email.toLowerCase() });
    let role = 'super_admin';
    let tenantId = null; // 👈 ADDED

    // 2. If not found, search in tenants (Owners/Admins)
    if (!user) {
      const TenantModel = await getTenantModel();
      user = await TenantModel.findOne({ email: email.toLowerCase() });
      if (user) {
        role = 'admin';
        tenantId = user._id.toString();
      }
    }

    // 3. If still not found, search in ALL tenant databases (Users/Agents)
    if (!user) {
      console.log('🔍 Searching user in tenant databases...');
      const TenantModel = await getTenantModel();
      const allTenants = await TenantModel.find({ status: 'active' });

      for (const t of allTenants) {
        try {
          // Create temporary connection (or reuse if possible)
          const conn = mongoose.createConnection(t.databaseUri);

          // Import User model via factory
          const TenantUser = require('../models/tenant/User')(conn);
          const foundUser = await TenantUser.findOne({ email: email.toLowerCase() });

          if (foundUser) {
            console.log(`✅ User found in tenant database: ${t.name}`);
            user = foundUser;
            role = foundUser.role || 'user';
            tenantId = t._id.toString();
            console.log(`📊 Role detected in tenant DB: "${role}"`);
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
      console.warn('⚠️ No user found for this email:', email);
      return res.status(401).json({
        success: false,
        message: 'Incorrect email or password'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      console.warn('⚠️ Invalid password for:', email);
      return res.status(401).json({
        success: false,
        message: 'Incorrect email or password'
      });
    }

    console.log(`🔑 Login validated for ${email}. Final role: ${role}`);

    // 4. Fetch permissions for this role
    let permissions = [];
    if (tenantId && role !== 'super_admin') {
      try {
        const TenantModel = await getTenantModel();
        const tenant = await TenantModel.findById(tenantId);
        if (tenant) {
          const conn = mongoose.createConnection(tenant.databaseUri);
          const Role = require('../models/master/Role')(conn); // Roles are in tenant DB
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
      permissions = ['all']; // Super admin has all
    }

    // Generate token WITH tenantId and permissions
    const token = jwt.sign(
      {
        id: user._id,
        userId: user._id,
        email: user.email,
        role: role,
        tenantId: tenantId,
        permissions: permissions // 👈 ADDED
      },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '30d' }
    );

    console.log(`✅ Login successful: ${email} (${role})`, tenantId ? `tenantId: ${tenantId}` : '');

    // RESPONSE modified to include tenantId
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
          tenantId: tenantId // 👈 ADDED: so that the front can retrieve it
        },
        tenantId: tenantId // 👈 ADDED: directly in data to be sure
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
// REGISTER NEW TENANT (ORGANIZATION)
// ====================================
const registerTenant = async (req, res) => {
  try {
    const { companyName, adminEmail, password, planId, industry } = req.body;

    console.log('📝 Tenant registration:', { companyName, adminEmail, planId, industry });

    // ✅ Validation
    if (!companyName || !adminEmail || !password || !planId || !industry) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // ✅ Verify that companyName is defined
    if (!companyName || companyName.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Company name is required'
      });
    }

    // Get models
    const Tenant = await getTenantModel();
    const Plan = await getPlanModel();

    // Check if email already exists
    const existingTenant = await Tenant.findOne({ email: adminEmail.toLowerCase() });
    if (existingTenant) {
      return res.status(400).json({
        success: false,
        message: 'This company already exists'
      });
    }

    // Verify plan exists
    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create unique database name (WITH VERIFICATION)
    const timestamp = Date.now();
    const safeCompanyName = companyName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_');

    const dbName = `tenant_${safeCompanyName}_${timestamp}`;
    const dbUri = `mongodb://localhost:27017/${dbName}`;

    console.log('📦 Generated DB name:', dbName);

    // 1. Create tenant in master
    const tenant = new Tenant({
      name: companyName.trim(),
      email: adminEmail.toLowerCase().trim(),
      password: hashedPassword,
      domain: `${safeCompanyName}.workflow.com`,
      status: 'active',
      industry: industry || 'Other',
      adminName: adminEmail.split('@')[0],
      selectedPlan: plan._id,
      databaseName: dbName,
      databaseUri: dbUri
    });

    await tenant.save();
    console.log('✅ Tenant created in master:', tenant._id);

    // 2. Create tenant database
    try {
      await createTenantDatabase(
        tenant._id,
        dbName,
        plan,
        adminEmail,
        hashedPassword
      );
    } catch (dbError) {
      // In case of error, delete the master tenant
      await Tenant.findByIdAndDelete(tenant._id);
      throw new Error(`Database creation failed: ${dbError.message}`);
    }

    // Generate token for auto-login WITH tenantId
    const token = jwt.sign(
      {
        id: tenant._id,
        userId: tenant._id, // 👈 ADDED
        email: tenant.email,
        role: 'admin',
        tenantId: tenant._id.toString() // 👈 ADDED
      },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '30d' }
    );

    console.log('🎉 Registration successful for:', companyName);

    // ✅ RESPONSE MODIFIED to include tenantId
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
          hasSelectedPlan: true,
          tenantId: tenant._id.toString() // 👈 ADDED
        },
        tenant: {
          _id: tenant._id,
          name: tenant.name,
          databaseName: tenant.databaseName
        },
        tenantId: tenant._id.toString() // 👈 ADDED directly
      }
    });

  } catch (error) {
    console.error('❌ registerTenant Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// ====================================
// REGISTER SUPER ADMIN (optional)
// ====================================
const registerSuperAdmin = async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    const SuperAdmin = await getSuperAdminModel();

    const existingUser = await SuperAdmin.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'This email is already in use'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new SuperAdmin({
      email: email.toLowerCase(),
      password: hashedPassword,
      firstName: firstName || 'Super',
      lastName: lastName || 'Admin',
      role: 'super_admin',
      isActive: true
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
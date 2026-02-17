// back/src/controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// ====================================
// CONNEXION À LA BASE MASTER
// ====================================
const MASTER_DB_URI = process.env.MASTER_DB_URI || 'mongodb://localhost:27017/workflow_master';

let masterConnection = null;

const getMasterConnection = async () => {
  if (!masterConnection) {
    masterConnection = await mongoose.createConnection(MASTER_DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log(' Connexion directe établie dans authController');
  }
  return masterConnection;
};

// ====================================
// MODÈLE SUPER ADMIN
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
// MODÈLE TENANT (Entreprise)
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
    industry: { type: String, default: 'Non spécifié' },
    adminName: { type: String },
    selectedPlan: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan' },
    databaseName: { type: String, required: true, unique: true },
    databaseUri: { type: String, required: true }
  }, { timestamps: true });

  return conn.model('Tenant', tenantSchema);
};

// ====================================
// MODÈLE PLAN
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
// FONCTION POUR CRÉER LA BASE TENANT
// ====================================
const createTenantDatabase = async (tenantId, dbName, plan, adminEmail, hashedPassword) => {
  try {
    console.log(` Création de la base: ${dbName}`);
    
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

    // Modèle User pour le tenant
    const UserSchema = new mongoose.Schema({
      email: { type: String, required: true, unique: true },
      password: { type: String, required: true },
      firstName: String,
      lastName: String,
      role: { type: String, default: 'admin' },
      isActive: { type: Boolean, default: true },
      hasSelectedPlan: { type: Boolean, default: true },
      tenantId: String
    }, { timestamps: true });

    // Modèle Subscription pour le tenant
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

    // Créer l'admin
    const adminUser = new User({
      email: adminEmail,
      password: hashedPassword,
      firstName: 'Admin',
      lastName: '',
      role: 'admin',
      tenantId: tenantId.toString()
    });

    await adminUser.save();
    console.log('✅ Admin créé dans base tenant');

    // Créer la souscription
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
    console.log(' Souscription créée');

    await tenantConn.close();
    return { adminUser, subscription };

  } catch (error) {
    console.error(' Erreur création base tenant:', error);
    throw error;
  }
};

// ====================================
// LOGIN (pour super_admin ET admin)
// ====================================
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('🔑 Tentative de login:', email);

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email et mot de passe requis'
      });
    }

    // ✅ 1. Chercher d'abord dans super_admin
    const SuperAdmin = await getSuperAdminModel();
    let user = await SuperAdmin.findOne({ email: email.toLowerCase() });
    let role = 'super_admin';

    // ✅ 2. Si pas trouvé, chercher dans tenants
    if (!user) {
      const Tenant = await getTenantModel();
      user = await Tenant.findOne({ email: email.toLowerCase() });
      role = 'admin';
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Vérifier mot de passe
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Générer token
    const token = jwt.sign(
      { 
        id: user._id, 
        email: user.email, 
        role: role,
        tenantId: role === 'admin' ? user._id : null
      },
      process.env.JWT_SECRET || 'votre_secret_jwt',
      { expiresIn: '30d' }
    );

    console.log(`✅ Login réussi: ${email} (${role})`);

    res.json({
      success: true,
      data: {
        token,
        user: {
          _id: user._id,
          email: user.email,
          role: role,
          name: user.name || user.firstName || 'Admin',
          hasSelectedPlan: role === 'admin' ? true : true
        }
      }
    });

  } catch (error) {
    console.error('❌ Erreur login:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur: ' + error.message
    });
  }
};

// ====================================
// INSCRIPTION D'UN NOUVEAU TENANT (ENTREPRISE)
// ====================================
const registerTenant = async (req, res) => {
  try {
    const { companyName, adminEmail, password, planId } = req.body;
    
    console.log('📝 Inscription tenant:', { companyName, adminEmail, planId });

    // ✅ Validation
    if (!companyName || !adminEmail || !password || !planId) {
      return res.status(400).json({
        success: false,
        message: 'Tous les champs sont requis'
      });
    }

    // ✅ Vérifier que companyName est défini
    if (!companyName || companyName.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Le nom de l\'entreprise est requis'
      });
    }

    // ✅ Obtenir les modèles
    const Tenant = await getTenantModel();
    const Plan = await getPlanModel();

    // ✅ Vérifier si l'email existe déjà
    const existingTenant = await Tenant.findOne({ email: adminEmail.toLowerCase() });
    if (existingTenant) {
      return res.status(400).json({
        success: false,
        message: 'Cette entreprise existe déjà'
      });
    }

    // ✅ Vérifier que le plan existe
    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan non trouvé'
      });
    }

    // ✅ Hasher le mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // ✅ Créer un nom de base unique (AVEC VÉRIFICATION)
    const timestamp = Date.now();
    const safeCompanyName = companyName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_');
    
    const dbName = `tenant_${safeCompanyName}_${timestamp}`;
    const dbUri = `mongodb://localhost:27017/${dbName}`;

    console.log('📦 Nom DB généré:', dbName);

    // ✅ 1. Créer le tenant dans master
    const tenant = new Tenant({
      name: companyName.trim(),
      email: adminEmail.toLowerCase().trim(),
      password: hashedPassword,
      domain: `${safeCompanyName}.workflow.com`,
      status: 'active',
      industry: 'Non spécifié',
      adminName: adminEmail.split('@')[0],
      selectedPlan: plan._id,
      databaseName: dbName,
      databaseUri: dbUri
    });

    await tenant.save();
    console.log('✅ Tenant créé dans master:', tenant._id);

    // ✅ 2. Créer la base de données du tenant
    try {
      await createTenantDatabase(
        tenant._id, 
        dbName, 
        plan, 
        adminEmail, 
        hashedPassword
      );
    } catch (dbError) {
      // En cas d'erreur, supprimer le tenant master
      await Tenant.findByIdAndDelete(tenant._id);
      throw new Error(`Échec création base: ${dbError.message}`);
    }

    // ✅ Générer token pour connexion automatique
    const token = jwt.sign(
      {
        id: tenant._id,
        email: tenant.email,
        role: 'admin',
        tenantId: tenant._id
      },
      process.env.JWT_SECRET || 'votre_secret_jwt',
      { expiresIn: '30d' }
    );

    console.log('🎉 Inscription réussie pour:', companyName);

    res.status(201).json({
      success: true,
      message: 'Entreprise créée avec succès',
      data: {
        token,
        user: {
          _id: tenant._id,
          email: tenant.email,
          role: 'admin',
          name: companyName,
          hasSelectedPlan: true
        },
        tenant: {
          _id: tenant._id,
          name: tenant.name,
          databaseName: tenant.databaseName
        }
      }
    });

  } catch (error) {
    console.error('❌ Erreur registerTenant:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur serveur'
    });
  }
};

// ====================================
// INSCRIPTION D'UN SUPER ADMIN (optionnel)
// ====================================
const registerSuperAdmin = async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    
    const SuperAdmin = await getSuperAdminModel();

    const existingUser = await SuperAdmin.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Cet email est déjà utilisé'
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
      message: 'Super admin créé avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur registerSuperAdmin:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  login,
  registerTenant,
  registerSuperAdmin
};
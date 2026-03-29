// back/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// ========================
// ROUTE IMPORTS
// ========================
const userRoutes = require('./src/routes/userRoutes');
const authRoutes = require('./src/routes/authRoutes');
const tenantRoutes = require('./src/routes/tenantRoutes');
const planRoutes = require('./src/routes/planRoutes');
const subscriptionService = require('./src/services/subscriptionService');
const workflowRoutes = require('./src/routes/workflowRoutes');
const projectRoutes = require('./src/routes/projectRoutes');
const workflowInstanceRoutes = require('./src/routes/WorkflowInstanceRoutes');
const subscriptionRoutes = require('./src/routes/subscriptionRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const dynamicFormRoutes = require('./src/routes/dynamicFormRoutes');
const formRoutes = require('./src/routes/formRoutes');
const checklistRoutes = require('./src/routes/checklistRoutes');
const taskRoutes = require('./src/routes/taskRoutes');
const boardRoutes = require('./src/routes/boardRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');
const tenantRoleRoutes = require('./src/routes/tenant/role.routes');
const tenantDomainRoutes = require('./src/routes/tenant/domain.routes');
const reportRoutes = require('./src/routes/reportRoutes');

const app = express();


// ========================
// MIDDLEWARES
// ========================
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-id'],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// REQUEST LOGGER & CLIENT INFO
const useragent = require('express-useragent');
app.use(useragent.express());
app.use((req, res, next) => {
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.ip;
  const ua = req.useragent;
  
  req.clientInfo = {
    ipAddress: ip,
    userAgent: req.headers['user-agent'],
    browser: ua.browser + ' ' + ua.version,
    os: ua.os,
    device: ua.isMobile ? 'Mobile' : ua.isTablet ? 'Tablet' : 'Desktop'
  };
  
  req.requestId = Date.now().toString(36) + Math.random().toString(36).substr(2);

  // console.log(`📡 [HTTP] ${req.method} ${req.originalUrl} from ${ip}`);
  res.on('finish', () => {
    // console.log(`🏁 [HTTP] ${req.method} ${req.originalUrl} - ${res.statusCode}`);
  });
  next();
});

// ========================
// MASTER CONNECTION
// ========================
const MASTER_DB_URI = process.env.MASTER_DB_URI || 'mongodb://localhost:27017/workflow_master';

console.log('🔄 Connexion à MongoDB...');

const masterConnection = mongoose.createConnection(MASTER_DB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
});

masterConnection.once('connected', () => {
  console.log('✅ Connecté à la base MASTER avec succès');

  try {
    // Attacher les modèles master à la connexion
    require('./src/models/master/Tenant')(masterConnection);
    require('./src/models/master/Plan')(masterConnection);
    require('./src/models/master/SuperAdmin')(masterConnection);
    require('./src/models/master/permission.model')(masterConnection);
    require('./src/models/master/Role')(masterConnection);
    require('./src/models/master/SystemReport')(masterConnection);
    require('./src/models/master/Notification')(masterConnection);
    require('./src/models/master/PlatformSettings')(masterConnection);

    console.log('📦 Modèles master chargés:', Object.keys(masterConnection.models).join(', '));

    // Rendre la connexion master accessible globalement
    app.locals.masterDb = masterConnection;

    // Démarrer le serveur SEULEMENT après la connexion
    const PORT = process.env.PORT || 5000;
    const HOST = process.env.HOST || 'localhost';

    app.listen(PORT, () => {
      console.log(`
  ╔════════════════════════════════════════════════╗
  ║     🚀  DYNAMIC WORKFLOW - SERVER READY       ║
  ╚════════════════════════════════════════════════╝
  
  📡 URL: http://localhost:${PORT}
  📊 DB: workflow_master
  ✅ Status: Connected
      `);

      // Start subscription check
      subscriptionService.checkExpiringSubscriptions(masterConnection);
      // Run every 24 hours
      setInterval(() => {
        subscriptionService.checkExpiringSubscriptions(masterConnection);
      }, 24 * 60 * 60 * 1000);
    });
  } catch (error) {
    console.error('❌ Erreur lors du chargement des modèles:', error);
  }
});

masterConnection.on('error', (err) => {
  console.error('❌ Erreur de connexion MASTER:', err.message);
  console.log('🔄 Tentative de reconnexion dans 5 secondes...');
  setTimeout(() => {
    masterConnection.openUri(MASTER_DB_URI);
  }, 5000);
});

// MIDDLEWARE DE CONNEXION MASTER
app.use((req, res, next) => {
  if (!app.locals.masterDb) {
    return res.status(503).json({
      success: false,
      message: 'Base de données en cours de connexion, veuillez réessayer / Database connecting, please try again'
    });
  }
  req.masterDb = app.locals.masterDb;
  next();
});

// ========================
// PUBLIC ROUTES
// ========================
app.use('/api/plans', planRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/platform-settings', require('./src/routes/platformSettingsRoutes'));

// ========================
// ADMIN ROUTES
// ========================
app.use('/api/admin', adminRoutes);

// ========================
// TENANT MIDDLEWARE
// ========================
let tenantResolver;
try {
  tenantResolver = require('./src/middleware/tenantMiddleware').tenantResolver;
} catch (error) {
  console.log('⚠️ Tenant middleware error:', error.message);
  tenantResolver = (req, res, next) => {
    req.tenantConn = app.locals.masterDb; // Fallback
    next();
  };
}

app.use('/api', tenantResolver);

// ========================
// TENANT PROTECTED ROUTES
// ========================
app.use('/api/tenant', tenantRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/workflow-instances', workflowInstanceRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/forms', dynamicFormRoutes);
app.use('/api/checklists', checklistRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/tenant/roles', tenantRoleRoutes);

app.use('/api/tenant/domains', tenantDomainRoutes);
app.use('/api/form-responses', formRoutes);
app.use('/api/task-reports', require('./src/routes/taskReportRoutes'));
app.use('/api/message-templates', require('./src/routes/messageTemplateRoutes'));

// ========================
// ROOT ROUTE
// ========================
app.get('/', (req, res) => {
  res.json({
    message: '🚀 Dynamic Workflow API / API Workflow Dynamique',
    status: app.locals.masterDb ? 'connected' : 'connecting',
    timestamp: new Date().toISOString()
  });
});

// ========================
// 404 ERROR HANDLING
// ========================
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

// ========================
// GLOBAL ERROR HANDLING
// ========================
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

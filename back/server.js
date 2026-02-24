// back/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// ========================
// ROUTE IMPORTS
// ========================
const userRoutes = require('./src/routes/userRoutes');
const authRoutes = require('./src/routes/authRoutes');
const tenantRoutes = require('./src/routes/tenantRoutes');
const planRoutes = require('./src/routes/planRoutes.js');
const workflowRoutes = require('./src/routes/workflowRoutes');
const workflowInstanceRoutes = require('./src/routes/WorkflowInstanceRoutes.js');
const subscriptionRoutes = require('./src/routes/subscriptionRoutes.js');
const adminRoutes = require('./src/routes/adminRoutes');
const tenantRoleRoutes = require('./src/routes/tenant/role.routes');
const tenantDomainRoutes = require('./src/routes/tenant/domain.routes');
const projectRoutes = require('./src/routes/projectRoutes');


const app = express();

// ========================
// MIDDLEWARES
// ========================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========================
// MASTER CONNECTION MIDDLEWARE
// ========================
app.use((req, res, next) => {
  if (!app.locals.masterDb) {
    return res.status(503).json({
      success: false,
      message: 'Database connecting, please try again'
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

// ========================
// ADMIN ROUTES
// ========================
app.use('/api/admin', adminRoutes);

// ========================
// TENANT MIDDLEWARE
// ========================
let tenantResolver;
try {
  tenantResolver = require('./src/middleware/tenantMiddleware.js').tenantResolver;
} catch (error) {
  console.log('⚠️ Tenant middleware not found, creating default middleware');
  tenantResolver = (req, res, next) => {
    req.tenantConnection = app.locals.masterDb; // Fallback
    next();
  };
}

app.use('/api', tenantResolver);

// ========================
// TENANT PROTECTED ROUTES
// ========================
app.use('/api/tenants', tenantRoutes);
app.use('/api/users', userRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/workflow-instances', workflowInstanceRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/tenant/roles', tenantRoleRoutes);
app.use('/api/tenant/domains', tenantDomainRoutes);
app.use('/api/projects', projectRoutes);


// ========================
// ROOT ROUTE
// ========================
app.get('/', (req, res) => {
  res.json({
    message: '🚀 Dynamic Workflow API',
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

// ========================
// MONGODB CONNECTION - MASTER
// ========================
const MASTER_DB_URI = process.env.MASTER_DB_URI || 'mongodb://localhost:27017/workflow_master';

console.log('🔄 Connecting to MongoDB...');

const masterConnection = mongoose.createConnection(MASTER_DB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
});

masterConnection.on('connected', () => {
  console.log('✅ Connected to MASTER database successfully');

  try {
    // Attach master models to connection
    require('./src/models/master/Tenant')(masterConnection);
    require('./src/models/master/Plan')(masterConnection);
    require('./src/models/master/SuperAdmin')(masterConnection);
    require('./src/models/master/permission.model')(masterConnection);
    require('./src/models/master/Role')(masterConnection); // Use Master Role model for global roles

    console.log('📦 Master models loaded:', Object.keys(masterConnection.models).join(', '));

    // Make master connection globally accessible
    app.locals.masterDb = masterConnection;

    // Start server ONLY after connection
    const PORT = process.env.PORT || 5000;
    const HOST = process.env.HOST || 'localhost';

    app.listen(PORT, HOST, () => {
      console.log(`
  ╔════════════════════════════════════════════════╗
  ║     🚀  DYNAMIC WORKFLOW - SERVER READY       ║
  ╚════════════════════════════════════════════════╝
  
  📡 URL: http://${HOST}:${PORT}
  📊 DB: workflow_master
  ✅ Status: Connected
      `);
    });
  } catch (error) {
    console.error('❌ Error loading models:', error);
  }
});

masterConnection.on('error', (err) => {
  console.error('❌ MASTER connection error:', err.message);
});
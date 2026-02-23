// back/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// ========================
// IMPORTATION DE TOUTES LES ROUTES
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

const app = express();

// ========================
// MIDDLEWARES
// ========================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========================
// MIDDLEWARE DE CONNEXION MASTER
// ========================
app.use((req, res, next) => {
  if (!app.locals.masterDb) {
    return res.status(503).json({
      success: false,
      message: 'Base de données en cours de connexion, veuillez réessayer'
    });
  }
  req.masterDb = app.locals.masterDb;
  next();
});

// ========================
// ROUTES PUBLIQUES
// ========================
app.use('/api/plans', planRoutes);
app.use('/api/auth', authRoutes);

// ========================
// ROUTES ADMIN
// ========================
app.use('/api/admin', adminRoutes);

// ========================
// MIDDLEWARE DE TENANT (À DÉPLACER AVANT LES ROUTES PROTÉGÉES)
// ========================
let tenantResolver;
try {
  tenantResolver = require('./src/middleware/tenantMiddleware.js').tenantResolver;
} catch (error) {
  console.log('⚠️ Middleware tenant non trouvé, création d\'un middleware par défaut');
  tenantResolver = (req, res, next) => {
    req.tenantConnection = app.locals.masterDb; // Fallback
    next();
  };
}

app.use('/api', tenantResolver);

// ========================
// ROUTES PROTÉGÉES PAR TENANT
// ========================
app.use('/api/tenants', tenantRoutes);
app.use('/api/users', userRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/workflow-instances', workflowInstanceRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/tenant/roles', tenantRoleRoutes);
app.use('/api/tenant/domains', tenantDomainRoutes);

// ========================
// ROUTE RACINE
// ========================
app.get('/', (req, res) => {
  res.json({
    message: '🚀 API Workflow Dynamique',
    status: app.locals.masterDb ? 'connected' : 'connecting',
    timestamp: new Date().toISOString()
  });
});

// ========================
// GESTION DES ERREURS 404
// ========================
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route non trouvée',
    path: req.originalUrl
  });
});

// ========================
// GESTION DES ERREURS GLOBALES
// ========================
app.use((err, req, res, next) => {
  console.error('❌ Erreur serveur:', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Erreur interne du serveur'
  });
});

// ========================
// CONNEXION MONGODB - MASTER
// ========================
const MASTER_DB_URI = process.env.MASTER_DB_URI || 'mongodb://localhost:27017/workflow_master';

console.log('🔄 Connexion à MongoDB...');

const masterConnection = mongoose.createConnection(MASTER_DB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
});

masterConnection.on('connected', () => {
  console.log('✅ Connecté à la base MASTER avec succès');

  try {
    // Attacher les modèles master à la connexion
    require('./src/models/master/Tenant')(masterConnection);
    require('./src/models/master/Plan')(masterConnection);
    require('./src/models/master/SuperAdmin')(masterConnection);
    require('./src/models/master/permission.model')(masterConnection);
    require('./src/models/master/Role')(masterConnection); // Use Master Role model for global roles

    console.log('📦 Modèles master chargés:', Object.keys(masterConnection.models).join(', '));

    // Rendre la connexion master accessible globalement
    app.locals.masterDb = masterConnection;

    // Démarrer le serveur SEULEMENT après la connexion
    const PORT = process.env.PORT || 5000;
    const HOST = process.env.HOST || 'localhost';

    app.listen(PORT, HOST, () => {
      console.log(`
  ╔════════════════════════════════════════════════╗
  ║     🚀  WORKFLOW DYNAMIQUE - SERVEUR PRÊT     ║
  ╚════════════════════════════════════════════════╝
  
  📡 URL: http://${HOST}:${PORT}
  📊 DB: workflow_master
  ✅ Statut: Connecté
      `);
    });
  } catch (error) {
    console.error('❌ Erreur chargement modèles:', error);
  }
});

masterConnection.on('error', (err) => {
  console.error('❌ Erreur de connexion MASTER:', err.message);
});
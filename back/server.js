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

const app = express();

// ========================
// MIDDLEWARES
// ========================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========================
// CONNEXION MONGODB - MASTER
// ========================
const MASTER_DB_URI = process.env.MASTER_DB_URI || 'mongodb://localhost:27017/workflow_master';

console.log('🔄 Connexion à MongoDB...');

const masterConnection = mongoose.createConnection(MASTER_DB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000, // Timeout de 5 secondes
  socketTimeoutMS: 45000,
});

masterConnection.on('connected', () => {
  console.log('✅ Connecté à la base MASTER avec succès');
  
  // Attacher les modèles master à la connexion
  require('./src/models/master/Tenant')(masterConnection);
  require('./src/models/master/Plan')(masterConnection);
  require('./src/models/master/SuperAdmin')(masterConnection);
  
  console.log('📦 Modèles master chargés:', Object.keys(masterConnection.models).join(', '));
  
  // Rendre la connexion master accessible globalement
  app.locals.masterDb = masterConnection;
  
  // Démarrer le serveur SEULEMENT après la connexion
  startServer();
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
// MIDDLEWARE DE TENANT
// ========================
const { tenantResolver } = require('./src/middleware/tenantMiddleware.js');
app.use('/api', tenantResolver);

// ========================
// ROUTES PROTÉGÉES PAR TENANT
// ========================
app.use('/api/tenants', tenantRoutes);
app.use('/api/users', userRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/workflow-instances', workflowInstanceRoutes);
app.use('/api/subscriptions', subscriptionRoutes);

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
// FONCTION DE DÉMARRAGE
// ========================
function startServer() {
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
  
  📋 Routes disponibles:
  ─────────────────────
  🔓 Public:    /api/plans, /api/auth
  🔐 Admin:     /api/admin
  🔒 Protégées: /api/tenants, /api/users, /api/workflows
    `);
  });
}
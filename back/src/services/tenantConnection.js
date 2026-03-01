// back/src/services/tenantConnection.js
const mongoose = require('mongoose');

// Connection cache
const connections = {};

async function getTenantConnection(domain, dbName) {
  console.log(`🔌 [TenantConn] Tentative pour: ${domain} (${dbName})`);

  // Vérifier le cache
  if (connections[domain]) {
    if (connections[domain].readyState === 1) {
      console.log(`✅ [TenantConn] Utilisation cache pour: ${domain}`);
      return connections[domain];
    } else {
      console.log(`🔄 [TenantConn] Cache expiré/fermé pour: ${domain}`);
      delete connections[domain];
    }
  }

  // Connection URI - to be adapted according to your config
  const baseUri = process.env.MONGO_URI || 'mongodb://localhost:27017';
  const uri = `${baseUri}/${dbName}`;
  console.log(`🔗 [TenantConn] URI: ${uri}`);

  try {
    // Créer une nouvelle connexion - Remove poolSize (not supported in newer Mongo drivers)
    const conn = mongoose.createConnection(uri);

    // Attendre que la connexion soit prête
    console.log(`⏳ [TenantConn] Attente connexion...`);
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Timeout connection tenant')), 15000);
      conn.once('open', () => {
        clearTimeout(timeout);
        resolve();
      });
      conn.once('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
    console.log(`✅ [TenantConn] MongoDB connecté: ${dbName}`);

    // ATTACHER LES MODÈLES DU TENANT À CETTE CONNEXION
    console.log(`📦 [TenantConn] Chargement des modèles...`);

    const tenantModels = [
      'User',
      'Workflow',
      'WorkflowInstance',
      'DynamicForm',
      'Form',
      'Checklist',
      'FormResponse',
      'Task',
      'Project',
      'role.model',
      'domain.model',
      'department.model',
      'Subscription',
      'ActivityLog',
      'Notification'
    ];

    for (const modelName of tenantModels) {
      try {
        const modelFactory = require(`../models/tenant/${modelName}`);
        modelFactory(conn);
      } catch (err) {
        console.warn(`⚠️ [TenantConn] Impossible de charger le modèle ${modelName}: ${err.message}`);
      }
    }

    console.log(`✅ [TenantConn] Modèles chargés pour ${domain}`);

    // Mettre en cache
    connections[domain] = conn;

    console.log(`🚀 [TenantConn] Session prête pour: ${domain}`);
    return conn;
  } catch (dbError) {
    console.error('❌ [TenantConn] Erreur DB:', dbError);
    throw dbError;
  }
}

// Function to close all connections (useful for tests)
async function closeAllConnections() {
  for (const domain in connections) {
    await connections[domain].close();
  }
}

module.exports = { getTenantConnection, closeAllConnections };
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
    // Créer une nouvelle connexion
    const conn = mongoose.createConnection(uri);

    // Attendre que la connexion soit prête
    console.log(`⏳ [TenantConn] Attente connexion...`);
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Timeout connection tenant')), 10000);
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

    //  ATTACHER LES MODÈLES DU TENANT À CETTE CONNEXION
    console.log(`📦 [TenantConn] Chargement des modèles...`);

    try {
      console.log(' - User...');
      require('../models/tenant/User')(conn);
      console.log(' - Workflow...');
      require('../models/tenant/Workflow')(conn);
      console.log(' - DynamicForm...');
      require('../models/tenant/DynamicForm')(conn);
      console.log(' - Checklist...');
      require('../models/tenant/Checklist')(conn);
      console.log(' - FormResponse...');
      require('../models/tenant/FormResponse')(conn);
      console.log(' - Task...');
      require('../models/tenant/Task')(conn);
      console.log('✅ [TenantConn] Modèles chargés');
    } catch (modelError) {
      console.error('❌ [TenantConn] Erreur chargement modèles:', modelError);
      throw modelError;
    }

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
  for (const slug in connections) {
    await connections[slug].close();
  }
}

module.exports = { getTenantConnection, closeAllConnections };
// back/src/services/tenantConnection.js
const mongoose = require('mongoose');

// Connection cache
const connections = {};

async function getTenantConnection(tenantSlug, dbName) {
  // Check cache
  if (connections[tenantSlug]) {
    if (connections[tenantSlug].readyState === 1) {
      return connections[tenantSlug];
    } else {
      delete connections[tenantSlug];
    }
  }

  // Connection URI - to be adapted according to your config
  const baseUri = process.env.MONGO_URI || 'mongodb://localhost:27017';
  const uri = `${baseUri}/${dbName}`;

  // Créer une nouvelle connexion
  // Create a new connection
  const conn = mongoose.createConnection(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    poolSize: 10
  });

  // Wait for the connection to be ready
  await conn.asPromise();

  // ATTACH TENANT MODELS TO THIS CONNECTION
  conn.model('User', require('../models/tenant/User')(conn).schema);
  conn.model('Workflow', require('../models/tenant/Workflow')(conn).schema);
  conn.model('DynamicForm', require('../models/tenant/DynamicForm')(conn).schema);
  // Ajoute ici tous tes autres modèles tenant
  // Add all your other tenant models here

  // Put in cache
  connections[tenantSlug] = conn;

  console.log(` Connexion établie pour le tenant: ${tenantSlug}`);
  console.log(` Connection established for tenant: ${tenantSlug}`);
  return conn;
}

// Function to close all connections (useful for tests)
async function closeAllConnections() {
  for (const slug in connections) {
    await connections[slug].close();
  }
}

module.exports = { getTenantConnection, closeAllConnections };
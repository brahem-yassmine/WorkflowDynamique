// back/src/services/tenantConnection.js
const mongoose = require('mongoose');

// Cache des connexions
const connections = {};

async function getTenantConnection(tenantSlug, dbName) {
  // Vérifier le cache
  if (connections[tenantSlug]) {
    if (connections[tenantSlug].readyState === 1) {
      return connections[tenantSlug];
    } else {
      delete connections[tenantSlug];
    }
  }

  // URI de connexion - à adapter selon ta config
  const baseUri = process.env.MONGO_URI || 'mongodb://localhost:27017';
  const uri = `${baseUri}/${dbName}`;

  // Créer une nouvelle connexion
  const conn = mongoose.createConnection(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    poolSize: 10
  });

  // Attendre que la connexion soit prête
  await conn.asPromise();

  //  ATTACHER LES MODÈLES DU TENANT À CETTE CONNEXION
  conn.model('User', require('../models/tenant/User')(conn).schema);
  conn.model('Workflow', require('../models/tenant/Workflow')(conn).schema);
  conn.model('DynamicForm', require('../models/tenant/DynamicForm')(conn).schema);
  // Ajoute ici tous tes autres modèles tenant

  // Mettre en cache
  connections[tenantSlug] = conn;

  console.log(` Connexion établie pour le tenant: ${tenantSlug}`);
  return conn;
}

// Fonction pour fermer toutes les connexions (utile pour les tests)
async function closeAllConnections() {
  for (const slug in connections) {
    await connections[slug].close();
  }
}

module.exports = { getTenantConnection, closeAllConnections };
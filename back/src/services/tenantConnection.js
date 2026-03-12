// back/src/services/tenantConnection.js
const mongoose = require('mongoose');

// Connection cache
const connections = {};
const connectionPromises = {};

/**
 * Get or create a connection for a specific tenant
 * @param {string} domain - Tenant domain/slug
 * @param {string} dbName - Tenant database name
 */
async function getTenantConnection(domain, dbName) {
  // 1. Check if connection is already established and models loaded
  if (connections[domain] && connections[domain].readyState === 1) {
    return connections[domain];
  }

  // 2. If a connection is currently being established, wait for it
  if (connectionPromises[domain]) {
    console.log(`⏳ [TenantConn] Waiting for ongoing connection for: ${domain}`);
    return connectionPromises[domain];
  }

  // 3. Start a new connection process
  connectionPromises[domain] = (async () => {
    try {
      // Check cache again
      if (connections[domain]) {
        if (connections[domain].readyState === 1) return connections[domain];
        if (connections[domain].readyState !== 2) {
          delete connections[domain];
        }
      }

      const baseUri = process.env.MONGO_URI || 'mongodb://localhost:27017';
      const uri = `${baseUri}/${dbName}`;
      console.log(`🔌 [TenantConn] Opening connection to: ${uri}`);

      const conn = mongoose.createConnection(uri, {
        serverSelectionTimeoutMS: 10000,
      });

      connections[domain] = conn;

      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error(`Timeout connecting to tenant DB: ${dbName}`)), 15000);
        conn.once('open', () => {
          clearTimeout(timeout);
          resolve();
        });
        conn.once('error', (err) => {
          clearTimeout(timeout);
          delete connections[domain];
          reject(err);
        });
      });

      console.log(`✅ [TenantConn] MongoDB connected: ${dbName}. Loading models...`);

      // ATTACH MODELS
      require('../models/tenant/User')(conn);
      require('../models/tenant/Workflow')(conn);
      require('../models/tenant/WorkflowInstance')(conn);
      require('../models/tenant/DynamicForm')(conn);
      require('../models/tenant/Form')(conn);
      require('../models/tenant/Checklist')(conn);
      require('../models/tenant/FormResponse')(conn);
      require('../models/tenant/Task')(conn);
      require('../models/tenant/Project')(conn);
      require('../models/tenant/role.model')(conn);
      require('../models/tenant/domain.model')(conn);
      require('../models/tenant/department.model')(conn);
      require('../models/tenant/Subscription')(conn);
      require('../models/tenant/ActivityLog')(conn);
      require('../models/tenant/Notification')(conn);
      require('../models/tenant/Board')(conn);

      console.log(`📦 [TenantConn] Models loaded for: ${dbName}`);

      return conn;
    } catch (error) {
      console.error(`❌ [TenantConn] Critical error for ${domain}:`, error.message);
      delete connections[domain];
      throw error;
    } finally {
      delete connectionPromises[domain];
    }
  })();

  return connectionPromises[domain];
}

/**
 * Close all active connections
 */
async function closeAllConnections() {
  const domains = Object.keys(connections);
  const closingPromises = domains.map(async (domain) => {
    try {
      const conn = connections[domain];
      if (conn) {
        await conn.close();
      }
    } catch (err) {
      // Ignore errors
    } finally {
      delete connections[domain];
    }
  });
  await Promise.all(closingPromises);
}

module.exports = { getTenantConnection, closeAllConnections };
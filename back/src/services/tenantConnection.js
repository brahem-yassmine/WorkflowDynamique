// back/src/services/tenantConnection.js
const mongoose = require('mongoose');

// Connection cache
const connections = {};
const pendingConnections = {}; // Cache to track in-flight connection attempts

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
  if (pendingConnections[domain]) {
    console.log(`⏳ [TenantConn] Waiting for ongoing connection for: ${domain}`);
    return pendingConnections[domain];
  }

  // 3. Start a new connection process
  pendingConnections[domain] = (async () => {
    try {
      // Check cache again
      if (connections[domain]) {
        if (connections[domain].readyState === 1) return connections[domain];
        if (connections[domain].readyState !== 2) {
          delete connections[domain];
        }
      }

      // 3.1 Robust URI resolution: Use MONGO_URI, or derive from MASTER_DB_URI, or default to localhost
      let baseUri = process.env.MONGO_URI;
      if (!baseUri && process.env.MASTER_DB_URI) {
        // Strip the database name from the end of MASTER_DB_URI
        baseUri = process.env.MASTER_DB_URI.substring(0, process.env.MASTER_DB_URI.lastIndexOf('/'));
      }
      if (!baseUri) baseUri = 'mongodb://localhost:27017';

      const uri = `${baseUri}/${dbName}`;
      console.log(`🔌 [TenantConn] Attempting connection to: ${uri.replace(/\/\/.*@/, '//****:****@')}`); // Shield sensitive info

      const conn = mongoose.createConnection(uri, {
        serverSelectionTimeoutMS: 15000,
        connectTimeoutMS: 15000,
        heartbeatFrequencyMS: 10000,
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
      require('../models/tenant/TaskReport')(conn);
      require('../models/tenant/MessageTemplate')(conn);
      require('../models/tenant/module.model')(conn);
      require('../models/tenant/QuickAction')(conn);

      console.log(`📦 [TenantConn] Models loaded for: ${dbName}`);

      return conn;
    } catch (error) {
      console.error(`❌ [TenantConn] Critical connection failure for tenant domain "${domain}":`);
      console.error(`   - Target DB: ${dbName}`);
      console.error(`   - Error Name: ${error.name}`);
      console.error(`   - Error Message: ${error.message}`);
      if (error.reason) console.error(`   - Reason:`, error.reason);
      
      delete connections[domain];
      throw error;
    } finally {
      delete pendingConnections[domain];
    }
  })();

  return pendingConnections[domain];
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
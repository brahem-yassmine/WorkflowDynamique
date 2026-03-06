// back/src/services/tenantConnection.js
const mongoose = require('mongoose');

// Connection cache (stores Promises)
const connectionPromises = {};

/**
 * Get or create a connection for a specific tenant
 * @param {string} domain - Tenant domain/slug
 * @param {string} dbName - Tenant database name
 */
async function getTenantConnection(domain, dbName) {
  // Check if there's already an existing promise for this connection
  if (connectionPromises[domain]) {
    try {
      const conn = await connectionPromises[domain];
      if (conn.readyState === 1) {
        return conn;
      }
      // If the connection exists but is not ready, we clear it and recreate it (unlikely)
      delete connectionPromises[domain];
    } catch (err) {
      // If the promise failed, clear it and retry
      delete connectionPromises[domain];
    }
  }

  // Create a new initialization promise
  const initPromise = (async () => {
    // Connection URI
    const baseUri = process.env.MONGO_URI || 'mongodb://localhost:27017';
    const uri = `${baseUri}/${dbName}`;
    console.log(`🔌 [TenantConn] Opening connection to: ${uri}`);

    // Create new connection
    const conn = mongoose.createConnection(uri, {
      serverSelectionTimeoutMS: 10000,
    });

    try {
      // Wait for connection to be open
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error(`Timeout connecting to tenant DB: ${dbName}`)), 15000);
        conn.once('open', () => { clearTimeout(timeout); resolve(); });
        conn.once('error', (err) => { clearTimeout(timeout); reject(err); });
      });

      console.log(`✅ [TenantConn] Connected & registering models: ${dbName}`);

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

      return conn;
    } catch (err) {
      console.error(`❌ [TenantConn] Connection failed for ${dbName}:`, err.message);
      delete connectionPromises[domain];
      if (conn) conn.close().catch(() => { });
      throw err;
    }
  })();

  connectionPromises[domain] = initPromise;
  return initPromise;
}

/**
 * Close all active connections
 */
async function closeAllConnections() {
  const domains = Object.keys(connectionPromises);
  const closingPromises = domains.map(async (domain) => {
    try {
      const conn = await connectionPromises[domain];
      if (conn) {
        await conn.close();
      }
    } catch (err) {
      // Ignore errors during closing
    } finally {
      delete connectionPromises[domain];
    }
  });
  await Promise.all(closingPromises);
}

module.exports = { getTenantConnection, closeAllConnections };
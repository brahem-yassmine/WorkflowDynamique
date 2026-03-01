// back/src/services/tenantConnection.js
const mongoose = require('mongoose');

// Connection cache
const connections = {};

/**
 * Get or create a connection for a specific tenant
 * @param {string} domain - Tenant domain/slug
 * @param {string} dbName - Tenant database name
 */
async function getTenantConnection(domain, dbName) {
  // Check cache
  if (connections[domain]) {
    if (connections[domain].readyState === 1 || connections[domain].readyState === 2) {
      return connections[domain];
    } else {
      console.log(`🔄 [TenantConn] Cache expired/closed for: ${domain}`);
      delete connections[domain];
    }
  }

  // Connection URI
  const baseUri = process.env.MONGO_URI || 'mongodb://localhost:27017';
  const uri = `${baseUri}/${dbName}`;
  console.log(`🔌 [TenantConn] Opening connection to: ${uri}`);

  try {
    // Create new connection with modern options
    const conn = mongoose.createConnection(uri, {
      serverSelectionTimeoutMS: 10000, // Timeout after 10s if can't connect
    });

    // Cache the connection immediately (as it's in connecting state)
    connections[domain] = conn;

    // Wait for connection to be open
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error(`Timeout connecting to tenant DB: ${dbName}`)), 15000);

      conn.once('open', () => {
        clearTimeout(timeout);
        console.log(`✅ [TenantConn] MongoDB connected: ${dbName}`);
        resolve();
      });

      conn.once('error', (err) => {
        clearTimeout(timeout);
        console.error(`❌ [TenantConn] MongoDB connection error for ${dbName}:`, err.message);
        delete connections[domain]; // Remove from cache on failure
        reject(err);
      });
    });

    // ATTACH MODELS
    console.log(`📦 [TenantConn] Loading models for: ${dbName}`);

    // Core Tenant Models
    require('../models/tenant/User')(conn);
    require('../models/tenant/Workflow')(conn);
    require('../models/tenant/DynamicForm')(conn);
    require('../models/tenant/Checklist')(conn);
    require('../models/tenant/FormResponse')(conn);
    require('../models/tenant/Task')(conn);
    require('../models/tenant/Project')(conn);
    require('../models/tenant/role.model')(conn);
    require('../models/tenant/domain.model')(conn);
    require('../models/tenant/department.model')(conn);
    require('../models/tenant/Subscription')(conn);
    require('../models/tenant/WorkflowInstance')(conn);
    require('../models/tenant/ActivityLog')(conn);
    require('../models/tenant/Notification')(conn);
    require('../models/tenant/Board')(conn);

    return conn;
  } catch (error) {
    console.error(`❌ [TenantConn] Critical error for ${domain}:`, error.message);
    delete connections[domain];
    throw error;
  }
}

/**
 * Close all active connections
 */
async function closeAllConnections() {
  const connectionPromises = Object.keys(connections).map(async (domain) => {
    if (connections[domain]) {
      await connections[domain].close();
      delete connections[domain];
    }
  });
  await Promise.all(connectionPromises);
}

module.exports = { getTenantConnection, closeAllConnections };
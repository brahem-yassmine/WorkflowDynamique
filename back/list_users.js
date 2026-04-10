
const mongoose = require('mongoose');
const MASTER_DB_URI = 'mongodb://localhost:27017/workflow_master';

async function getUsers() {
  try {
    const connection = await mongoose.createConnection(MASTER_DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }).asPromise();

    console.log('Connected to master DB');

    // SuperAdmin model
    const superAdminSchema = new mongoose.Schema({ email: String, role: String });
    const SuperAdmin = connection.model('SuperAdmin', superAdminSchema, 'superadmins');
    
    const superAdmins = await SuperAdmin.find({}, 'email role').lean();
    const tenantSchema = new mongoose.Schema({ name: String, domain: String, databaseName: String });
    const Tenant = connection.model('Tenant', tenantSchema, 'tenants');
    const tenants = await Tenant.find({}, 'name domain databaseName').lean();
    console.log('--- Tenants ---');
    console.log(tenants);
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

getUsers();

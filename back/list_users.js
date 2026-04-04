
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
    console.log('--- SuperAdmins ---');
    console.log(superAdmins);

    // Tenant model for finding admin/user emails
    // Let's also look into the tenant databases if possible, but first master.
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

getUsers();

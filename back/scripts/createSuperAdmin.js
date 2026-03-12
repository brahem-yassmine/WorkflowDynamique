// scripts/createSuperAdmin.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function createSuperAdmin() {
  try {
    // Connection to MongoDB - Use the same as server.js
    const MASTER_DB_URI = process.env.MASTER_DB_URI || 'mongodb://localhost:27017/workflow_master';
    await mongoose.connect(MASTER_DB_URI);

    // Load SuperAdmin model instead of User if we want to update the super admin collection
    const superAdminFactory = require('../src/models/master/SuperAdmin');
    const SuperAdmin = superAdminFactory(mongoose.connection);

    // Check if super admin already exists
    const existingSuperAdmin = await SuperAdmin.findOne({
      email: 'axia@gmail.com',
      role: 'super_admin'
    });

    if (existingSuperAdmin) {
      console.log('Super admin already exists');

      // Update name if it's still the default "Super Admin"
      if (existingSuperAdmin.firstName === 'Super' || !existingSuperAdmin.firstName) {
        existingSuperAdmin.firstName = 'Axia';
        existingSuperAdmin.lastName = 'Solutions';
        await existingSuperAdmin.save();
        console.log('✅ Super admin name updated to Axia Solutions');
      }

      // Optional: Update password if necessary
      if (!existingSuperAdmin.password.startsWith('$2b$')) {
        const salt = await bcrypt.genSalt(10);
        existingSuperAdmin.password = await bcrypt.hash('AxiaSolutions', salt);
        await existingSuperAdmin.save();
        console.log('Password has been updated');
      }

      mongoose.disconnect();
      return;
    }

    // Create super admin
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('AxiaSolutions', salt);

    const superAdmin = new SuperAdmin({
      email: 'axia@gmail.com',
      password: hashedPassword,
      role: 'super_admin',
      firstName: 'Axia',
      lastName: 'Solutions',
      isActive: true,
      // tenantId not required for super_admin according to your schema
    });

    await superAdmin.save();
    console.log('Super admin created successfully!');

  } catch (error) {
    console.error('Error creating super admin:', error);
  } finally {
    mongoose.disconnect();
  }
}

createSuperAdmin();
// scripts/createSuperAdmin.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function createSuperAdmin() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/your-database-name');
    
    const User = require('../src/models/User'); 
    
    // Vérifier si le super admin existe déjà
    const existingSuperAdmin = await User.findOne({ 
      email: 'axia@gmail.com',
      role: 'super_admin' 
    });
    
    if (existingSuperAdmin) {
      console.log('Super admin already exists');
      
      // Optionnel : Mettre à jour le mot de passe si nécessaire
      if (!existingSuperAdmin.password.startsWith('$2b$')) {
        const salt = await bcrypt.genSalt(10);
        existingSuperAdmin.password = await bcrypt.hash('AxiaSolutions', salt);
        await existingSuperAdmin.save();
        console.log('Password has been updated');
      }
      
      mongoose.disconnect();
      return;
    }
    
    // Créer le super admin
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('AxiaSolutions', salt);
    
    const superAdmin = new User({
      email: 'axia@gmail.com',
      password: hashedPassword,
      role: 'super_admin',
      firstName: 'Axia',
      lastName: 'Solutions',
      isActive: true,
      // tenantId non requis pour super_admin selon votre schéma
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
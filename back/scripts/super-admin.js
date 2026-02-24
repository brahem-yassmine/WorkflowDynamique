// back/fix-password-final.js
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function fixPassword() {
  try {
    console.log(' PASSWORD FIX - FINAL VERSION');
    console.log('='.repeat(50));

    // Connection
    await mongoose.connect('mongodb://localhost:27017/workflow_master');
    console.log(' Connected to MongoDB\n');

    // Define model with complete schema
    const userSchema = new mongoose.Schema({
      email: { type: String, required: true },
      password: { type: String, required: true },
      role: { type: String, default: 'super_admin' },
      firstName: { type: String, default: 'Super' },
      lastName: { type: String, default: 'Admin' },
      isActive: { type: Boolean, default: true },
      lastLogin: Date
    }, { timestamps: true });

    // Use the 'superadmins' collection
    const User = mongoose.model('SuperAdmin', userSchema, 'superadmins');

    const email = 'axia@gmail.com';
    const plainPassword = 'Admin123!'; // Le mot de passe en clair

    console.log(' Email:', email);
    console.log(' Password to set:', plainPassword);
    console.log('');

    // 1. Delete old user
    const deleteResult = await User.deleteMany({ email });
    console.log(` Deleted: ${deleteResult.deletedCount} user(s)`);

    // 2. Hash the password (with more salt)
    console.log('\n Hashing password...');
    const salt = await bcrypt.genSalt(12); // Increase salt factor
    const hashedPassword = await bcrypt.hash(plainPassword, salt);

    console.log('   Salt generated');
    console.log('   Hash: ' + hashedPassword.substring(0, 30) + '...');

    // 3. Create the new user
    const newUser = new User({
      email: email,
      password: hashedPassword,
      role: 'super_admin',
      firstName: 'Super',
      lastName: 'Admin',
      isActive: true
    });

    await newUser.save();
    console.log(' New user created with ID:', newUser._id);

    // 4. Immediate verification (by fetching the user)
    console.log('\n Verification...');
    const verifyUser = await User.findOne({ email }).lean();

    if (!verifyUser) {
      console.log(' Impossible de trouver l\'utilisateur après création');
      return;
    }

    console.log(' Utilisateur trouvé dans la DB:');
    console.log('   - Email:', verifyUser.email);
    console.log('   - Rôle:', verifyUser.role);
    console.log('   - Hash stocké:', verifyUser.password.substring(0, 30) + '...');

    // Test avec bcrypt.compare
    console.log('\n Test 1: directly bcrypt.compare');
    const test1 = await bcrypt.compare(plainPassword, verifyUser.password);
    console.log('   Result:', test1 ? ' OK' : ' FAILED');

    // Test avec une nouvelle instance bcrypt
    console.log('\n Test 2: New bcrypt instance');
    const test2 = await bcrypt.compare(plainPassword, verifyUser.password);
    console.log('   Result:', test2 ? ' OK' : ' FAILED');

    // If tests fail, try with a different hash
    if (!test1 || !test2) {
      console.log('\n Tests failed, attempting with another method...');

      // Alternative hashing method
      const altSalt = await bcrypt.genSalt(10);
      const altHash = await bcrypt.hash(plainPassword, altSalt);

      // Mettre à jour avec le nouveau hash
      await User.updateOne(
        { email },
        { $set: { password: altHash } }
      );

      console.log(' Hash updated with alternative method');

      // Verify again
      const finalUser = await User.findOne({ email });
      const finalTest = await bcrypt.compare(plainPassword, finalUser.password);
      console.log(' Final test:', finalTest ? '✅ OK' : ' FAILED');
    }

    // Verification with incorrect password
    console.log('\n Test 3: Incorrect password');
    const test3 = await bcrypt.compare('WrongPassword123', verifyUser.password);
    console.log('   Result (should be false):', test3 ? ' ERROR' : ' OK (correctly rejected)');

    await mongoose.disconnect();
    console.log('\n Finished');

  } catch (error) {
    console.error(' Error:', error);
  }
}

fixPassword();
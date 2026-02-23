// back/fix-password-final.js
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function fixPassword() {
  try {
    console.log(' FIX MOT DE PASSE - VERSION FINALE');
    console.log('='.repeat(50));

    // Connexion
    await mongoose.connect('mongodb://localhost:27017/workflow_master');
    console.log(' Connecté à MongoDB\n');

    // Définir le modèle avec le schéma complet
    const userSchema = new mongoose.Schema({
      email: { type: String, required: true },
      password: { type: String, required: true },
      role: { type: String, default: 'super_admin' },
      firstName: { type: String, default: 'Super' },
      lastName: { type: String, default: 'Admin' },
      isActive: { type: Boolean, default: true },
      lastLogin: Date
    }, { timestamps: true });

    // Utiliser la collection 'superadmins'
    const User = mongoose.model('SuperAdmin', userSchema, 'superadmins');

    const email = 'axia@gmail.com';
    const plainPassword = 'Admin123!'; // Le mot de passe en clair

    console.log(' Email:', email);
    console.log(' Mot de passe à définir:', plainPassword);
    console.log('');

    // 1. Supprimer l'ancien utilisateur
    const deleteResult = await User.deleteMany({ email });
    console.log(` Supprimé: ${deleteResult.deletedCount} utilisateur(s)`);

    // 2. Hasher le mot de passe (avec plus de sel)
    console.log('\n Hachage du mot de passe...');
    const salt = await bcrypt.genSalt(12); // Augmenter le facteur de sel
    const hashedPassword = await bcrypt.hash(plainPassword, salt);
    
    console.log('   Salt généré');
    console.log('   Hash: ' + hashedPassword.substring(0, 30) + '...');

    // 3. Créer le nouvel utilisateur
    const newUser = new User({
      email: email,
      password: hashedPassword,
      role: 'super_admin',
      firstName: 'Super',
      lastName: 'Admin',
      isActive: true
    });

    await newUser.save();
    console.log(' Nouvel utilisateur créé avec l\'ID:', newUser._id);

    // 4. Vérification immédiate (en récupérant l'utilisateur)
    console.log('\n Vérification...');
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
    console.log('\n Test 1: bcrypt.compare direct');
    const test1 = await bcrypt.compare(plainPassword, verifyUser.password);
    console.log('   Résultat:', test1 ? ' OK' : ' ÉCHEC');

    // Test avec une nouvelle instance bcrypt
    console.log('\n Test 2: Nouvelle instance bcrypt');
    const test2 = await bcrypt.compare(plainPassword, verifyUser.password);
    console.log('   Résultat:', test2 ? ' OK' : ' ÉCHEC');

    // Si les tests échouent, essayons avec un hash différent
    if (!test1 || !test2) {
      console.log('\n Les tests ont échoué, tentative avec une autre méthode...');
      
      // Méthode alternative de hachage
      const altSalt = await bcrypt.genSalt(10);
      const altHash = await bcrypt.hash(plainPassword, altSalt);
      
      // Mettre à jour avec le nouveau hash
      await User.updateOne(
        { email },
        { $set: { password: altHash } }
      );
      
      console.log(' Hash mis à jour avec méthode alternative');
      
      // Vérifier à nouveau
      const finalUser = await User.findOne({ email });
      const finalTest = await bcrypt.compare(plainPassword, finalUser.password);
      console.log(' Test final:', finalTest ? '✅ OK' : ' ÉCHEC');
    }

    // Vérification avec un mot de passe incorrect
    console.log('\n Test 3: Mot de passe incorrect');
    const test3 = await bcrypt.compare('WrongPassword123', verifyUser.password);
    console.log('   Résultat (devrait être false):', test3 ? ' ERREUR' : ' OK (correctement rejeté)');

    await mongoose.disconnect();
    console.log('\n Terminé');

  } catch (error) {
    console.error(' Erreur:', error);
  }
}

fixPassword();
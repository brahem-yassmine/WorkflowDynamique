// test-db.js
const mongoose = require('mongoose');

async function testConnection() {
  try {
    console.log('🔌 Test de connexion MongoDB...');
    
    const conn = await mongoose.connect('mongodb://localhost:27017/workflow_master', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('✅ Connecté à MongoDB!');
    
    // Définir un modèle simple
    const TestSchema = new mongoose.Schema({
      name: String
    });
    
    const Test = conn.model('Test', TestSchema);
    
    // Tester une requête
    const result = await Test.find();
    console.log('✅ Requête réussie!');
    
    await conn.disconnect();
    console.log('👋 Déconnecté');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testConnection();
// test-db.js
const mongoose = require('mongoose');

async function testConnection() {
  try {
    console.log('🔌 MongoDB connection test...');

    const conn = await mongoose.connect('mongodb://localhost:27017/workflow_master', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('✅ Connected to MongoDB!');

    // Define a simple model
    const TestSchema = new mongoose.Schema({
      name: String
    });

    const Test = conn.model('Test', TestSchema);

    // Test a query
    const result = await Test.find();
    console.log('✅ Query successful!');

    await conn.disconnect();
    console.log('👋 Disconnected');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testConnection();
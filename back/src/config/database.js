const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log(` MongoDB Connected: ${conn.connection.host}`);
    
    // Gestion des erreurs
    mongoose.connection.on('error', (err) => {
      console.error(' MongoDB connection error:', err);

      
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log(' MongoDB disconnected');
    });
    
    // Fermeture propre
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('👋 MongoDB connection closed');
      process.exit(0);
    });
    
  } catch (error) {
    console.error(` MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
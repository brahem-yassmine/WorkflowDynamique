const mongoose = require('mongoose');

async function clean() {
  try {
    const conn = await mongoose.connect('mongodb://localhost:27017/workflow_master');
    const result = await conn.connection.db.collection('logs').deleteMany({
      actionType: { $in: ['LOGIN_FAILED', 'ERROR'] }
    });
    console.log(`Deleted ${result.deletedCount} bad logs`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
clean();

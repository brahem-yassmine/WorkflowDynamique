// back/test-server.js
const express = require('express');
const app = express();

app.get('/api/test', (req, res) => {
  res.json({ message: 'Server OK', time: new Date() });
});

app.get('/api/auth/login', (req, res) => {
  res.json({ message: 'Auth endpoint OK' });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`✅ Test server started on http://localhost:${PORT}`);
  console.log(`📝 Test API: http://localhost:${PORT}/api/test`);
});
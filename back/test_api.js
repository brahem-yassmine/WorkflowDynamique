const http = require('http');

const data = JSON.stringify({
  name: "Test Form",
  description: "Test Desc",
  steps: []
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/forms',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length,
    'x-tenant-id': 'test' // Need a valid tenant ID or we'll mock one or use login
  }
};

const req = http.request(options, (res) => {
  let chunks = '';
  res.on('data', (chunk) => {
    chunks += chunk;
  });
  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Body: ${chunks}`);
  });
});

req.on('error', (error) => {
  console.error(error);
});

req.write(data);
req.end();

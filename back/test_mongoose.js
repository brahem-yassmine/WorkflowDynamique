const http = require('http');

const loginData = JSON.stringify({
  email: 'axia@gmail.com',
  password: 'admin' // I'll assume admin, or I can just login as Amine if I know his credentials.
});

// Actually, I can just use a mongoose script locally to create a form or to see validation error.

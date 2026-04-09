
const jwt = require('jsonwebtoken');
require('dotenv').config();

const secret = process.env.JWT_SECRET || 'votre_secret_jwt';
const payload = {
  id: '69925713c0a840e72645cc24',
  email: 'axia@gmail.com',
  role: 'super_admin',
  tenantId: '69bab43976a66a03d4c5528d'
};

const token = jwt.sign(payload, secret, { expiresIn: '1h' });
console.log(token);

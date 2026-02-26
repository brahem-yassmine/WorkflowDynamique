const jwt = require('jsonwebtoken');
require('dotenv').config();

const secret = process.env.JWT_SECRET || 'votre_secret_jwt';
console.log('Secret used:', secret);

// Simulate a token generation
const token = jwt.sign({ id: 'test' }, secret);
console.log('Generated token:', token);

try {
    const decoded = jwt.verify(token, secret);
    console.log('Verification success:', decoded);
} catch (e) {
    console.error('Verification failed:', e.message);
}

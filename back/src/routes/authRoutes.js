// back/src/routes/authRoutes.js
const express = require('express');
const router = express.Router();

//  Controller imports
const authController = require('../controllers/authController');

//  DEBUG - Display imported methods
console.log('authController content:', Object.keys(authController));
console.log('registerTenant:', typeof authController.registerTenant);
console.log('login:', typeof authController.login);

//  POST Routes (registration and login)
router.post('/register', authController.registerTenant);
router.post('/login', authController.login);

// If you have GET routes, make sure they exist
// router.get('/verify', authController.verifyToken); // Uncomment only if verifyToken exists

module.exports = router;
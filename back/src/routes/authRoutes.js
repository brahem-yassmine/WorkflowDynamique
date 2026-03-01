// back/src/routes/authRoutes.js
const express = require('express');
const router = express.Router();

//  Controller imports
const authController = require('../controllers/authController');

//  DEBUG - Display imported methods
console.log('authController content:', Object.keys(authController));
console.log('registerTenant:', typeof authController.registerTenant);
console.log('login:', typeof authController.login);

const { auth } = require('../middleware/auth');

//  POST Routes (registration, login, password reset)
router.post('/register', authController.registerTenant);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

//  GET Routes
router.get('/profile', auth, authController.getProfile);

// If you have GET routes, make sure they exist
// router.get('/verify', authController.verifyToken); // Uncomment only if verifyToken exists

module.exports = router;
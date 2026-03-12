// back/src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');

//  Controller imports
const authController = require('../controllers/authController');

//  POST Routes (registration, login, password reset)
router.post('/register', authController.registerTenant);
router.post('/register-super-admin', authController.registerSuperAdmin);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

//  GET Routes
router.get('/profile', auth, authController.getProfile);

module.exports = router;
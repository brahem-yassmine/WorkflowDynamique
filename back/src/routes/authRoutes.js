// back/src/routes/authRoutes.js
const express = require('express');
const router = express.Router();

//  Importer le contrôleur
const authController = require('../controllers/authController');

//  VÉRIFICATION - Afficher ce qui est importé
console.log('Contenu de authController:', Object.keys(authController));
console.log('registerTenant:', typeof authController.registerTenant);
console.log('login:', typeof authController.login);

//  Routes POST (pour inscription et connexion)
router.post('/register', authController.registerTenant);
router.post('/login', authController.login);

// Si vous avez des routes GET, assurez-vous qu'elles existent
// router.get('/verify', authController.verifyToken); // À décommenter seulement si verifyToken existe

module.exports = router;
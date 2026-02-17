// back/src/middleware/auth.js
const jwt = require('jsonwebtoken');

// ✅ Vérifie que cette fonction existe et est exportée
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token manquant' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ 
      success: false, 
      message: 'Token invalide' 
    });
  }
};

// ✅ Fonction pour vérifier les rôles
const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Non authentifié' 
      });
    }
    
    if (req.user.role !== role && req.user.role !== 'super_admin') {
      return res.status(403).json({ 
        success: false, 
        message: `Rôle ${role} requis` 
      });
    }
    
    next();
  };
};

// ✅ EXPORTE LES DEUX CORRECTEMENT
module.exports = { auth, requireRole };
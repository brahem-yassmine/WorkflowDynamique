const express = require('express');
const router = express.Router();
const { generateWorkflowFromText, generateFormFromText } = require('../services/ai.service');

// Route : POST /api/ai/generate-workflow
router.post('/generate-workflow', async (req, res) => {
    try {
        const { description } = req.body;
        if (!description) {
            return res.status(400).json({ error: "Veuillez fournir une description." });
        }
        
        const data = await generateWorkflowFromText(description);
        res.json(data);
    } catch (error) {
        console.error("Erreur g\u00E9n\u00E9ration workflow IA:", error);
        res.status(500).json({ error: error.message || "Erreur lors de la g\u00E9n\u00E9ration IA" });
    }
});

// Route : POST /api/ai/generate-form
router.post('/generate-form', async (req, res) => {
    try {
        const { description } = req.body;
        if (!description) {
            return res.status(400).json({ error: "Veuillez fournir une description." });
        }

        const data = await generateFormFromText(description);
        res.json(data);
    } catch (error) {
        console.error("Erreur g\u00E9n\u00E9ration constructeur IA:", error);
        res.status(500).json({ error: error.message || "Erreur lors de la g\u00E9n\u00E9ration IA" });
    }
});

module.exports = router;

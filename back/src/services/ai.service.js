const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialise avec la clé configurée dans back/.env
const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

/**
 * Génère un workflow ReactFlow (nodes, edges) structuré en JSON 
 * à partir d'une description textuelle.
 */
const generateWorkflowFromText = async (description) => {
    if (!genAI) throw new Error("Clé API Gemini manquante dans le backend (.env).");

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `En tant qu'expert en conception de Workflow métier pour la bibliothèque ReactFlow.
Conçois un workflow complet et logique pour la description suivante : "${description}"
Génère une structure VALIDE JSON contenant un tableau 'nodes' et 'edges'.

Règles TRÈS STRICTES pour les noeuds :
1. LE TOUT PREMIER NOEUD DOIT ÊTRE EXACTEMENT : { "id": "1", "type": "start", "position": { "x": 250, "y": 5 }, "data": { "label": "Start" } }.
2. Pour les autres noeuds, le champ "type" DOIT ÊTRE CHOISI PARMI CETTE LISTE EXACTE : "action" (tâche), "condition" (choix), "parallel_split" (départ parallèle), "parallel_join" (fusion parallèle), ou "end" (fin). N'utilise JAMAIS "default".
3. Le champ "data" doit prendre la forme { "label": "Nom de l'action" }.
4. Calcule le "position" { "x": ..., "y": ... } logiquement (les noeuds descendent de 100 ou 150 en 'y' à chaque étape, et s'éloignent en 'x' s'ils sont parallèles).

Règles pour les connexions ('edges') :
- ex: { "id": "edge_1_2", "source": "1", "target": "2" }
- Si le noeud source a le type "condition", l'edge DOIT inclure obligatoirement "sourceHandle": "yes" ou "sourceHandle": "no".

Ne renvoie AUCUN texte autour, STRICTEMENT LE JSON VALIDE.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Nettoyage de la réponse si l'IA ajoute des blocs markdown ```json ... ```
    let cleanJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();

    try {
        return JSON.parse(cleanJson);
    } catch (e) {
        console.error("JSON Error:", cleanJson);
        throw new Error("L'IA n'a pas retourné une structure JSON lisible pour le Workflow.");
    }
};

/**
 * Génère un formulaire JSON structuré depuis un texte.
 */
const generateFormFromText = async (description) => {
    if (!genAI) throw new Error("Clé API Gemini manquante dans le backend (.env).");

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Crée une structure de formulaire informatique pour cet objectif : "${description}".
Génère UNIQUEMENT un tableau JSON. Chaque élément est un champ de formulaire.

Structure requise par champ :
{
  "name": "identifiant_unique_du_champ_sans_espace",
  "label": "Titre Propre du Champ",
  "type": "text|email|number|date|select|textarea|tel",
  "required": true ou false,
  "options": ["Choix 1", "Choix 2"] (Laisser vide si ce n'est pas un 'select')
}

Ne renvoie STRICTEMENT QUE le tableau JSON valide, sans introduction ni conclusion.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    let cleanJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();

    try {
        return JSON.parse(cleanJson);
    } catch (e) {
        console.error("JSON Error:", cleanJson);
        throw new Error("L'IA n'a pas retourné une structure JSON lisible pour le Formulaire.");
    }
};

module.exports = {
    generateWorkflowFromText,
    generateFormFromText
};

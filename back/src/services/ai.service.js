const { GoogleGenerativeAI } = require("@google/generative-ai");

let genAI = null;

function getGenAI() {
    if (!genAI) {
        const path = require('path');
        require('dotenv').config({ path: path.join(__dirname, '../../.env') }); // Force reload from back/.env file
        const apiKey = process.env.GEMINI_API_KEY;
        if (apiKey) {
            genAI = new GoogleGenerativeAI(apiKey);
        }
    }
    // Final nodemon restart trigger
    return genAI;
}

/**
 * Wrapper for AI calls with Exponential Backoff
 */
async function safeAiCall(model, prompt, maxRetries = 5) {
    let delay = 1000; // Start with 1 second
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await model.generateContent(prompt);
        } catch (error) {
            const isRetryable = error.message.includes('503') || error.message.includes('429');
            if (isRetryable && i < maxRetries - 1) {
                console.warn(`[AI SERVICE] Service busy/limit reached. Retrying in ${delay}ms... (Attempt ${i + 1}/${maxRetries})`);
                await new Promise(res => setTimeout(res, delay));
                delay *= 2; // Double the wait time
                continue;
            }
            console.error('[AI SERVICE] Terminal Error:', error.message);
            throw error;
        }
    }
}

/**
 * Generates a structured ReactFlow workflow (nodes, edges) JSON 
 * based on a textural description.
 */
const generateWorkflowFromText = async (description) => {
    const aiInstance = getGenAI();
    if (!aiInstance) throw new Error("Gemini API Key missing in backend configuration (.env).");

    const model = aiInstance.getGenerativeModel({ model: "gemini-flash-latest" });

    const prompt = `As a ReactFlow business workflow architect expert.
Generate a logical and complete workflow for: "${description}"
Output a VALID JSON structure containing 'nodes' and 'edges'.

STRICT NODE RULES:
1. THE FIRST NODE MUST BE EXACTLY: { "id": "1", "type": "START", "position": { "x": 250, "y": 5 }, "data": { "label": "Start" } }.
2. Types MUST be: "TASK", "CONDITION", "parallel_split", "parallel_join", or "END".
3. "data" must be { "label": "Action Name" }.
4. Calculate positions logically (Y increases by 150 each step).

EDGES RULES:
- If source node is "condition", you MUST provide BOTH a "yes" and a "no" outgoing edge.
- Every node except "end" MUST have at least one outgoing edge to ensure the graph is fully connected.

RETURN ONLY VALID JSON. NO MARKDOWN, NO TEXT.`;

    const result = await safeAiCall(model, prompt);
    const responseText = result.response.text();
    
    // Clean response from markdown blocks
    let cleanJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();

    try {
        return JSON.parse(cleanJson);
    } catch (e) {
        console.error("[AI SERVICE] JSON Parsing Error:", cleanJson);
        throw new Error("The AI provided an invalid JSON structure for the Workflow.");
    }
};

/**
 * Generates a structured JSON form from a text description.
 */
const generateFormFromText = async (description) => {
    const aiInstance = getGenAI();
    if (!aiInstance) throw new Error("Gemini API Key missing in backend configuration (.env).");

    const model = aiInstance.getGenerativeModel({ model: "gemini-flash-latest" });

    const prompt = `Create a functional form structure for this purpose: "${description}".
Generate ONLY a JSON array. Each element represents a form field.

Required structure per field:
{
  "name": "snake_case_id",
  "label": "Human Readable Title",
  "type": "text|email|number|date|select|textarea|file",
  "required": true,
  "options": ["Op 1", "Op 2"] (Only if type is select)
}

RETURN ONLY VALID JSON.`;

    const result = await safeAiCall(model, prompt);
    const responseText = result.response.text();
    
    let cleanJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();

    try {
        return JSON.parse(cleanJson);
    } catch (e) {
        console.error("[AI SERVICE] JSON Parsing Error:", cleanJson);
        throw new Error("The AI provided an invalid JSON structure for the Form.");
    }
};

module.exports = {
    generateWorkflowFromText,
    generateFormFromText
};

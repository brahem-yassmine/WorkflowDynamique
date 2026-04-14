// back/scripts/seedQuickActions.js
const mongoose = require('mongoose');
require('dotenv').config();

const SEED_TENANT_DB = 'tenant_buildtechsarl'; // Adjust if needed
const TEMPLATE_ID = '69d8c8d5b497b4ca01777f8f'; // From the check_db output
const ADMIN_ID = '69d8bb70e95108586a4973f7';
const MODULE_ID = '69d8bb70e95108586a4973f5'; // Using tenant ID as a fallback for moduleId if module not found

async function seed() {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017';
    const uri = `${mongoUri}/${SEED_TENANT_DB}`;
    
    console.log(`Connecting to ${uri}...`);
    const conn = await mongoose.createConnection(uri).asPromise();
    
    // Load models
    const QuickAction = require('../src/models/tenant/QuickAction')(conn);
    const Module = require('../src/models/tenant/module.model')(conn);
    const User = require('../src/models/tenant/User')(conn);

    // Find a module
    let module = await Module.findOne();
    const moduleId = module ? module._id : new mongoose.Types.ObjectId();

    const actions = [
        {
            name: "Demande d'Achat",
            key: "purchase_request",
            icon: "ShoppingCart",
            moduleId: moduleId,
            templateId: new mongoose.Types.ObjectId(TEMPLATE_ID),
            description: "Demander l'achat de matériel ou fournitures.",
            formSchema: [
                { id: "productName", type: "text", label: "Nom du produit", placeholder: "Ex: Laptop Dell XPS", required: true },
                { id: "quantity", type: "number", label: "Quantité", placeholder: "1", required: true },
                { id: "budget", type: "number", label: "Budget estimé (€)", placeholder: "1500" },
                { id: "supplier", type: "text", label: "Fournisseur suggéré", placeholder: "Amazon" }
            ],
            createdBy: new mongoose.Types.ObjectId(ADMIN_ID)
        },
        {
            name: "Demande de Congés",
            key: "leave_request",
            icon: "Calendar",
            moduleId: moduleId,
            templateId: new mongoose.Types.ObjectId(TEMPLATE_ID),
            description: "Soumettre une demande d'absence ou de vacances.",
            formSchema: [
                { id: "startDate", type: "date", label: "Date de début", required: true },
                { id: "endDate", type: "date", label: "Date de fin", required: true },
                { id: "reason", type: "select", label: "Motif", options: ["Vacances", "Maladie", "Raison Personnelle"], required: true },
                { id: "comments", type: "textarea", label: "Commentaires supplémentaires" }
            ],
            createdBy: new mongoose.Types.ObjectId(ADMIN_ID)
        },
        {
            name: "Maintenance Informatique",
            key: "it_support",
            icon: "Wrench",
            moduleId: moduleId,
            templateId: new mongoose.Types.ObjectId(TEMPLATE_ID),
            description: "Signaler un problème technique ou matériel.",
            formSchema: [
                { id: "issueType", type: "select", label: "Type de problème", options: ["Matériel", "Logiciel", "Réseau", "Accès"], required: true },
                { id: "urgency", type: "select", label: "Urgence", options: ["Basse", "Moyenne", "Haute", "Critique"], required: true },
                { id: "description", type: "textarea", label: "Description du problème", required: true }
            ],
            createdBy: new mongoose.Types.ObjectId(ADMIN_ID)
        }
    ];

    console.log('Cleaning existing QuickActions...');
    await QuickAction.deleteMany({});

    console.log('Seeding QuickActions...');
    await QuickAction.insertMany(actions);

    console.log('✅ Seed successful!');
    await conn.close();
}

seed().catch(err => {
    console.error(err);
    process.exit(1);
});

// back/test-form-db.js
const mongoose = require('mongoose');
require('dotenv').config();

// Charger les modèles
const DynamicFormFn = require('./src/models/tenant/DynamicForm');

async function testFormDatabase() {
    const MONGODB_URI = process.env.MASTER_DB_URI || 'mongodb://localhost:27017/workflow_test_tenant';

    try {
        console.log('🔄 Tentative de connexion à la base de test...');
        const conn = await mongoose.createConnection(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        }).asPromise();

        console.log('✅ Connecté à MongoDB!');

        // Initialiser le modèle avec la connexion
        const DynamicForm = DynamicFormFn(conn);
        console.log('📝 Modèle DynamicForm initialisé.');

        // 1. Création d'un formulaire de test
        const testForm = new DynamicForm({
            name: "Formulaire de Test",
            description: "Un test pour vérifier la structure de la base de données",
            steps: [
                {
                    id: "step-1",
                    title: "Informations Générales",
                    fields: [
                        {
                            id: "field-1",
                            type: "text",
                            label: "Nom complet",
                            placeholder: "Saisir votre nom...",
                            required: true,
                            width: "full"
                        },
                        {
                            id: "field-2",
                            type: "email",
                            label: "Email",
                            placeholder: "exemple@mail.com",
                            width: "half"
                        }
                    ]
                }
            ],
            createdBy: new mongoose.Types.ObjectId(), // ID fictif
            status: "draft"
        });

        console.log('💾 Sauvegarde du formulaire de test...');
        const savedForm = await testForm.save();
        console.log('✅ Formulaire sauvegardé avec succès ID:', savedForm._id);

        // 2. Lecture du formulaire
        console.log('🔍 Recherche du formulaire...');
        const foundForm = await DynamicForm.findById(savedForm._id);
        console.log('✅ Formulaire trouvé:', foundForm.name);
        console.log('📊 Nombre d\'étapes:', foundForm.steps.length);
        console.log('📋 Champs dans l\'étape 1:', foundForm.steps[0].fields.map(f => f.label).join(', '));

        // 3. Nettoyage (optionnel)
        // await DynamicForm.deleteOne({ _id: savedForm._id });
        // console.log('🗑️ Formulaire de test supprimé.');

        await conn.close();
        console.log('👋 Connexion fermée. Test RÉUSSI!');

    } catch (error) {
        console.error('❌ Erreur pendant le test:', error);
    }
}

testFormDatabase();

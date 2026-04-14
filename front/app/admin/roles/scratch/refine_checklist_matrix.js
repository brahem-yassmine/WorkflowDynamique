
const fs = require('fs');
const path = require('path');

const targetPath = 'c:\\Users\\oumei\\PFE\\WorkflowDynamique\\front\\app\\admin\\roles\\page.tsx';

try {
    let content = fs.readFileSync(targetPath, 'utf8');

    // Target the specific return line in the Checklist filter
    const oldReturn = "return p.name === 'CHECKLIST_VIEW' || p.name === 'CHECKLIST_DELETE';";
    const newReturn = "return p.name === 'CHECKLIST_VIEW' || p.name === 'CHECKLIST_DELETE' || p.name === 'CHECKLIST_MANAGE_STATUS';";
    
    if (content.indexOf(oldReturn) === -1) {
        console.error("❌ Could not find target string. Indentation or characters might be different.");
        process.exit(1);
    }

    content = content.replace(oldReturn, newReturn);

    fs.writeFileSync(targetPath, content, 'utf8');
    console.log("✅ Checklist Matrix refined successfully to include Manage Status.");
    
} catch (err) {
    console.error("❌ Error processing file:", err);
    process.exit(1);
}

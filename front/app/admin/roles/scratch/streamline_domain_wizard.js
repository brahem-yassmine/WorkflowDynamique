
const fs = require('fs');
const path = require('path');

const targetPath = 'c:\\Users\\oumei\\PFE\\WorkflowDynamique\\front\\app\\admin\\roles\\page.tsx';

try {
    let content = fs.readFileSync(targetPath, 'utf8');

    // 1. Update Header Titles
    content = content.replace(
        /\{domainCreateWizardStep === 0 \? "Module Permissions" : domainCreateWizardStep === 1 \? "Template Scope" : "Add Template Detail Scope"\}/g,
        '{domainCreateWizardStep === 0 ? "Module Permissions" : "Template Scope"}'
    );

    // 2. Update Header Subtitles
    content = content.replace(
        /\{domainCreateWizardStep === 0 \? "Step 1: Module Scope Matrix" : domainCreateWizardStep === 1 \? "Step 2: Template Creation Scope" : "Step 3: Advanced Template Rights"\}/g,
        '{domainCreateWizardStep === 0 ? "Step 1: Module Scope Matrix" : "Step 2: Template Creation Scope"}'
    );

    // 3. Update Progress Bar
    content = content.replace(
        /animate=\{\{ width: domainCreateWizardStep === 0 \? "33%" : domainCreateWizardStep === 1 \? "66%" : "100%" \}\}/g,
        'animate={{ width: domainCreateWizardStep === 0 ? "50%" : "100%" }}'
    );

    // 4. Update Modal Content Header
    content = content.replace(
        /Available \{domainCreateWizardStep === 0 \? "Module" : domainCreateWizardStep === 1 \? "Template" : "Detail"\} Actions/g,
        'Available {domainCreateWizardStep === 0 ? "Module" : "Template"} Actions'
    );

    // 5. Update Mapping and Selection Logic
    content = content.replace(
        /\(domainCreateWizardStep === 0 \? MODULE_PERMISSIONS_OPTIONS : domainCreateWizardStep === 1 \? WORKFLOW_PERMISSIONS_OPTIONS : TEMPLATE_DETAIL_OPTIONS\)/g,
        '(domainCreateWizardStep === 0 ? MODULE_PERMISSIONS_OPTIONS : WORKFLOW_PERMISSIONS_OPTIONS)'
    );
    content = content.replace(
        /\(domainCreateWizardStep === 0 \? selectedDomainPermissions : domainCreateWizardStep === 1 \? selectedModulePermissions : selectedTemplatePermissions\)/g,
        '(domainCreateWizardStep === 0 ? selectedDomainPermissions : selectedModulePermissions)'
    );

    // 6. Update Content Descriptions
    content = content.replace(
        /\{domainCreateWizardStep === 0 \? `Can \$\{option\} modules in this domain` : domainCreateWizardStep === 1 \? `Can \$\{option\} in this scope` : `Can \$\{option\} template details`\}/g,
        '{domainCreateWizardStep === 0 ? `Can ${option} modules in this domain` : `Can ${option} in this scope`}'
    );

    // 7. Update Footer Navigation Condition
    content = content.replace(
        /\{\(\(domainCreateWizardStep === 0 && selectedDomainPermissions.includes\('add template'\)\) \|\| \(domainCreateWizardStep === 1 && selectedModulePermissions.includes\('add'\)\)\) \? \(/g,
        '{(domainCreateWizardStep === 0 && selectedDomainPermissions.includes(\'add template\')) ? ('
    );

    // 8. Update onChange Logic
    const oldOnChange = 'if (domainCreateWizardStep === 0) { setSelectedDomainPermissions(prev => prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option]); } else if (domainCreateWizardStep === 1) { setSelectedModulePermissions(prev => prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option]); } else { setSelectedTemplatePermissions(prev => prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option]); }';
    const newOnChange = 'if (domainCreateWizardStep === 0) { setSelectedDomainPermissions(prev => prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option]); } else { setSelectedModulePermissions(prev => prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option]); }';
    content = content.replace(oldOnChange, newOnChange);

    fs.writeFileSync(targetPath, content, 'utf8');
    console.log("✅ Domain Wizard streamlined successfully using Node.js.");
    
} catch (err) {
    console.error("❌ Error processing file:", err);
    process.exit(1);
}

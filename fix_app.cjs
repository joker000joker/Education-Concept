const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Remove AdminPaidEbooksPage from dynamic import block if it's there
content = content.replace("AdminPaidEbooksPage, ", "");

// Add standalone import
if (!content.includes("import { AdminPaidEbooksPage } from './pages/admin/AdminPaidEbooksPage';")) {
  content = content.replace(
    "import { AdminWhatsAppPage } from './pages/admin/AdminWhatsAppPage';",
    "import { AdminWhatsAppPage } from './pages/admin/AdminWhatsAppPage';\nimport { AdminPaidEbooksPage } from './pages/admin/AdminPaidEbooksPage';"
  );
}

fs.writeFileSync('src/App.tsx', content);

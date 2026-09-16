const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Ensure import AdminPaidEbooksPage
if (!content.includes("import { AdminPaidEbooksPage } from './pages/admin/AdminPaidEbooksPage';")) {
  content = content.replace(
    "import { AdminFreeEbooksPage, AdminCurrentAffairsPage, AdminExamPatternPage, AdminStudyResourcesPage, AdminQuestionsPage, AdminTestPassPage, AdminBannersPage, AdminRecommendationsPage } from './pages/admin/AdminDynamicPages';",
    "import { AdminFreeEbooksPage, AdminCurrentAffairsPage, AdminExamPatternPage, AdminStudyResourcesPage, AdminQuestionsPage, AdminTestPassPage, AdminBannersPage, AdminRecommendationsPage } from './pages/admin/AdminDynamicPages';\nimport { AdminPaidEbooksPage } from './pages/admin/AdminPaidEbooksPage';"
  );
  
  // also check if AdminPaidEbooksPage is still imported from AdminDynamicPages
  content = content.replace(
    "import { AdminPaidEbooksPage, AdminFreeEbooksPage,",
    "import { AdminFreeEbooksPage,"
  );
  content = content.replace(
    "import { AdminPaidEbooksPage } from './pages/admin/AdminDynamicPages';",
    ""
  );

  fs.writeFileSync('src/App.tsx', content);
}

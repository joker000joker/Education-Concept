const fs = require('fs');
let appTsx = fs.readFileSync('src/App.tsx', 'utf8');

// Insert imports
const imports = `
import { 
  AdminPaidEbooksPage, AdminFreeEbooksPage, AdminCurrentAffairsPage, 
  AdminExamPatternPage, AdminStudyResourcesPage, AdminQuestionsPage,
  AdminTestsPage, AdminTestPassPage, AdminBannersPage, AdminRecommendationsPage
} from './pages/admin/AdminDynamicPages';
`;

appTsx = appTsx.replace("import { AdminUploadPage } from './pages/admin/AdminUploadPage';", "import { AdminUploadPage } from './pages/admin/AdminUploadPage';\n" + imports);

// Replace the previous dummy routes we added
const searchString = `{/* Admin Management Routes - Reusing Existing Tables as much as possible for now */}
                <Route path="paid-ebooks" element={<AdminNotesPage />} />
                <Route path="free-ebooks" element={<AdminNotesPage />} />
                <Route path="current-affairs" element={<AdminNotesPage />} />
                <Route path="exam-pattern" element={<AdminNotesPage />} />
                <Route path="study-resources" element={<AdminNotesPage />} />
                
                {/* Placeholder routes for new features to prevent 404 */}
                <Route path="test-dashboard" element={<div className="p-8 text-center text-slate-500">Test Dashboard Module (Coming Soon)</div>} />
                <Route path="question-bank" element={<div className="p-8 text-center text-slate-500">Question Bank Module (Coming Soon)</div>} />
                <Route path="daily-quiz" element={<div className="p-8 text-center text-slate-500">Daily Quiz Module (Coming Soon)</div>} />
                <Route path="chapter-test" element={<div className="p-8 text-center text-slate-500">Chapter Wise Test Module (Coming Soon)</div>} />
                <Route path="sectional-test" element={<div className="p-8 text-center text-slate-500">Sectional Test Module (Coming Soon)</div>} />
                <Route path="test-pass" element={<div className="p-8 text-center text-slate-500">Test Pass Module (Coming Soon)</div>} />
                <Route path="live-test" element={<div className="p-8 text-center text-slate-500">Live Test Module (Coming Soon)</div>} />
                <Route path="create-test" element={<div className="p-8 text-center text-slate-500">Create Test Module (Coming Soon)</div>} />
                <Route path="banners" element={<div className="p-8 text-center text-slate-500">Banners Module (Coming Soon)</div>} />
                <Route path="recommendations" element={<div className="p-8 text-center text-slate-500">Recommendations Module (Coming Soon)</div>} />
                <Route path="orders" element={<div className="p-8 text-center text-slate-500">Orders Module (Coming Soon)</div>} />
                <Route path="analytics" element={<div className="p-8 text-center text-slate-500">Analytics Module (Coming Soon)</div>} />
                <Route path="whatsapp" element={<div className="p-8 text-center text-slate-500">WhatsApp Management (Coming Soon)</div>} />
                <Route path="settings" element={<div className="p-8 text-center text-slate-500">Website Settings (Coming Soon)</div>} />`;

const newRoutes = `{/* Admin Dynamic Content Routes */}
                <Route path="paid-ebooks" element={<AdminPaidEbooksPage />} />
                <Route path="free-ebooks" element={<AdminFreeEbooksPage />} />
                <Route path="current-affairs" element={<AdminCurrentAffairsPage />} />
                <Route path="exam-pattern" element={<AdminExamPatternPage />} />
                <Route path="study-resources" element={<AdminStudyResourcesPage />} />
                
                {/* EC Test Routes */}
                <Route path="test-dashboard" element={<div className="p-8 text-center text-slate-500">Test Dashboard Module (Coming Soon)</div>} />
                <Route path="question-bank" element={<AdminQuestionsPage />} />
                <Route path="daily-quiz" element={<AdminTestsPage />} />
                <Route path="chapter-test" element={<AdminTestsPage />} />
                <Route path="sectional-test" element={<AdminTestsPage />} />
                <Route path="test-pass" element={<AdminTestPassPage />} />
                <Route path="live-test" element={<AdminTestsPage />} />
                <Route path="create-test" element={<AdminTestsPage />} />
                
                {/* Other Admin Routes */}
                <Route path="banners" element={<AdminBannersPage />} />
                <Route path="recommendations" element={<AdminRecommendationsPage />} />
                <Route path="orders" element={<div className="p-8 text-center text-slate-500">Orders / Purchases Module (Coming Soon)</div>} />
                <Route path="analytics" element={<div className="p-8 text-center text-slate-500">Test Analytics Module (Coming Soon)</div>} />
                <Route path="whatsapp" element={<div className="p-8 text-center text-slate-500">WhatsApp Management (Coming Soon)</div>} />
                <Route path="settings" element={<div className="p-8 text-center text-slate-500">Website Settings (Coming Soon)</div>} />`;

appTsx = appTsx.replace(searchString, newRoutes);
fs.writeFileSync('src/App.tsx', appTsx);
console.log("App.tsx dynamically updated.");

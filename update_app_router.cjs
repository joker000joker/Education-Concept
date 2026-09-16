const fs = require('fs');

let appTsx = fs.readFileSync('src/App.tsx', 'utf8');

const newAdminRoutes = `
                {/* Admin Management Routes - Reusing Existing Tables as much as possible for now */}
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
                <Route path="settings" element={<div className="p-8 text-center text-slate-500">Website Settings (Coming Soon)</div>} />
`;

// Insert after <Route path="upload" element={<AdminUploadPage />} />
appTsx = appTsx.replace(
  '<Route path="upload" element={<AdminUploadPage />} />',
  '<Route path="upload" element={<AdminUploadPage />} />' + newAdminRoutes
);

fs.writeFileSync('src/App.tsx', appTsx);
console.log("App routes updated.");

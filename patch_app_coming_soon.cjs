const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

if (!content.includes('AdminComingSoonPage')) {
  content = content.replace(
    `import { AdminWhatsAppPage } from './pages/admin/AdminWhatsAppPage';`,
    `import { AdminWhatsAppPage } from './pages/admin/AdminWhatsAppPage';\nimport { AdminComingSoonPage } from './pages/admin/AdminComingSoonPage';`
  );
}

content = content.replace(
  `<Route path="test-dashboard" element={<div className="p-8 text-center text-slate-500">Test Dashboard Module (Coming Soon)</div>} />`,
  `<Route path="test-dashboard" element={<AdminComingSoonPage moduleName="Test Dashboard Module" />} />`
);

content = content.replace(
  `<Route path="orders" element={<div className="p-8 text-center text-slate-500">Orders / Purchases Module (Coming Soon)</div>} />`,
  `<Route path="orders" element={<AdminComingSoonPage moduleName="Orders / Purchases Module" />} />`
);

content = content.replace(
  `<Route path="analytics" element={<div className="p-8 text-center text-slate-500">Test Analytics Module (Coming Soon)</div>} />`,
  `<Route path="analytics" element={<AdminComingSoonPage moduleName="Test Analytics Module" />} />`
);

content = content.replace(
  `<Route path="settings" element={<div className="p-8 text-center text-slate-500">Website Settings (Coming Soon)</div>} />`,
  `<Route path="settings" element={<AdminComingSoonPage moduleName="Website Settings" />} />`
);

fs.writeFileSync('src/App.tsx', content);

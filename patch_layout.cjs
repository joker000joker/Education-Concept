const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/AdminLayout.tsx', 'utf8');

// Rename group
content = content.replace(
  `<NavGroup label="EC Notes">`,
  `<NavGroup label="EC Notes / Content Management">`
);

// We can just leave the rest of the nav items as they are grouped or move Banners/Recommendations up.
// Let's move banners and recommendations into EC Notes / Content Management section.
const bannersStr = `<NavItem to="/admin/banners" icon={Image} label="Home Banners" />`;
const recsStr = `<NavItem to="/admin/recommendations" icon={Star} label="Top Recommendations" />`;
const settingsStr = `<NavItem to="/admin/whatsapp" icon={MessageCircle} label="WhatsApp" />`;

// Remove them from their old places
content = content.replace(bannersStr, '');
content = content.replace(recsStr, '');
// Since we removed them, the <NavGroup label="Content"> is empty. Remove it.
content = content.replace(/<NavGroup label="Content">\s*<\/NavGroup>/g, '');

// Insert them into EC Notes / Content Management
content = content.replace(
  `<NavItem to="/admin/study-resources" icon={Library} label="Study Resources" />`,
  `<NavItem to="/admin/study-resources" icon={Library} label="Study Resources" />
            <NavItem to="/admin/banners" icon={Image} label="Home Banners" />
            <NavItem to="/admin/recommendations" icon={Star} label="Top Recommendations" />`
);

// We will leave WhatsApp under Settings, or move it? The prompt says "navigation cards/menu items for all 8 Phase A modules", and the group is "EC Notes / Content Management". WhatsApp is technically a setting. Let's rename Settings to Settings & Config to be safe, or just keep it as Settings. The prompt says "Add a clear 'EC Notes / Content Management' section... Add navigation cards/menu items for all 8 Phase A modules".

fs.writeFileSync('src/pages/admin/AdminLayout.tsx', content);

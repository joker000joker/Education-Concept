const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/AdminUsersPage.tsx', 'utf8');

if (!content.includes('import { BackButton }')) {
  content = content.replace(
    `import { useAuth } from '../../context/AuthContext';`,
    `import { useAuth } from '../../context/AuthContext';\nimport { BackButton } from '../../components/common/BackButton';`
  );
  fs.writeFileSync('src/pages/admin/AdminUsersPage.tsx', content);
}

const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/AdminOverviewPage.tsx', 'utf8');

// Replace all imports of those specific names from react-router-dom
content = content.replace(/import\s+\{[\s\S]*?\}\s+from\s+'react-router-dom';/, "import { Link } from 'react-router-dom';\nimport { Users, Book, Newspaper, CheckSquare, Database, Library, Edit3, Image as ImageIcon } from 'lucide-react';");

content = content.replace(/<Image className/g, '<ImageIcon className');

fs.writeFileSync('src/pages/admin/AdminOverviewPage.tsx', content);

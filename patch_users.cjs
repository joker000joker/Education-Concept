const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/AdminUsersPage.tsx', 'utf8');

if (!content.includes('BackButton')) {
  content = content.replace(
    `import { Users, Mail, Phone, Calendar, Shield, MapPin, Search } from 'lucide-react';`,
    `import { Users, Mail, Phone, Calendar, Shield, MapPin, Search } from 'lucide-react';\nimport { BackButton } from '../../components/common/BackButton';`
  );
}

content = content.replace(
  `  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">`,
  `  return (
    <div className="space-y-6">
      <div className="mb-2">
        <BackButton fallbackTo="/admin" label="Back to Dashboard" forceFallback={true} />
      </div>
      {/* Header & Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">`
);

fs.writeFileSync('src/pages/admin/AdminUsersPage.tsx', content);

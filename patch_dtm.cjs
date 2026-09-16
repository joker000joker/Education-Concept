const fs = require('fs');
let content = fs.readFileSync('src/components/admin/DynamicTableManager.tsx', 'utf8');

// Ensure BackButton import
if (!content.includes('BackButton')) {
  content = content.replace(
    `import { useAuth } from '../../context/AuthContext';`,
    `import { useAuth } from '../../context/AuthContext';\nimport { BackButton } from '../../components/common/BackButton';`
  );
}

content = content.replace(
  `  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>`,
  `  return (
    <div className="space-y-6">
      <div className="mb-2">
        <BackButton fallbackTo="/admin" label="Back to Dashboard" forceFallback={true} />
      </div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>`
);

fs.writeFileSync('src/components/admin/DynamicTableManager.tsx', content);

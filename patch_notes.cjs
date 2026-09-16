const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/AdminNotesPage.tsx', 'utf8');

if (!content.includes('BackButton')) {
  content = content.replace(
    `import { ConfirmationModal } from '../../components/common/ConfirmationModal';`,
    `import { ConfirmationModal } from '../../components/common/ConfirmationModal';\nimport { BackButton } from '../../components/common/BackButton';`
  );
}

content = content.replace(
  `  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">`,
  `  return (
    <div className="space-y-6">
      <div className="mb-2">
        <BackButton fallbackTo="/admin" label="Back to Dashboard" forceFallback={true} />
      </div>
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">`
);

fs.writeFileSync('src/pages/admin/AdminNotesPage.tsx', content);

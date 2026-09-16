const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/AdminOverviewPage.tsx', 'utf8');

content = content.replace(
  `import { ConfirmationModal } from '../../components/common/ConfirmationModal';`,
  `import { ConfirmationModal } from '../../components/common/ConfirmationModal';\nimport { BackButton } from '../../components/common/BackButton';`
);

content = content.replace(
  `    <div className="space-y-6 sm:space-y-8">
      {/* Top Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">`,
  `    <div className="space-y-6 sm:space-y-8">
      {/* Top Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="mb-4">
            <BackButton fallbackTo="/" label="Back to Homepage" forceFallback={true} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">`
);

fs.writeFileSync('src/pages/admin/AdminOverviewPage.tsx', content);

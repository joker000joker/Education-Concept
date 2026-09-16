const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/AdminUploadPage.tsx', 'utf8');

if (!content.includes('BackButton')) {
  content = content.replace(
    `import { useNavigate } from 'react-router-dom';`,
    `import { useNavigate } from 'react-router-dom';\nimport { BackButton } from '../../components/common/BackButton';`
  );
}

content = content.replace(
  `  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">`,
  `  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="mb-2">
        <BackButton fallbackTo="/admin/notes" label="Back to Notes" forceFallback={true} />
      </div>
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">`
);

fs.writeFileSync('src/pages/admin/AdminUploadPage.tsx', content);

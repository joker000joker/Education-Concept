const fs = require('fs');
let code = fs.readFileSync('src/pages/PdfReaderPage.tsx', 'utf8');

code = code.replace(
  `import { fetchNoteById, getSecurePdfUrl, downloadNotePdf, formatBytes } from '../lib/supabase';`,
  `import { fetchNoteById, fetchFreeEbookById, fetchCurrentAffairById, getSecurePdfUrl, downloadNotePdf, formatBytes } from '../lib/supabase';`
);

code = code.replace(
  `import { useParams, Link, useNavigate } from 'react-router-dom';`,
  `import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';`
);

code = code.replace(
  `  const { id } = useParams<{ id: string }>();\n  const navigate = useNavigate();`,
  `  const { id } = useParams<{ id: string }>();\n  const navigate = useNavigate();\n  const [searchParams] = useSearchParams();\n  const type = searchParams.get('type');`
);

code = code.replace(
  `        // Fetch note metadata\n        const noteData = await fetchNoteById(id);`,
  `        // Fetch note metadata\n        let noteData;\n        if (type === 'current-affairs') {\n          noteData = await fetchCurrentAffairById(id);\n          if (noteData) noteData.category = { name: 'Current Affairs' };\n        } else if (type === 'free-ebooks') {\n          noteData = await fetchFreeEbookById(id);\n          if (noteData) noteData.category = { name: noteData.category || 'Free E-Book' };\n        } else {\n          noteData = await fetchNoteById(id);\n        }`
);

fs.writeFileSync('src/pages/PdfReaderPage.tsx', code);
console.log('Patched');

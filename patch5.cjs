const fs = require('fs');
let code = fs.readFileSync('src/pages/FreeEbooksListingPage.tsx', 'utf8');

code = code.replace(
  `  const handleRead = (ebook: FreeEbook) => {
    if (ebook.file_path) {
      navigate(\`/reader/\${encodeURIComponent(ebook.file_path)}\`);
    }
  };`,
  `  const handleRead = (ebook: FreeEbook) => {
    if (ebook.file_path) {
      navigate(\`/notes/\${ebook.id}?type=free-ebooks\`);
    }
  };`
);

fs.writeFileSync('src/pages/FreeEbooksListingPage.tsx', code);
console.log('Patched');

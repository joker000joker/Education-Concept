const fs = require('fs');
let code = fs.readFileSync('src/pages/CurrentAffairsPage.tsx', 'utf8');

const targetStart = '  const handleRead = async (item: CurrentAffair) => {';
const targetEnd = '  };';
const startIndex = code.indexOf(targetStart);
const endIndex = code.indexOf(targetEnd, startIndex) + targetEnd.length;

if (startIndex !== -1 && endIndex !== -1) {
  const newHandleRead = `  const handleRead = async (item: CurrentAffair) => {
    if (!item.file_path) {
      toast.error('PDF file location is unavailable.');
      return;
    }
    navigate(\`/notes/\${item.id}?type=current-affairs\`);
  };`;
  code = code.substring(0, startIndex) + newHandleRead + code.substring(endIndex);
  fs.writeFileSync('src/pages/CurrentAffairsPage.tsx', code);
  console.log('Patched CurrentAffairsPage');
} else {
  console.log('Target not found in CurrentAffairsPage');
}

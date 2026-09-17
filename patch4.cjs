const fs = require('fs');
let code = fs.readFileSync('src/pages/CurrentAffairsPage.tsx', 'utf8');

code = code.replace(
  `  const handleRead = async (item: CurrentAffair) => {
    if (!item.file_path) {
      toast.error('PDF file location is unavailable.');
      return;
    }
    try {
      setActionLoadingId(item.id);
      setActionType('read');
      toast.info('Opening document...');
      
      const signedUrl = await getSecurePdfUrl(item.file_path, 3600);
      if (signedUrl) {
        window.open(signedUrl, '_blank', 'noopener,noreferrer');
      } else {
        toast.error('Unable to generate secure view link. Please try again.');
      }
    } catch (err: any) {
      console.error('Read error:', err);
      toast.error('Unable to open document: ' + (err.message || 'Error occurred'));
    } finally {
      setActionLoadingId(null);
      setActionType(null);
    }
  };`,
  `  const handleRead = async (item: CurrentAffair) => {
    if (!item.file_path) {
      toast.error('PDF file location is unavailable.');
      return;
    }
    navigate(\`/notes/\${item.id}?type=current-affairs\`);
  };`
);

fs.writeFileSync('src/pages/CurrentAffairsPage.tsx', code);
console.log('Patched');

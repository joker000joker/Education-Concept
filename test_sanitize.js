const STORAGE_BUCKET = 'pdf-notes';
function sanitizeFilePath(filePath) {
  if (!filePath) return filePath;
  let cleanPath = filePath;
  
  if (cleanPath.includes('/storage/v1/object/public/')) {
    cleanPath = cleanPath.split('/storage/v1/object/public/')[1];
  } else if (cleanPath.includes('/storage/v1/object/sign/')) {
    cleanPath = cleanPath.split('/storage/v1/object/sign/')[1];
  }
  
  // Remove any query parameters (like ?token=...)
  if (cleanPath.includes('?')) {
    cleanPath = cleanPath.split('?')[0];
  }
  
  // Decode URI components (e.g. %20 -> space)
  try {
    cleanPath = decodeURIComponent(cleanPath);
  } catch (e) {
    // Ignore malformed URIs
  }
  
  cleanPath = cleanPath.replace(/^\/+/, "");
  if (cleanPath.startsWith(STORAGE_BUCKET + '/')) {
    cleanPath = cleanPath.substring(STORAGE_BUCKET.length + 1);
  }
  return cleanPath;
}

console.log("Test:", sanitizeFilePath("notes/1789386456486-04pshd-TIME__SPEED___DISTANCE_PRACTICE_SHEET.pdf"));

const fs = require('fs');
let content = fs.readFileSync('src/lib/supabase.ts', 'utf8');

const newCode = `
// Image upload helper
export async function uploadImageFile(
  file: File,
  prefix = 'covers'
): Promise<{ filePath: string; fileName: string; fileSize: number }> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase credentials are not configured.');
  }

  // Sanitize filename and create unique storage path
  const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const uniqueId = \`\${Date.now()}-\${Math.random().toString(36).substring(2, 8)}\`;
  const filePath = \`\${prefix}/\${uniqueId}-\${cleanName}\`;

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    });

  if (uploadError) {
    throw new Error(\`Upload error: \${uploadError.message}\`);
  }

  return {
    filePath,
    fileName: file.name,
    fileSize: file.size,
  };
}

// Paid E-Books Interface
export interface PaidEbook {
  id: number;
  title: string;
  description: string | null;
  category: string;
  price: number;
  file_path: string;
  file_name: string;
  file_size: number;
  cover_image_path: string | null;
  published: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}
`;

if (!content.includes('uploadImageFile')) {
  content = content + '\\n' + newCode;
  fs.writeFileSync('src/lib/supabase.ts', content);
}

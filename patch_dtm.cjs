const fs = require('fs');
let code = fs.readFileSync('src/components/admin/DynamicTableManager.tsx', 'utf8');

// Add import
code = code.replace(
  `import { BackButton } from '../../components/common/BackButton';`,
  `import { BackButton } from '../../components/common/BackButton';\nimport { ConfirmationModal } from '../../components/common/ConfirmationModal';`
);

// Add state
code = code.replace(
  `  const [saving, setSaving] = useState(false);`,
  `  const [saving, setSaving] = useState(false);\n  const [deletingItem, setDeletingItem] = useState<any | null>(null);\n  const [isDeleting, setIsDeleting] = useState(false);`
);

// Replace handleDelete
const targetStart = '  const handleDelete = async (item: any) => {';
const targetEnd = '  };';
const startIndex = code.indexOf(targetStart);
const endIndex = code.indexOf(targetEnd, startIndex) + targetEnd.length;

const newHandleDelete = `  const handleDeleteClick = (item: any) => {
    if (tableName === 'free_ebooks') {
      setDeletingItem(item);
    } else {
      try {
        if (!window.confirm('Are you sure you want to delete this item?')) return;
        executeDelete(item);
      } catch (err) {
        toast.error("Confirmation blocked by browser. Cannot delete.");
      }
    }
  };

  const executeDelete = async (item: any) => {
    setIsDeleting(true);
    try {
      // If it has files, try to delete them
      for (const field of fields) {
        if (field.type === 'file_pdf' || field.type === 'file_image') {
          if (item[field.name]) {
            await deletePdfFile(item[field.name]).catch(() => {});
          }
        }
      }
      
      const { error } = await supabase.from(tableName).delete().eq(primaryKey, item[primaryKey]);
      if (error) throw error;
      toast.success('Item deleted successfully');
      loadData();
    } catch (e: any) {
      toast.error('Delete failed: ' + e.message);
    } finally {
      setIsDeleting(false);
      setDeletingItem(null);
    }
  };`;

code = code.substring(0, startIndex) + newHandleDelete + code.substring(endIndex);

// Replace onClick={() => handleDelete(item)}
code = code.replace(
  /onClick=\{\(\) => handleDelete\(item\)\}/g,
  `onClick={() => handleDeleteClick(item)}`
);

// Add ConfirmationModal at the end
code = code.replace(
  `    </div>\n  );\n};`,
  `      <ConfirmationModal
        isOpen={Boolean(deletingItem)}
        title={\`Delete \${title}\`}
        message={\`Are you sure you want to permanently delete "\${deletingItem?.title || 'this item'}"? This action cannot be undone.\`}
        confirmLabel="Delete Permanently"
        cancelLabel="Cancel"
        isDangerous={true}
        isLoading={isDeleting}
        onConfirm={() => executeDelete(deletingItem)}
        onClose={() => setDeletingItem(null)}
      />
    </div>
  );
};`
);

fs.writeFileSync('src/components/admin/DynamicTableManager.tsx', code);
console.log('Patched DynamicTableManager');

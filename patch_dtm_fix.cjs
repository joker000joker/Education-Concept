const fs = require('fs');
let code = fs.readFileSync('src/components/admin/DynamicTableManager.tsx', 'utf8');

code = code.replace(
  `      try {
        if (!window.confirm('Are you sure you want to delete this item?')) return;
        executeDelete(item);
      } catch (err) {
        toast.error("Confirmation blocked by browser. Cannot delete.");
      }`,
  `      if (!window.confirm('Are you sure you want to delete this item?')) return;
      executeDelete(item);`
);

fs.writeFileSync('src/components/admin/DynamicTableManager.tsx', code);
console.log('Fixed DynamicTableManager');

const fs = require('fs');
let content = fs.readFileSync('src/components/admin/DynamicTableManager.tsx', 'utf8');

// Undo bad patches if they exist (they shouldn't have done anything because the regex didn't match)
content = content.replace(
  `fields: FieldDef[];
}`,
  `fields: FieldDef[];
  primaryKey?: string;
}`
);

content = content.replace(
  `export const DynamicTableManager: React.FC<Props> = ({ tableName, title, fields }) => {`,
  `export const DynamicTableManager: React.FC<Props> = ({ tableName, title, fields, primaryKey = 'id' }) => {`
);

fs.writeFileSync('src/components/admin/DynamicTableManager.tsx', content);

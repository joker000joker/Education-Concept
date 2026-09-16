const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/AdminOverviewPage.tsx', 'utf8');

// The current lucide-react import in AdminOverviewPage is:
// import { Users, Book, Newspaper, CheckSquare, Database, Library, Edit3, Image as ImageIcon } from 'lucide-react';
// and further down:
// import { FileText, CheckCircle2, FileQuestion, Layers, Upload, ArrowRight, Plus, Search, Filter, Eye, Edit2, Trash2, Calendar, HardDrive, Loader2, RefreshCw, Sparkles, } from 'lucide-react';

// We'll just replace `Book,` with `Book, BookOpen, GraduationCap, Star, MessageCircle,`
content = content.replace(
  `import { Users, Book, Newspaper, CheckSquare, Database, Library, Edit3, Image as ImageIcon } from 'lucide-react';`,
  `import { Users, Book, BookOpen, GraduationCap, Star, MessageCircle, Newspaper, CheckSquare, Database, Library, Edit3, Image as ImageIcon } from 'lucide-react';`
);

fs.writeFileSync('src/pages/admin/AdminOverviewPage.tsx', content);

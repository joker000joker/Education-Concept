const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/AdminOverviewPage.tsx', 'utf8');

// Replace the loadStats function to include the new tables safely
const newLoadStats = `
  const loadStats = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch Students
      const { count: studentCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'user');
        
      // 2. Fetch Notes
      const { count: noteCount } = await supabase
        .from('notes')
        .select('*', { count: 'exact', head: true });

      // Helper for new tables
      const getCount = async (table: string) => {
        const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
        return error ? 0 : (count || 0);
      };

      const [paidEbooks, freeEbooks, currentAffairs, tests, questions] = await Promise.all([
        getCount('paid_ebooks'),
        getCount('free_ebooks'),
        getCount('current_affairs'),
        getCount('tests'),
        getCount('questions')
      ]);

      setStats({
        students: studentCount || 0,
        notes: noteCount || 0,
        ebooks: paidEbooks + freeEbooks,
        currentAffairs: currentAffairs,
        tests: tests,
        questions: questions
      });

    } catch (err) {
      console.error('Error loading stats:', err);
      toast.error('Failed to load dashboard statistics.');
    } finally {
      setLoading(false);
    }
  };
`;

content = content.replace(/const loadStats = async \(\) => \{[\s\S]*?setLoading\(false\);\n    \}\n  \};/, newLoadStats);

// Update the stat cards
const statCardsNew = `<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-8">
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
            <Users className="w-5 h-5" />
          </div>
          <p className="text-xs font-medium text-slate-500 mb-1">Total Students</p>
          <h3 className="text-2xl font-bold text-slate-900">{stats.students}</h3>
        </div>
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
            <FileText className="w-5 h-5" />
          </div>
          <p className="text-xs font-medium text-slate-500 mb-1">Total Notes</p>
          <h3 className="text-2xl font-bold text-slate-900">{stats.notes}</h3>
        </div>
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
            <Book className="w-5 h-5" />
          </div>
          <p className="text-xs font-medium text-slate-500 mb-1">Total E-Books</p>
          <h3 className="text-2xl font-bold text-slate-900">{stats.ebooks || 0}</h3>
        </div>
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
            <Newspaper className="w-5 h-5" />
          </div>
          <p className="text-xs font-medium text-slate-500 mb-1">Current Affairs</p>
          <h3 className="text-2xl font-bold text-slate-900">{stats.currentAffairs || 0}</h3>
        </div>
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
            <CheckSquare className="w-5 h-5" />
          </div>
          <p className="text-xs font-medium text-slate-500 mb-1">Total Tests</p>
          <h3 className="text-2xl font-bold text-slate-900">{stats.tests || 0}</h3>
        </div>
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
            <Database className="w-5 h-5" />
          </div>
          <p className="text-xs font-medium text-slate-500 mb-1">Total Questions</p>
          <h3 className="text-2xl font-bold text-slate-900">{stats.questions || 0}</h3>
        </div>
      </div>
      
      {/* Quick Actions */}
      <h2 className="text-lg font-bold text-slate-900 mb-4">Quick Actions</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-8">
        <Link to="/admin/upload" className="flex flex-col items-center justify-center p-4 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-blue-300 transition-colors text-center group">
          <Upload className="w-6 h-6 text-slate-400 group-hover:text-blue-600 mb-2" />
          <span className="text-xs font-medium text-slate-700 group-hover:text-blue-700">Upload Note</span>
        </Link>
        <Link to="/admin/paid-ebooks" className="flex flex-col items-center justify-center p-4 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-blue-300 transition-colors text-center group">
          <Book className="w-6 h-6 text-slate-400 group-hover:text-blue-600 mb-2" />
          <span className="text-xs font-medium text-slate-700 group-hover:text-blue-700">Add E-Book</span>
        </Link>
        <Link to="/admin/current-affairs" className="flex flex-col items-center justify-center p-4 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-blue-300 transition-colors text-center group">
          <Newspaper className="w-6 h-6 text-slate-400 group-hover:text-blue-600 mb-2" />
          <span className="text-xs font-medium text-slate-700 group-hover:text-blue-700">Add Affairs</span>
        </Link>
        <Link to="/admin/study-resources" className="flex flex-col items-center justify-center p-4 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-blue-300 transition-colors text-center group">
          <Library className="w-6 h-6 text-slate-400 group-hover:text-blue-600 mb-2" />
          <span className="text-xs font-medium text-slate-700 group-hover:text-blue-700">Add Resource</span>
        </Link>
        <Link to="/admin/create-test" className="flex flex-col items-center justify-center p-4 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-blue-300 transition-colors text-center group">
          <Edit3 className="w-6 h-6 text-slate-400 group-hover:text-blue-600 mb-2" />
          <span className="text-xs font-medium text-slate-700 group-hover:text-blue-700">Create Test</span>
        </Link>
        <Link to="/admin/question-bank" className="flex flex-col items-center justify-center p-4 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-blue-300 transition-colors text-center group">
          <Database className="w-6 h-6 text-slate-400 group-hover:text-blue-600 mb-2" />
          <span className="text-xs font-medium text-slate-700 group-hover:text-blue-700">Add Question</span>
        </Link>
        <Link to="/admin/banners" className="flex flex-col items-center justify-center p-4 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-blue-300 transition-colors text-center group">
          <Image className="w-6 h-6 text-slate-400 group-hover:text-blue-600 mb-2" />
          <span className="text-xs font-medium text-slate-700 group-hover:text-blue-700">Manage Banners</span>
        </Link>
      </div>
`;

content = content.replace(/<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">[\s\S]*?\{\/\* Recent Uploads \*\/\}/, statCardsNew + '\n\n      {/* Recent Uploads */}');

// Add missing state for new keys
content = content.replace(
  "const [stats, setStats] = useState({ students: 0, notes: 0 });",
  "const [stats, setStats] = useState({ students: 0, notes: 0, ebooks: 0, currentAffairs: 0, tests: 0, questions: 0 });"
);

// Add missing imports
content = content.replace(
  "import {", 
  "import {\n  Users,\n  Book,\n  Newspaper,\n  CheckSquare,\n  Database,\n  Library,\n  Edit3,\n  Image,\n"
);

fs.writeFileSync('src/pages/admin/AdminOverviewPage.tsx', content);

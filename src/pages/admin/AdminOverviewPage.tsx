import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Users, Book, BookOpen, GraduationCap, Star, MessageCircle, Newspaper, CheckSquare, Database, Library, Edit3, Image as ImageIcon } from 'lucide-react';
import { Note, Category } from '../../types';
import {
  fetchNotes,
  getCategories,
  toggleNotePublishStatus,
  deleteNoteRecord,
  formatBytes,
} from '../../lib/supabase';
import { INITIAL_CATEGORIES } from '../../data/categories';
import { useToast } from '../../context/ToastContext';
import { EditNoteModal } from '../../components/admin/EditNoteModal';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';
import { BackButton } from '../../components/common/BackButton';
import {
  FileText,
  CheckCircle2,
  FileQuestion,
  Layers,
  Upload,
  ArrowRight,
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Calendar,
  HardDrive,
  Loader2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

export const AdminOverviewPage: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [categories, setCategories] = useState<Category[]>(
    INITIAL_CATEGORIES.map((c) => ({ id: c.id, name: c.name }))
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');

  // Modal states
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [deletingNote, setDeletingNote] = useState<Note | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const toast = useToast();

  const loadData = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Admin fetches all notes (published & unpublished drafts)
      const [notesRes, catRes] = await Promise.all([
        fetchNotes({ publishedOnly: false, sortBy: 'newest' }),
        getCategories().catch(() => []),
      ]);

      setNotes(notesRes.notes);
      if (catRes && catRes.length > 0) {
        setCategories(catRes);
      }
      if (isManualRefresh) {
        toast.success('Admin Dashboard data refreshed');
      }
    } catch (err: any) {
      console.error('Error loading admin overview data:', err);
      toast.error('Failed to load notes data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalNotes = notes.length;
  const publishedNotes = notes.filter((n) => n.published).length;
  const draftNotes = notes.filter((n) => !n.published).length;
  const totalCategories = categories.length || 12;

  // Toggle publish / unpublish
  const handleTogglePublish = async (note: Note) => {
    try {
      const next = await toggleNotePublishStatus(note.id, note.published);
      setNotes((prev) =>
        prev.map((n) => (n.id === note.id ? { ...n, published: next } : n))
      );
      toast.success(`Note "${note.title}" ${next ? 'published live for students' : 'moved to private draft'}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update publish status');
    }
  };

  // Delete note and PDF from storage
  const handleConfirmDelete = async () => {
    if (!deletingNote) return;
    try {
      setIsDeleting(true);
      await deleteNoteRecord(deletingNote.id, deletingNote.file_path);
      setNotes((prev) => prev.filter((n) => n.id !== deletingNote.id));
      toast.success(`Note "${deletingNote.title}" and its PDF file have been permanently removed.`);
      setDeletingNote(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete note');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleNoteUpdated = (updatedNote: Note) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === updatedNote.id ? { ...n, ...updatedNote } : n))
    );
  };

  // Filtered notes list
  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesTitle = note.title.toLowerCase().includes(term);
        const matchesDesc = note.description?.toLowerCase().includes(term);
        const matchesFile = note.file_name?.toLowerCase().includes(term);
        if (!matchesTitle && !matchesDesc && !matchesFile) return false;
      }

      // Category filter
      if (selectedCategory !== 'all') {
        if (note.category_id !== parseInt(selectedCategory, 10)) return false;
      }

      // Status filter
      if (statusFilter === 'published' && !note.published) return false;
      if (statusFilter === 'draft' && note.published) return false;

      return true;
    });
  }, [notes, searchTerm, selectedCategory, statusFilter]);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Top Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="mb-4">
            <BackButton fallbackTo="/" label="Back to Homepage" forceFallback={true} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Admin Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Education Concept repository management: upload PDFs to private storage, edit notes, publish live content, and manage subjects.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            id="admin-dashboard-refresh-btn"
            onClick={() => loadData(true)}
            disabled={loading || refreshing}
            className="p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:border-slate-300 shadow-2xs transition-colors flex items-center gap-1.5"
            title="Refresh notes repository"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <Link
            id="admin-dashboard-upload-cta"
            to="/admin/upload"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs shadow-blue-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Upload New PDF</span>
          </Link>
        </div>
      </div>

      
      {/* EC Notes / Content Management Quick Links */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Content Management Modules</h2>
            <p className="text-xs text-slate-500 mt-0.5">Manage all Phase A modules for EC Notes.</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/admin/paid-ebooks" className="flex flex-col items-center justify-center p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-rose-50 hover:border-rose-200 transition-colors group">
            <Book className="w-6 h-6 text-rose-500 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-semibold text-slate-700 group-hover:text-rose-700">Paid E-Books</span>
          </Link>
          <Link to="/admin/free-ebooks" className="flex flex-col items-center justify-center p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-green-50 hover:border-green-200 transition-colors group">
            <BookOpen className="w-6 h-6 text-green-500 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-semibold text-slate-700 group-hover:text-green-700">Free E-Books</span>
          </Link>
          <Link to="/admin/current-affairs" className="flex flex-col items-center justify-center p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 transition-colors group">
            <Newspaper className="w-6 h-6 text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-semibold text-slate-700 group-hover:text-blue-700">Current Affairs</span>
          </Link>
          <Link to="/admin/exam-pattern" className="flex flex-col items-center justify-center p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-amber-50 hover:border-amber-200 transition-colors group">
            <GraduationCap className="w-6 h-6 text-amber-500 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-semibold text-slate-700 group-hover:text-amber-700">Pattern & Syllabus</span>
          </Link>
          
          <Link to="/admin/study-resources" className="flex flex-col items-center justify-center p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-cyan-50 hover:border-cyan-200 transition-colors group">
            <Library className="w-6 h-6 text-cyan-500 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-semibold text-slate-700 group-hover:text-cyan-700">Study Resources</span>
          </Link>
          <Link to="/admin/banners" className="flex flex-col items-center justify-center p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-purple-50 hover:border-purple-200 transition-colors group">
            <ImageIcon className="w-6 h-6 text-purple-500 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-semibold text-slate-700 group-hover:text-purple-700">Home Banners</span>
          </Link>
          <Link to="/admin/recommendations" className="flex flex-col items-center justify-center p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-fuchsia-50 hover:border-fuchsia-200 transition-colors group">
            <Star className="w-6 h-6 text-fuchsia-500 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-semibold text-slate-700 group-hover:text-fuchsia-700">Top Recommendations</span>
          </Link>
          <Link to="/admin/whatsapp" className="flex flex-col items-center justify-center p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-teal-50 hover:border-teal-200 transition-colors group">
            <MessageCircle className="w-6 h-6 text-teal-500 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-semibold text-slate-700 group-hover:text-teal-700">WhatsApp / Settings</span>
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-4">
        <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-600 flex items-center justify-center">
          <Database className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Legacy Notes Module</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage classic PDF Notes</p>
        </div>
      </div>

{/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Notes */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Notes
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{totalNotes}</div>
          <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1">All notes in database</p>
        </div>

        {/* Published Notes */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
              Published
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600">{publishedNotes}</div>
          <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1">Live to students</p>
        </div>

        {/* Drafts */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
              Drafts / Private
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <FileQuestion className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-600">{draftNotes}</div>
          <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1">Admin review only</p>
        </div>

        {/* Subjects */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
              Disciplines
            </span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-indigo-600">{totalCategories}</div>
          <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1">Subject categories</p>
        </div>
      </div>

      {/* Main Notes Management Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              Notes Repository ({filteredNotes.length} of {notes.length})
            </h2>
            <p className="text-xs text-slate-500">
              All documents including unpublished drafts. Toggle live status, edit details, or delete notes.
            </p>
          </div>

          <Link
            to="/admin/upload"
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload New PDF</span>
          </Link>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200 shadow-2xs space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            {/* Search input */}
            <div className="sm:col-span-6 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="admin-notes-search-input"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search notes by title, description or file name..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 bg-slate-50/50"
              />
            </div>

            {/* Category Filter from public.categories */}
            <div className="sm:col-span-3">
              <select
                id="admin-category-filter"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium text-slate-700 bg-slate-50/50 focus:outline-hidden"
              >
                <option value="all">All Disciplines</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id.toString()}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Tabs */}
            <div className="sm:col-span-3 flex rounded-xl bg-slate-100 p-1">
              <button
                id="admin-filter-status-all"
                onClick={() => setStatusFilter('all')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({notes.length})
              </button>
              <button
                id="admin-filter-status-published"
                onClick={() => setStatusFilter('published')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                  statusFilter === 'published'
                    ? 'bg-white text-emerald-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Live ({publishedNotes})
              </button>
              <button
                id="admin-filter-status-draft"
                onClick={() => setStatusFilter('draft')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                  statusFilter === 'draft'
                    ? 'bg-white text-amber-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Drafts ({draftNotes})
              </button>
            </div>
          </div>
        </div>

        {/* Notes Data View */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center shadow-2xs">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-medium">Loading repository notes...</p>
          </div>
        ) : filteredNotes.length > 0 ? (
          <div className="space-y-3">
            {/* Desktop Table View (hidden on small mobile screens) */}
            <div className="hidden md:block bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-3 px-4">Title & Subject</th>
                      <th className="py-3 px-4">PDF Details</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Uploaded</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredNotes.map((note) => (
                      <tr key={note.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="font-bold text-slate-900 line-clamp-1">{note.title}</div>
                          <div className="text-[11px] text-blue-600 font-semibold mt-0.5">
                            {note.category?.name || 'General Subject'}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-slate-500">
                          <div className="flex items-center gap-1.5 font-medium text-slate-700">
                            <FileText className="w-3.5 h-3.5 text-red-500" />
                            <span className="truncate max-w-[170px]">{note.file_name}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {formatBytes(note.file_size)} • Bucket: <span className="font-mono text-slate-500">pdf-notes</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => handleTogglePublish(note)}
                            title="Click to toggle publish status"
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                              note.published
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                                : 'bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300'
                            }`}
                          >
                            {note.published ? (
                              <>
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Published</span>
                              </>
                            ) : (
                              <>
                                <FileQuestion className="w-3 h-3" />
                                <span>Draft</span>
                              </>
                            )}
                          </button>
                        </td>

                        <td className="py-3.5 px-4 text-slate-400">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{new Date(note.created_at).toLocaleDateString()}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              to={`/notes/${note.id}`}
                              title="Preview Student Reader"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => setEditingNote(note)}
                              title="Edit Note Details"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeletingNote(note)}
                              title="Delete Note"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards View (Optimized with >=44px touch targets) */}
            <div className="grid grid-cols-1 gap-3 md:hidden">
              {filteredNotes.map((note) => (
                <div
                  key={note.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                          {note.category?.name || 'General'}
                        </span>
                        <button
                          onClick={() => handleTogglePublish(note)}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            note.published
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {note.published ? <CheckCircle2 className="w-3 h-3" /> : <FileQuestion className="w-3 h-3" />}
                          <span>{note.published ? 'Published' : 'Draft'}</span>
                        </button>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 leading-snug">{note.title}</h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                    <FileText className="w-3.5 h-3.5 text-red-500 shrink-0" />
                    <span className="truncate max-w-[160px] font-medium">{note.file_name}</span>
                    <span>•</span>
                    <span>{formatBytes(note.file_size)}</span>
                  </div>

                  {/* Touch-Friendly Action Buttons (>=44px touch targets) */}
                  <div className="pt-2 grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleTogglePublish(note)}
                      className={`min-h-[44px] py-2 px-3 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${
                        note.published
                          ? 'text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200'
                          : 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
                      }`}
                    >
                      {note.published ? 'Unpublish' : 'Publish'}
                    </button>

                    <button
                      onClick={() => setEditingNote(note)}
                      className="min-h-[44px] py-2 px-3 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => setDeletingNote(note)}
                      className="min-h-[44px] py-2 px-3 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 sm:p-14 text-center space-y-3 shadow-2xs">
            <FileText className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">No notes match your filter criteria</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try adjusting your search terms or subject selection, or upload a new PDF note to the repository.
            </p>
            <Link
              to="/admin/upload"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Upload New PDF</span>
            </Link>
          </div>
        )}
      </div>

      {/* Edit Note Modal */}
      <EditNoteModal
        isOpen={Boolean(editingNote)}
        note={editingNote}
        categories={categories}
        onClose={() => setEditingNote(null)}
        onUpdated={handleNoteUpdated}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(deletingNote)}
        title="Delete Note and Storage PDF"
        message={`Are you sure you want to permanently delete "${deletingNote?.title}"? This will delete the database row from public.notes and purge the PDF file from the private pdf-notes Supabase bucket. This action cannot be undone.`}
        confirmLabel="Delete Permanently"
        cancelLabel="Keep Note"
        isDangerous={true}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeletingNote(null)}
      />
    </div>
  );
};

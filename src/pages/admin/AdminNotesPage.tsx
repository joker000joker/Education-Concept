import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Note, Category } from '../../types';
import {
  fetchNotes,
  getCategories,
  deleteNoteRecord,
  toggleNotePublishStatus,
  formatBytes,
} from '../../lib/supabase';
import { INITIAL_CATEGORIES } from '../../data/categories';
import { useToast } from '../../context/ToastContext';
import { EditNoteModal } from '../../components/admin/EditNoteModal';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';
import { BackButton } from '../../components/common/BackButton';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  FileQuestion,
  Loader2,
  FileText,
  Calendar,
  HardDrive,
  Filter,
} from 'lucide-react';

export const AdminNotesPage: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [categories, setCategories] = useState<Category[]>(
    INITIAL_CATEGORIES.map((c) => ({ id: c.id, name: c.name }))
  );
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');

  // Edit modal state
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  // Delete modal state
  const [deletingNote, setDeletingNote] = useState<Note | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const toast = useToast();

  const loadNotes = async () => {
    try {
      setLoading(true);
      const [res, catRes] = await Promise.all([
        fetchNotes({ publishedOnly: false, sortBy: 'newest' }),
        getCategories().catch(() => []),
      ]);
      setNotes(res.notes);
      if (catRes && catRes.length > 0) {
        setCategories(catRes);
      }
    } catch (err: any) {
      console.error('Error fetching admin notes:', err);
      toast.error('Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, []);

  const handleTogglePublish = async (note: Note) => {
    try {
      const nextStatus = await toggleNotePublishStatus(note.id, note.published);
      setNotes((prev) =>
        prev.map((n) => (n.id === note.id ? { ...n, published: nextStatus } : n))
      );
      toast.success(
        nextStatus ? `"${note.title}" published!` : `"${note.title}" moved to draft.`
      );
    } catch (err: any) {
      toast.error(err.message || 'Failed to toggle publish status');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingNote) return;
    try {
      setIsDeleting(true);
      await deleteNoteRecord(deletingNote.id, deletingNote.file_path);
      setNotes((prev) => prev.filter((n) => n.id !== deletingNote.id));
      toast.success(`Note "${deletingNote.title}" and its PDF have been permanently deleted.`);
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

  // Filter notes
  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesTitle = note.title.toLowerCase().includes(term);
        const matchesDesc = note.description?.toLowerCase().includes(term);
        if (!matchesTitle && !matchesDesc) return false;
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
    <div className="space-y-6">
      <div className="mb-2">
        <BackButton fallbackTo="/admin" label="Back to Dashboard" forceFallback={true} />
      </div>
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-[#F8FAFC] tracking-tight">
            Notes Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Publish, edit details, replace storage PDFs, or remove documents.
          </p>
        </div>

        <Link
          id="admin-create-note-btn"
          to="/admin/upload"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs shadow-blue-600/20 transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Upload New PDF</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#141C2E] rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search input */}
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title or content..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 bg-slate-50/50 dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>

          {/* Category Filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-50/50 dark:bg-[#0B1120] focus:outline-hidden"
            >
              <option value="all">All Subjects</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id.toString()}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Tabs */}
          <div className="sm:col-span-3 flex rounded-xl bg-slate-100 dark:bg-[#0B1120] p-1 border border-transparent dark:border-slate-800">
            <button
              onClick={() => setStatusFilter('all')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                statusFilter === 'all'
                  ? 'bg-white dark:bg-[#1E293B] text-slate-900 dark:text-slate-100 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              All ({notes.length})
            </button>
            <button
              onClick={() => setStatusFilter('published')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                statusFilter === 'published'
                  ? 'bg-white dark:bg-[#1E293B] text-emerald-700 dark:text-emerald-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              Live
            </button>
            <button
              onClick={() => setStatusFilter('draft')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                statusFilter === 'draft'
                  ? 'bg-white dark:bg-[#1E293B] text-amber-700 dark:text-amber-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              Drafts
            </button>
          </div>
        </div>
      </div>

      {/* Notes List / Table */}
      {loading ? (
        <div className="p-16 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Loading notes inventory...</p>
        </div>
      ) : filteredNotes.length > 0 ? (
        <div className="space-y-3">
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white dark:bg-[#141C2E] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-[#0B1120]/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th className="py-3 px-4">Title & Subject</th>
                    <th className="py-3 px-4 hidden md:table-cell">File Details</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 hidden lg:table-cell">Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {filteredNotes.map((note) => (
                    <tr key={note.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-bold text-slate-900 dark:text-[#F8FAFC] line-clamp-1">{note.title}</div>
                        <div className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold mt-0.5">
                          {note.category_id === 9 ? 'Other E-Notes' : (note.category?.name || 'General')}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 hidden md:table-cell text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                          <FileText className="w-3.5 h-3.5 text-red-500" />
                          <span className="truncate max-w-[150px]">{note.file_name}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                          {formatBytes(note.file_size)}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleTogglePublish(note)}
                          title="Click to toggle publish status"
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                            note.published
                              ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-800/60'
                              : 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/60 border border-amber-300 dark:border-amber-800/60'
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

                      <td className="py-3.5 px-4 hidden lg:table-cell text-slate-400 dark:text-slate-500">
                        {new Date(note.created_at).toLocaleDateString()}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/notes/${note.id}`}
                            title="Preview Note"
                            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => setEditingNote(note)}
                            title="Edit Note"
                            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingNote(note)}
                            title="Delete Note"
                            className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
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

          {/* Mobile Cards View */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filteredNotes.map((note) => (
              <div
                key={note.id}
                className="bg-white dark:bg-[#141C2E] rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md">
                        {note.category_id === 9 ? 'Other E-Notes' : (note.category?.name || 'General')}
                      </span>
                      <button
                        onClick={() => handleTogglePublish(note)}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          note.published
                            ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
                            : 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300'
                        }`}
                      >
                        {note.published ? <CheckCircle2 className="w-3 h-3" /> : <FileQuestion className="w-3 h-3" />}
                        <span>{note.published ? 'Published' : 'Draft'}</span>
                      </button>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC] leading-snug">{note.title}</h3>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
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
                        ? 'text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-900/40'
                        : 'text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-900/40'
                    }`}
                  >
                    {note.published ? 'Unpublish' : 'Publish'}
                  </button>

                  <button
                    onClick={() => setEditingNote(note)}
                    className="min-h-[44px] py-2 px-3 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => setDeletingNote(note)}
                    className="min-h-[44px] py-2 px-3 rounded-xl text-xs font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900/40 transition-colors flex items-center justify-center gap-1.5"
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
        <div className="bg-white dark:bg-[#141C2E] rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-3">
          <FileText className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No matching notes found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Try adjusting your search query, selecting another category, or uploading a new note.
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
        title="Delete Note and Associated PDF"
        message={`Are you sure you want to permanently delete "${deletingNote?.title}"? This will delete the database entry and remove the PDF document from private storage. This action cannot be undone.`}
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

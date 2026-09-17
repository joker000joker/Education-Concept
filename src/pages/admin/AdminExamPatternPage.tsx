import React, { useEffect, useState, useMemo } from 'react';
import { supabase, uploadPdfFile, deletePdfFile, getSecurePdfUrl } from '../../lib/supabase';
import { ExamPattern } from '../../types';
import { useToast } from '../../context/ToastContext';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';
import { BackButton } from '../../components/common/BackButton';
import {
  Search, Plus, Edit2, Trash2, CheckCircle2, FileQuestion,
  Loader2, FileText, X, UploadCloud, ArrowUpDown, Calendar,
  Briefcase, GraduationCap, Check, AlertCircle, ExternalLink
} from 'lucide-react';

export const EXAM_CATEGORIES = [
  { id: 'SSC', name: 'SSC' },
  { id: 'Railway', name: 'Railway' },
  { id: 'Bihar', name: 'Bihar' },
  { id: 'UP', name: 'UP' }
] as const;

export const CATEGORY_EXAMS: Record<string, string[]> = {
  'SSC': [
    'SSC CGL',
    'SSC CHSL',
    'SSC MTS',
    'SSC GD',
    'SSC CPO',
    'SSC Stenographer',
    'SSC Selection Post'
  ],
  'Railway': [
    'RRB NTPC',
    'RRB Group D',
    'RRB ALP',
    'RRB Technician Grade I Signal',
    'RRB Technician Grade III',
    'RPF'
  ],
  'Bihar': [
    'Bihar Daroga',
    'Bihar Police'
  ],
  'UP': [
    'UP Daroga',
    'UP Police'
  ]
};

export const AdminExamPatternPage: React.FC = () => {
  const [examPatterns, setExamPatterns] = useState<ExamPattern[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'category' | 'newest'>('category');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ExamPattern | null>(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [examCategory, setExamCategory] = useState<string>('SSC');
  const [examName, setExamName] = useState<string>('SSC CGL');
  const [patternFile, setPatternFile] = useState<File | null>(null);
  const [syllabusFile, setSyllabusFile] = useState<File | null>(null);
  const [published, setPublished] = useState(true);
  const [removePatternFile, setRemovePatternFile] = useState(false);
  const [removeSyllabusFile, setRemoveSyllabusFile] = useState(false);

  // Deletion State
  const [deletingItem, setDeletingItem] = useState<ExamPattern | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadExamPatterns();
  }, []);

  const loadExamPatterns = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('exam_patterns')
        .select('*')
        .order('exam_category', { ascending: true })
        .order('exam_name', { ascending: true });

      if (error) throw error;
      setExamPatterns((data || []) as ExamPattern[]);
    } catch (err: any) {
      console.error('Error loading exam patterns:', err);
      toast.error('Failed to load exam records: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setExamCategory('SSC');
    setExamName(CATEGORY_EXAMS['SSC'][0]);
    setPatternFile(null);
    setSyllabusFile(null);
    setRemovePatternFile(false);
    setRemoveSyllabusFile(false);
    setPublished(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: ExamPattern) => {
    setEditingItem(item);
    setExamCategory(item.exam_category);
    setExamName(item.exam_name);
    setPatternFile(null);
    setSyllabusFile(null);
    setRemovePatternFile(false);
    setRemoveSyllabusFile(false);
    setPublished(item.published);
    setIsModalOpen(true);
  };

  const handleCategoryChange = (newCat: string) => {
    setExamCategory(newCat);
    const availableExams = CATEGORY_EXAMS[newCat] || [];
    if (!availableExams.includes(examName)) {
      setExamName(availableExams[0] || '');
    }
  };

  const handleTogglePublish = async (item: ExamPattern) => {
    const newStatus = !item.published;
    try {
      // Optimistic update
      setExamPatterns(prev =>
        prev.map(ep => (ep.id === item.id ? { ...ep, published: newStatus } : ep))
      );

      const { error } = await supabase
        .from('exam_patterns')
        .update({ published: newStatus })
        .eq('id', item.id);

      if (error) throw error;
      toast.success(newStatus ? 'Exam published for students' : 'Exam moved to draft');
    } catch (err: any) {
      // Revert on error
      setExamPatterns(prev =>
        prev.map(ep => (ep.id === item.id ? { ...ep, published: item.published } : ep))
      );
      toast.error('Failed to update status: ' + err.message);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examCategory) {
      toast.error('Exam Category is required.');
      return;
    }
    if (!examName) {
      toast.error('Exam Name is required.');
      return;
    }

    setSaving(true);
    try {
      let patternPath = editingItem?.pattern_file_path || null;
      let syllabusPath = editingItem?.syllabus_file_path || null;
      const oldPatternPath = editingItem?.pattern_file_path || null;
      const oldSyllabusPath = editingItem?.syllabus_file_path || null;

      // Handle Pattern File removal
      if (removePatternFile) {
        patternPath = null;
      }

      // Handle Pattern File upload
      if (patternFile) {
        toast.info('Uploading Exam Pattern file...');
        const res = await uploadPdfFile(patternFile, 'exam_patterns');
        patternPath = res.filePath;
      }

      // Handle Syllabus File removal
      if (removeSyllabusFile) {
        syllabusPath = null;
      }

      // Handle Syllabus File upload
      if (syllabusFile) {
        toast.info('Uploading Syllabus file...');
        const res = await uploadPdfFile(syllabusFile, 'exam_patterns');
        syllabusPath = res.filePath;
      }

      const recordData = {
        exam_category: examCategory,
        exam_name: examName,
        pattern_file_path: patternPath,
        syllabus_file_path: syllabusPath,
        published,
      };

      if (editingItem) {
        const { error } = await supabase
          .from('exam_patterns')
          .update(recordData)
          .eq('id', editingItem.id);

        if (error) throw error;

        // Clean up old files only after successful DB update
        if (oldPatternPath && (patternFile || removePatternFile) && oldPatternPath !== patternPath) {
          await deletePdfFile(oldPatternPath).catch(() => {});
        }
        if (oldSyllabusPath && (syllabusFile || removeSyllabusFile) && oldSyllabusPath !== syllabusPath) {
          await deletePdfFile(oldSyllabusPath).catch(() => {});
        }

        toast.success('Exam record updated successfully.');
      } else {
        const { error } = await supabase
          .from('exam_patterns')
          .insert(recordData);

        if (error) throw error;
        toast.success('Exam record created successfully.');
      }

      setIsModalOpen(false);
      loadExamPatterns();
    } catch (err: any) {
      console.error('Save error:', err);
      toast.error('Failed to save exam: ' + (err.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    setIsDeleting(true);
    try {
      // 1. Safely remove associated storage files belonging to this record
      if (deletingItem.pattern_file_path) {
        try {
          await deletePdfFile(deletingItem.pattern_file_path);
        } catch (storageErr) {
          console.warn('Warning deleting pattern storage file:', storageErr);
        }
      }

      if (deletingItem.syllabus_file_path) {
        try {
          await deletePdfFile(deletingItem.syllabus_file_path);
        } catch (storageErr) {
          console.warn('Warning deleting syllabus storage file:', storageErr);
        }
      }

      // 2. Delete DB record
      const { error } = await supabase
        .from('exam_patterns')
        .delete()
        .eq('id', deletingItem.id);

      if (error) throw error;

      toast.success('Exam record deleted successfully.');
      setExamPatterns(prev => prev.filter(ep => ep.id !== deletingItem.id));
      setDeletingItem(null);
    } catch (err: any) {
      console.error('Delete error:', err);
      toast.error('Failed to delete: ' + (err.message || 'Unknown error'));
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered & Sorted Records
  const filteredPatterns = useMemo(() => {
    return examPatterns
      .filter((ep) => {
        if (categoryFilter !== 'all' && ep.exam_category !== categoryFilter) return false;
        if (statusFilter === 'published' && !ep.published) return false;
        if (statusFilter === 'draft' && ep.published) return false;
        if (searchTerm && !ep.exam_name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'name') {
          return a.exam_name.localeCompare(b.exam_name);
        } else if (sortBy === 'category') {
          const catCmp = a.exam_category.localeCompare(b.exam_category);
          return catCmp !== 0 ? catCmp : a.exam_name.localeCompare(b.exam_name);
        } else {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
      });
  }, [examPatterns, searchTerm, categoryFilter, statusFilter, sortBy]);

  // Helper for Category Color Badges
  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'SSC':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Railway':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Bihar':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'UP':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-2">
        <BackButton fallbackTo="/admin" label="Back to Dashboard" forceFallback={true} />
      </div>

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Exam Pattern & Syllabus Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage official pattern documents, syllabus files, and student visibility across target exams.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors text-sm font-bold shadow-sm shadow-blue-600/20 active:scale-95 cursor-pointer min-h-[44px]"
        >
          <Plus className="w-4 h-4" />
          <span>Add Exam</span>
        </button>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by exam name (e.g. CGL, Daroga)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold uppercase shrink-0">Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
              >
                <option value="all">All Categories</option>
                {EXAM_CATEGORIES.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold uppercase shrink-0">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full sm:w-auto px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
              >
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Drafts</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full sm:w-auto px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
              >
                <option value="category">Sort: Category & Name</option>
                <option value="name">Sort: Exam Name</option>
                <option value="newest">Sort: Newest First</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-2xs">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-2" />
          <p className="text-sm text-slate-500 font-medium">Loading exam patterns...</p>
        </div>
      ) : filteredPatterns.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-2xs">
          <GraduationCap className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="font-bold text-slate-800 text-base">No exam records found</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all'
              ? 'Try adjusting your search keywords or filter dropdowns.'
              : 'Add your first exam pattern and syllabus document to publish guidance for students.'}
          </p>
          {!searchTerm && categoryFilter === 'all' && statusFilter === 'all' && (
            <button
              onClick={handleOpenAdd}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Exam
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Desktop Table View (Hidden on mobile) */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="px-6 py-4">Exam Name</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Exam Pattern</th>
                    <th className="px-6 py-4">Syllabus</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Created Date</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPatterns.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                            <GraduationCap className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 line-clamp-1 max-w-[240px]">
                              {item.exam_name}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide uppercase border ${getCategoryBadge(item.exam_category)}`}>
                          {item.exam_category}
                        </span>
                      </td>

                      {/* Pattern Status */}
                      <td className="px-6 py-4">
                        {item.pattern_file_path ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Uploaded</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-100 text-slate-500">
                            <span>Not Uploaded</span>
                          </span>
                        )}
                      </td>

                      {/* Syllabus Status */}
                      <td className="px-6 py-4">
                        {item.syllabus_file_path ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Uploaded</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-100 text-slate-500">
                            <span>Not Uploaded</span>
                          </span>
                        )}
                      </td>

                      {/* Published Toggle */}
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleTogglePublish(item)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                            item.published
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                              : 'bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300'
                          }`}
                          title="Click to toggle published status"
                        >
                          {item.published ? (
                            <><CheckCircle2 className="w-3 h-3" /><span>Published</span></>
                          ) : (
                            <><FileQuestion className="w-3 h-3" /><span>Draft</span></>
                          )}
                        </button>
                      </td>

                      <td className="px-6 py-4 text-slate-500 text-xs">
                        {new Date(item.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                            title="Edit Exam"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingItem(item)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete Exam"
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

          {/* Mobile Cards View (Optimized for narrow screens, zero horizontal overflow) */}
          <div className="grid grid-cols-1 gap-3.5 md:hidden">
            {filteredPatterns.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 text-sm break-words leading-snug">
                      {item.exam_name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${getCategoryBadge(item.exam_category)}`}>
                        {item.exam_category}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(item.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Document Status Indicators */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex flex-col gap-1">
                    <span className="text-[10px] text-slate-400 font-medium">Exam Pattern</span>
                    {item.pattern_file_path ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                        <Check className="w-3 h-3 text-emerald-600" />
                        Uploaded
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-slate-400">Not Uploaded</span>
                    )}
                  </div>

                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex flex-col gap-1">
                    <span className="text-[10px] text-slate-400 font-medium">Syllabus</span>
                    {item.syllabus_file_path ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                        <Check className="w-3 h-3 text-emerald-600" />
                        Uploaded
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-slate-400">Not Uploaded</span>
                    )}
                  </div>
                </div>

                {/* Status Toggle & Action Buttons */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                  <button
                    onClick={() => handleTogglePublish(item)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer min-h-[32px] ${
                      item.published
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}
                  >
                    {item.published ? (
                      <><CheckCircle2 className="w-3 h-3" /><span>Published</span></>
                    ) : (
                      <><FileQuestion className="w-3 h-3" /><span>Draft</span></>
                    )}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="flex items-center justify-center gap-1 py-2 px-3 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors min-h-[44px]"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => setDeletingItem(item)}
                      className="flex items-center justify-center p-2.5 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-200 transition-colors min-w-[44px] min-h-[44px]"
                      title="Delete Exam"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                {editingItem ? 'Edit Exam' : 'Add Exam'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
              <form id="exam-pattern-form" onSubmit={handleSave} className="space-y-5">
                {/* Category Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Exam Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={examCategory}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white font-medium"
                  >
                    {EXAM_CATEGORIES.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Exam Name Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Exam Name <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={examName}
                    onChange={(e) => setExamName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white font-medium"
                  >
                    {(CATEGORY_EXAMS[examCategory] || []).map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>

                {/* Pattern File Upload */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">
                      Exam Pattern Document (PDF / Image)
                    </label>
                    {editingItem?.pattern_file_path && !removePatternFile && (
                      <button
                        type="button"
                        onClick={() => setRemovePatternFile(true)}
                        className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
                      >
                        Remove current file
                      </button>
                    )}
                  </div>

                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:border-blue-400 transition-colors bg-white">
                    <input
                      type="file"
                      accept="application/pdf,image/*,.pdf,.png,.jpg,.jpeg"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setPatternFile(e.target.files[0]);
                          setRemovePatternFile(false);
                        }
                      }}
                      className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                    />

                    {editingItem?.pattern_file_path && !patternFile && !removePatternFile && (
                      <p className="text-[10px] text-emerald-600 mt-2 font-medium">
                        Existing document preserved. Choose a file to replace it.
                      </p>
                    )}
                    {removePatternFile && (
                      <p className="text-[10px] text-rose-600 mt-2 font-medium">
                        Current document will be removed on saving.
                      </p>
                    )}
                  </div>
                </div>

                {/* Syllabus File Upload */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">
                      Syllabus Document (PDF / Image)
                    </label>
                    {editingItem?.syllabus_file_path && !removeSyllabusFile && (
                      <button
                        type="button"
                        onClick={() => setRemoveSyllabusFile(true)}
                        className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
                      >
                        Remove current file
                      </button>
                    )}
                  </div>

                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:border-blue-400 transition-colors bg-white">
                    <input
                      type="file"
                      accept="application/pdf,image/*,.pdf,.png,.jpg,.jpeg"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setSyllabusFile(e.target.files[0]);
                          setRemoveSyllabusFile(false);
                        }
                      }}
                      className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                    />

                    {editingItem?.syllabus_file_path && !syllabusFile && !removeSyllabusFile && (
                      <p className="text-[10px] text-emerald-600 mt-2 font-medium">
                        Existing document preserved. Choose a file to replace it.
                      </p>
                    )}
                    {removeSyllabusFile && (
                      <p className="text-[10px] text-rose-600 mt-2 font-medium">
                        Current document will be removed on saving.
                      </p>
                    )}
                  </div>
                </div>

                {/* Publish Toggle */}
                <div className="pt-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={published}
                        onChange={(e) => setPublished(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                    </div>
                    <div>
                      <span className="text-sm font-bold text-slate-800 block">Publish to Students</span>
                      <span className="text-[11px] text-slate-400 block">
                        If checked, this exam's pattern and syllabus will appear in the student section.
                      </span>
                    </div>
                  </label>
                </div>
              </form>
            </div>

            <div className="p-5 border-t border-slate-100 flex justify-end gap-3 bg-white rounded-b-2xl">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="exam-pattern-form"
                disabled={saving}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl flex items-center gap-2 disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingItem ? 'Save Changes' : 'Save Exam'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(deletingItem)}
        title="Delete Exam Record"
        message={`Are you sure you want to permanently delete "${deletingItem?.exam_name}" (${deletingItem?.exam_category})? This will delete the database record and any associated storage files. This action cannot be undone.`}
        confirmLabel="Delete Permanently"
        cancelLabel="Cancel"
        isDangerous={true}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeletingItem(null)}
      />
    </div>
  );
};

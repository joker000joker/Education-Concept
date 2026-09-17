import React, { useEffect, useState, useMemo } from 'react';
import { supabase, uploadPdfFile, deletePdfFile, formatBytes } from '../../lib/supabase';
import { StudyResource } from '../../types';
import { useToast } from '../../context/ToastContext';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';
import { BackButton } from '../../components/common/BackButton';
import {
  Search, Plus, Edit2, Trash2, CheckCircle2, FileQuestion,
  Loader2, FileText, X, UploadCloud, ArrowUpDown, Calendar,
  Hash, BookOpen, FileCheck2, Calculator, List, Check, AlertCircle
} from 'lucide-react';

export const STUDY_RESOURCE_CATEGORIES = [
  'Previous Year Papers',
  'Practice Sets',
  'Formula & Short Tricks',
  'One-Liners'
] as const;

export type StudyResourceCategory = typeof STUDY_RESOURCE_CATEGORIES[number];

export const AdminStudyResourcesPage: React.FC = () => {
  const [resources, setResources] = useState<StudyResource[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [sortBy, setSortBy] = useState<'order' | 'newest'>('order');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StudyResource | null>(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<StudyResourceCategory>('Previous Year Papers');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [published, setPublished] = useState(true);
  const [displayOrder, setDisplayOrder] = useState<number | ''>('');
  const [hasManuallyEditedTitle, setHasManuallyEditedTitle] = useState(false);

  // Deletion State
  const [deletingItem, setDeletingItem] = useState<StudyResource | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('study_resources')
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setResources((data || []) as StudyResource[]);
    } catch (err: any) {
      console.error('Error loading study resources:', err);
      toast.error('Failed to load Study Resources: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setTitle('');
    setCategory('Previous Year Papers');
    setPdfFile(null);
    setPublished(true);
    setDisplayOrder('');
    setHasManuallyEditedTitle(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: StudyResource) => {
    setEditingItem(item);
    setTitle(item.title);
    setCategory(item.category as StudyResourceCategory);
    setPdfFile(null);
    setPublished(item.published);
    setDisplayOrder(item.display_order ?? '');
    setHasManuallyEditedTitle(true);
    setIsModalOpen(true);
  };

  const handlePdfFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPdfFile(file);

      // Auto-fill title if Admin hasn't manually edited title or if title is currently blank
      if (!hasManuallyEditedTitle || !title.trim()) {
        const autoTitle = file.name
          .replace(/\.pdf$/i, '')
          .replace(/[_-]/g, ' ');
        setTitle(autoTitle);
      }
    }
  };

  const handleTogglePublish = async (item: StudyResource) => {
    const newStatus = !item.published;
    try {
      // Optimistic update
      setResources(prev =>
        prev.map(r => (r.id === item.id ? { ...r, published: newStatus } : r))
      );

      const { error } = await supabase
        .from('study_resources')
        .update({ published: newStatus })
        .eq('id', item.id);

      if (error) throw error;
      toast.success(newStatus ? 'Resource published to students' : 'Resource moved to draft');
    } catch (err: any) {
      // Revert on error
      setResources(prev =>
        prev.map(r => (r.id === item.id ? { ...r, published: item.published } : r))
      );
      toast.error('Failed to update status: ' + err.message);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Resource Title is required.');
      return;
    }
    if (!category) {
      toast.error('Category is required.');
      return;
    }
    if (!editingItem && !pdfFile) {
      toast.error('Please select a PDF file to upload.');
      return;
    }

    setSaving(true);
    try {
      let filePath = editingItem?.file_path || '';
      let fileName = editingItem?.file_name || '';
      let fileSize = editingItem?.file_size || null;
      const oldFilePath = editingItem?.file_path || null;

      if (pdfFile) {
        toast.info('Uploading PDF document...');
        const uploadRes = await uploadPdfFile(pdfFile, 'study_resources');
        filePath = uploadRes.filePath;
        fileName = uploadRes.fileName;
        fileSize = uploadRes.fileSize;
      }

      const numericOrder = typeof displayOrder === 'number'
        ? displayOrder
        : displayOrder.trim() === ''
          ? 0
          : parseInt(displayOrder, 10) || 0;

      const recordData = {
        title: title.trim(),
        category,
        file_path: filePath,
        file_name: fileName,
        file_size: fileSize,
        published,
        display_order: numericOrder,
      };

      if (editingItem) {
        const { error } = await supabase
          .from('study_resources')
          .update(recordData)
          .eq('id', editingItem.id);

        if (error) throw error;

        // If a replacement file was uploaded successfully, clean up the old file
        if (oldFilePath && pdfFile && oldFilePath !== filePath) {
          await deletePdfFile(oldFilePath).catch((delErr) => {
            console.warn('Could not remove superseded storage file:', delErr);
          });
        }

        toast.success('Study Resource updated successfully.');
      } else {
        const { error } = await supabase
          .from('study_resources')
          .insert(recordData);

        if (error) throw error;
        toast.success('Study Resource created successfully.');
      }

      setIsModalOpen(false);
      loadResources();
    } catch (err: any) {
      console.error('Save error:', err);
      toast.error('Failed to save study resource: ' + (err.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    setIsDeleting(true);
    try {
      // 1. Safely remove PDF file from private Storage bucket
      if (deletingItem.file_path) {
        try {
          await deletePdfFile(deletingItem.file_path);
        } catch (storageErr) {
          console.warn('Warning removing PDF from storage:', storageErr);
        }
      }

      // 2. Delete database record
      const { error } = await supabase
        .from('study_resources')
        .delete()
        .eq('id', deletingItem.id);

      if (error) throw error;

      toast.success('Study Resource deleted successfully.');
      setResources(prev => prev.filter(r => r.id !== deletingItem.id));
      setDeletingItem(null);
    } catch (err: any) {
      console.error('Delete error:', err);
      toast.error('Failed to delete resource: ' + (err.message || 'Unknown error'));
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter & Sort logic
  const filteredResources = useMemo(() => {
    return resources
      .filter((item) => {
        if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
        if (statusFilter === 'published' && !item.published) return false;
        if (statusFilter === 'draft' && item.published) return false;
        if (searchTerm && !item.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'order') {
          const orderDiff = (a.display_order ?? 0) - (b.display_order ?? 0);
          if (orderDiff !== 0) return orderDiff;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        } else {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
      });
  }, [resources, searchTerm, categoryFilter, statusFilter, sortBy]);

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'Previous Year Papers':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Practice Sets':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Formula & Short Tricks':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'One-Liners':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Previous Year Papers':
        return FileCheck2;
      case 'Practice Sets':
        return BookOpen;
      case 'Formula & Short Tricks':
        return Calculator;
      case 'One-Liners':
        return List;
      default:
        return FileText;
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-2">
        <BackButton fallbackTo="/admin" label="Back to Dashboard" forceFallback={true} />
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Study Resources Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage Previous Year Papers, Practice Sets, Formulas, and One-Liners for students.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors text-sm font-bold shadow-sm shadow-blue-600/20 active:scale-95 cursor-pointer min-h-[44px]"
        >
          <Plus className="w-4 h-4" />
          <span>Add Study Resource</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title (e.g. Science One Liner, Math Tricks)..."
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
                {STUDY_RESOURCE_CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
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
                <option value="order">Sort: Display Order</option>
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
          <p className="text-sm text-slate-500 font-medium">Loading study resources...</p>
        </div>
      ) : filteredResources.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-2xs">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="font-bold text-slate-800 text-base">No study resources found</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all'
              ? 'Try adjusting your search query or filter settings.'
              : 'Add your first study resource document to provide guidance for students.'}
          </p>
          {!searchTerm && categoryFilter === 'all' && statusFilter === 'all' && (
            <button
              onClick={handleOpenAdd}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Study Resource
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
                    <th className="px-6 py-4">Title</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">PDF Document</th>
                    <th className="px-6 py-4">File Size</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Order</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredResources.map((item) => {
                    const CategoryIcon = getCategoryIcon(item.category);
                    return (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                              <CategoryIcon className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 line-clamp-1 max-w-[280px]">
                                {item.title}
                              </p>
                              <p className="text-xs text-slate-400 font-mono line-clamp-1 max-w-[280px]">
                                {item.file_name || 'Document file'}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide border ${getCategoryBadge(item.category)}`}>
                            {item.category}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-slate-600 text-xs">
                          <div className="flex items-center gap-1.5 font-medium max-w-[180px] truncate text-slate-700">
                            <FileText className="w-4 h-4 text-rose-500 shrink-0" />
                            <span className="truncate">{item.file_name || 'PDF Document'}</span>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-slate-500 text-xs font-medium">
                          {formatBytes(item.file_size)}
                        </td>

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

                        <td className="px-6 py-4 text-slate-600 text-xs font-semibold">
                          #{item.display_order ?? 0}
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
                              title="Edit Resource"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeletingItem(item)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete Resource"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards View (Optimized for narrow screens, zero horizontal overflow) */}
          <div className="grid grid-cols-1 gap-3.5 md:hidden">
            {filteredResources.map((item) => {
              const CategoryIcon = getCategoryIcon(item.category);
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                      <CategoryIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-900 text-sm break-words leading-snug">
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold border ${getCategoryBadge(item.category)}`}>
                          {item.category}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">
                          Order #{item.display_order ?? 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* File Details */}
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-rose-500 shrink-0" />
                      <span className="text-[11px] text-slate-700 font-medium truncate">
                        {item.file_name || 'PDF Document'}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 shrink-0">
                      {formatBytes(item.file_size)}
                    </span>
                  </div>

                  {/* Actions & Status */}
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
                        title="Delete Resource"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                {editingItem ? 'Edit Study Resource' : 'Add Study Resource'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
              <form id="study-resource-form" onSubmit={handleSave} className="space-y-5">
                {/* PDF File Upload */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    PDF Document {!editingItem && <span className="text-rose-500">*</span>}
                  </label>
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-5 text-center hover:border-blue-400 transition-colors bg-white">
                    <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <input
                      type="file"
                      accept="application/pdf,.pdf"
                      required={!editingItem}
                      onChange={handlePdfFileChange}
                      className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                    />
                    <p className="text-[11px] text-slate-400 mt-2">
                      {editingItem ? 'Select a new PDF if you want to replace the current file.' : 'Selecting a PDF will automatically populate the title.'}
                    </p>
                    {editingItem?.file_name && !pdfFile && (
                      <p className="text-[11px] text-emerald-600 font-medium mt-1">
                        Current file: {editingItem.file_name} ({formatBytes(editingItem.file_size)})
                      </p>
                    )}
                  </div>
                </div>

                {/* Title */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Resource Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      setHasManuallyEditedTitle(true);
                    }}
                    placeholder="e.g. SSC CGL Previous Year Paper 2024"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white font-medium"
                  />
                </div>

                {/* Category */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value as StudyResourceCategory)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white font-medium"
                  >
                    {STUDY_RESOURCE_CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Display Order */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                    placeholder="0 (Lower numbers appear first)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                  />
                  <p className="text-[11px] text-slate-400">
                    Controls sequence order in the student view (0, 1, 2...).
                  </p>
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
                        If checked, this study resource is visible to students in their Study Resources section.
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
                form="study-resource-form"
                disabled={saving}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl flex items-center gap-2 disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingItem ? 'Save Changes' : 'Upload Resource'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(deletingItem)}
        title="Delete Study Resource"
        message={`Are you sure you want to delete "${deletingItem?.title}"? This will permanently remove the database record and its PDF document from storage. This action cannot be undone.`}
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

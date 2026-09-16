import React, { useEffect, useState, useMemo, useRef } from 'react';
import { supabase, uploadPdfFile, uploadImageFile, deletePdfFile, getSecurePdfUrl, formatBytes, PaidEbook } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';
import { BackButton } from '../../components/common/BackButton';
import {
  Search, Plus, Edit2, Trash2, CheckCircle2, FileQuestion,
  Loader2, FileText, Image as ImageIcon, X, UploadCloud, File
} from 'lucide-react';

const CATEGORIES = [
  { value: 'ssc', label: 'SSC E-BOOKS' },
  { value: 'railways', label: 'RAILWAYS E-BOOKS' },
  { value: 'state-exams', label: 'STATE EXAMS E-BOOKS' },
];

export const AdminPaidEbooksPage: React.FC = () => {
  const [ebooks, setEbooks] = useState<PaidEbook[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'published', 'draft'

  // Edit / Add Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEbook, setEditingEbook] = useState<PaidEbook | null>(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('ssc');
  const [price, setPrice] = useState<number | ''>('');
  const [published, setPublished] = useState(false);
  const [displayOrder, setDisplayOrder] = useState<number | ''>('');

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  // Delete State
  const [deletingEbook, setDeletingEbook] = useState<PaidEbook | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadEbooks();
  }, []);

  const loadEbooks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('paid_ebooks')
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEbooks(data as PaidEbook[]);
    } catch (err: any) {
      toast.error('Failed to load Paid E-Books: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingEbook(null);
    setTitle('');
    setDescription('');
    setCategory('ssc');
    setPrice('');
    setPublished(false);
    setDisplayOrder('');
    setPdfFile(null);
    setCoverFile(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (ebook: PaidEbook) => {
    setEditingEbook(ebook);
    setTitle(ebook.title);
    setDescription(ebook.description || '');
    setCategory(ebook.category);
    setPrice(ebook.price);
    setPublished(ebook.published);
    setDisplayOrder(ebook.display_order);
    setPdfFile(null);
    setCoverFile(null);
    setIsModalOpen(true);
  };

  const handlePdfFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPdfFile(file);
      
      // Auto-fill title if empty
      if (!title) {
        const autoTitle = file.name.replace(/\.pdf$/i, '').replace(/[_-]/g, ' ');
        setTitle(autoTitle);
      }
    }
  };

  const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCoverFile(e.target.files[0]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !category || price === '' || (price as number) < 0) {
      toast.error('Please fill all required fields correctly.');
      return;
    }
    if (!editingEbook && !pdfFile) {
      toast.error('PDF file is required for new e-books.');
      return;
    }

    setSaving(true);
    try {
      let filePath = editingEbook?.file_path;
      let fileName = editingEbook?.file_name;
      let fileSize = editingEbook?.file_size;
      let coverImagePath = editingEbook?.cover_image_path;

      // 1. Upload PDF if a new one is selected
      if (pdfFile) {
        const pdfRes = await uploadPdfFile(pdfFile, 'paid_ebooks_pdfs');
        filePath = pdfRes.filePath;
        fileName = pdfRes.fileName;
        fileSize = pdfRes.fileSize;

        // If editing and replacing, we might want to delete the old one. We do it carefully.
        if (editingEbook && editingEbook.file_path !== filePath) {
          await deletePdfFile(editingEbook.file_path);
        }
      }

      // 2. Upload Cover Image if a new one is selected
      if (coverFile) {
        const coverRes = await uploadImageFile(coverFile, 'paid_ebooks_covers');
        coverImagePath = coverRes.filePath;

        if (editingEbook && editingEbook.cover_image_path && editingEbook.cover_image_path !== coverImagePath) {
          await deletePdfFile(editingEbook.cover_image_path);
        }
      }

      const payload = {
        title,
        description: description || null,
        category,
        price: Number(price),
        published,
        display_order: displayOrder === '' ? 0 : Number(displayOrder),
        file_path: filePath,
        file_name: fileName,
        file_size: fileSize,
        cover_image_path: coverImagePath,
      };

      if (editingEbook) {
        const { error } = await supabase
          .from('paid_ebooks')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', editingEbook.id);
        if (error) throw error;
        toast.success('E-Book updated successfully!');
      } else {
        const { error } = await supabase
          .from('paid_ebooks')
          .insert([payload]);
        if (error) throw error;
        toast.success('E-Book created successfully!');
      }

      setIsModalOpen(false);
      loadEbooks();
    } catch (err: any) {
      toast.error('Save failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (ebook: PaidEbook) => {
    try {
      const { error } = await supabase
        .from('paid_ebooks')
        .update({ published: !ebook.published, updated_at: new Date().toISOString() })
        .eq('id', ebook.id);
      
      if (error) throw error;
      toast.success(ebook.published ? 'E-Book unpublished' : 'E-Book published');
      
      setEbooks(ebooks.map(e => e.id === ebook.id ? { ...e, published: !e.published } : e));
    } catch (err: any) {
      toast.error('Failed to change publish status.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingEbook) return;
    setIsDeleting(true);
    try {
      // 1. Delete associated storage files safely
      if (deletingEbook.file_path) {
        await deletePdfFile(deletingEbook.file_path);
      }
      if (deletingEbook.cover_image_path) {
        await deletePdfFile(deletingEbook.cover_image_path); // Works for images too
      }

      // 2. Delete database record
      const { error } = await supabase
        .from('paid_ebooks')
        .delete()
        .eq('id', deletingEbook.id);
      
      if (error) throw error;
      toast.success('E-Book permanently deleted');
      setEbooks(ebooks.filter(e => e.id !== deletingEbook.id));
    } catch (err: any) {
      toast.error('Delete failed: ' + err.message);
    } finally {
      setIsDeleting(false);
      setDeletingEbook(null);
    }
  };

  const filteredEbooks = useMemo(() => {
    return ebooks.filter(e => {
      if (categoryFilter && e.category !== categoryFilter) return false;
      if (statusFilter === 'published' && !e.published) return false;
      if (statusFilter === 'draft' && e.published) return false;
      if (searchTerm && !e.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });
  }, [ebooks, searchTerm, categoryFilter, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="mb-2">
        <BackButton fallbackTo="/admin" label="Back to Dashboard" forceFallback={true} />
      </div>

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Paid E-Books
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage premium e-books, set pricing, upload secure PDFs and publish content.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-bold shadow-sm shadow-blue-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Add E-Book</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Drafts</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="px-6 py-4">Title & Details</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Order</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto" />
                  </td>
                </tr>
              ) : filteredEbooks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="font-medium text-slate-700">No Paid E-Books found</p>
                    <p className="text-xs">Adjust your filters or add a new one.</p>
                  </td>
                </tr>
              ) : (
                filteredEbooks.map((ebook) => (
                  <tr key={ebook.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                          {ebook.cover_image_path ? (
                            <div className="w-full h-full bg-slate-200 text-[10px] flex items-center justify-center text-slate-400">Cover</div>
                          ) : (
                            <ImageIcon className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 line-clamp-1 max-w-[200px]">{ebook.title}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5 max-w-[200px] truncate">{ebook.file_name} • {formatBytes(ebook.file_size)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide uppercase bg-slate-100 text-slate-700">
                        {CATEGORIES.find(c => c.value === ebook.category)?.label || ebook.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800">
                      ₹{ebook.price}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleTogglePublish(ebook)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                          ebook.published
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                            : 'bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300'
                        }`}
                      >
                        {ebook.published ? (
                          <><CheckCircle2 className="w-3 h-3" /><span>Published</span></>
                        ) : (
                          <><FileQuestion className="w-3 h-3" /><span>Draft</span></>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">
                      {ebook.display_order}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(ebook)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingEbook(ebook)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">
                {editingEbook ? 'Edit E-Book' : 'Add Paid E-Book'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5"/>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
              <form id="ebook-form" onSubmit={handleSave} className="space-y-6">
                
                {/* File Upload Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">PDF Document {!editingEbook && '*'}</label>
                    <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:border-blue-400 transition-colors bg-white">
                      <input type="file" accept="application/pdf,.pdf" onChange={handlePdfFileChange} className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer" />
                      {editingEbook && !pdfFile && <p className="text-[10px] text-emerald-600 mt-2 font-medium">Keep existing PDF file</p>}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">Cover Image (Optional)</label>
                    <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:border-blue-400 transition-colors bg-white">
                      <input type="file" accept="image/*" onChange={handleCoverFileChange} className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer" />
                      {editingEbook && editingEbook.cover_image_path && !coverFile && <p className="text-[10px] text-emerald-600 mt-2 font-medium">Keep existing cover image</p>}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-slate-700 block">Title *</label>
                    <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Complete SSC Math 2024" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                  </div>
                  
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-slate-700 block">Description</label>
                    <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description..." className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">Category *</label>
                    <select required value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                      {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">Price (₹) *</label>
                    <input type="number" min="0" required value={price} onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))} placeholder="e.g. 99" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">Display Order</label>
                    <input type="number" value={displayOrder} onChange={(e) => setDisplayOrder(e.target.value === '' ? '' : Number(e.target.value))} placeholder="e.g. 1" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                  </div>

                  <div className="space-y-1.5 pt-6">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <div className="relative">
                        <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} className="sr-only peer" />
                        <div className="w-10 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                      </div>
                      <span className="text-sm font-bold text-slate-800">Publish to Students</span>
                    </label>
                  </div>
                </div>

              </form>
            </div>
            
            <div className="p-5 border-t border-slate-100 flex justify-end gap-3 bg-white rounded-b-2xl">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                Cancel
              </button>
              <button type="submit" form="ebook-form" disabled={saving} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl flex items-center gap-2 disabled:opacity-50 transition-colors shadow-sm">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingEbook ? 'Save Changes' : 'Create E-Book'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(deletingEbook)}
        title="Delete E-Book"
        message={`Are you sure you want to permanently delete "${deletingEbook?.title}"? This will delete the database entry and remove its files from storage. This action cannot be undone.`}
        confirmLabel="Delete Permanently"
        cancelLabel="Cancel"
        isDangerous={true}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeletingEbook(null)}
      />
    </div>
  );
};

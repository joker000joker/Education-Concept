import React, { useState } from 'react';
import { Note, Category } from '../../types';
import { updateNoteRecord, uploadPdfFile, deletePdfFile } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';
import { X, FileText, Upload, Loader2, Check } from 'lucide-react';

interface EditNoteModalProps {
  isOpen: boolean;
  note: Note | null;
  categories: Category[];
  onClose: () => void;
  onUpdated: (updatedNote: Note) => void;
}

export const EditNoteModal: React.FC<EditNoteModalProps> = ({
  isOpen,
  note,
  categories,
  onClose,
  onUpdated,
}) => {
  if (!isOpen || !note) return null;

  const initialCatId = categories.some((c) => c.id === note.category_id)
    ? note.category_id
    : (categories.find((c) => c.id === 12)?.id || categories[0]?.id || 1);

  const [title, setTitle] = useState(note.title);
  const [description, setDescription] = useState(note.description || '');
  const [categoryId, setCategoryId] = useState(initialCatId);
  const [published, setPublished] = useState(note.published);
  const [newFile, setNewFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
        toast.error('Only PDF documents are allowed.');
        return;
      }
      setNewFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }

    try {
      setSaving(true);
      let updatedFilePath = note.file_path;
      let updatedFileName = note.file_name;
      let updatedFileSize = note.file_size || 0;

      // If replacement PDF is selected
      if (newFile) {
        toast.info('Uploading replacement PDF...');
        const uploadResult = await uploadPdfFile(newFile);
        
        // Remove old file from storage
        if (note.file_path) {
          await deletePdfFile(note.file_path);
        }

        updatedFilePath = uploadResult.filePath;
        updatedFileName = uploadResult.fileName;
        updatedFileSize = uploadResult.fileSize;
      }

      const updated = await updateNoteRecord(note.id, {
        title: title.trim(),
        description: description.trim() || null,
        category_id: categoryId,
        published,
        file_path: updatedFilePath,
        file_name: updatedFileName,
        file_size: updatedFileSize,
      });

      toast.success('Note updated successfully');
      onUpdated(updated);
      onClose();
    } catch (err: any) {
      console.error('Update error:', err);
      toast.error(err.message || 'Failed to update note.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative my-8">
        <button
          onClick={onClose}
          disabled={saving}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold text-slate-900 mb-1">Edit Note</h2>
        <p className="text-xs text-slate-500 mb-6">
          Update metadata or replace the underlying PDF file in storage.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 block">Note Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 block">Category / Subject *</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(parseInt(e.target.value, 10))}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 block">Description / Summary</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of concepts covered in this note..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
            />
          </div>

          {/* Replace PDF */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <label className="text-xs font-semibold text-slate-700 block">
              Replace PDF File (Optional)
            </label>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors shadow-2xs">
                <Upload className="w-3.5 h-3.5" />
                <span>Choose Replacement PDF</span>
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              <span className="text-xs text-slate-500 truncate max-w-xs">
                {newFile ? newFile.name : `Current: ${note.file_name}`}
              </span>
            </div>
          </div>

          {/* Published toggle */}
          <div className="pt-3 flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              <span className="ml-3 text-xs font-bold text-slate-700">
                {published ? 'Published (Visible to students)' : 'Draft (Admin only)'}
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 flex items-center gap-1.5 shadow-xs disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>{saving ? 'Saving changes...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

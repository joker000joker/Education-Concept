import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BackButton } from '../../components/common/BackButton';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Category } from '../../types';
import { getCategories, uploadPdfFile, createNoteRecord, formatBytes } from '../../lib/supabase';
import { INITIAL_CATEGORIES } from '../../data/categories';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Plus,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';

export const AdminUploadPage: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [categories, setCategories] = useState<Category[]>(
    INITIAL_CATEGORIES.map((c) => ({ id: c.id, name: c.name }))
  );
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<number>(1);
  const [published, setPublished] = useState<boolean>(true);

  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    getCategories()
      .then((data) => {
        if (data && data.length > 0) {
          setCategories(data);
          setCategoryId(data[0].id);
        }
      })
      .catch(() => {});
  }, []);

  const handleFileValidation = (selectedFile: File) => {
    setErrorMsg(null);
    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.toLowerCase().endsWith('.pdf')) {
      setErrorMsg('Invalid file format. Please upload a valid PDF document (.pdf).');
      return false;
    }

    if (selectedFile.size > 50 * 1024 * 1024) {
      setErrorMsg('File exceeds 50 MB limit. Please compress or optimize the PDF.');
      return false;
    }

    setFile(selectedFile);
    // Auto-fill title if empty based on file name
    if (!title.trim()) {
      const cleanTitle = selectedFile.name.replace(/\.pdf$/i, '').replace(/[_-]/g, ' ');
      setTitle(cleanTitle);
    }
    return true;
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileValidation(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileValidation(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!user) {
      setErrorMsg('Authentication error: you must be logged in.');
      return;
    }

    if (!file) {
      setErrorMsg('Please select a PDF file to upload.');
      return;
    }

    if (!title.trim()) {
      setErrorMsg('Please enter a title for the note.');
      return;
    }

    try {
      setUploading(true);
      toast.info('Step 1/2: Uploading PDF to private storage...');

      // 1. Upload to Supabase Storage 'pdf-notes' bucket
      const uploadRes = await uploadPdfFile(file);

      toast.info('Step 2/2: Registering note in database...');

      // 2. Insert into public.notes table associating uploaded_by with user.id
      const newNote = await createNoteRecord({
        title: title.trim(),
        description: description.trim() || null,
        category_id: categoryId,
        file_path: uploadRes.filePath,
        file_name: uploadRes.fileName,
        file_size: uploadRes.fileSize,
        published,
        uploaded_by: user.id,
      });

      toast.success(`"${newNote.title}" uploaded and registered successfully!`);

      // Redirect to management page
      setTimeout(() => {
        navigate('/admin/notes');
      }, 500);
    } catch (err: any) {
      console.error('Upload flow error:', err);
      setErrorMsg(err.message || 'Failed to complete upload. Please check storage bucket permissions.');
      toast.error('Upload failed. See error details.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="mb-2">
        <BackButton fallbackTo="/admin/notes" label="Back to Notes" forceFallback={true} />
      </div>
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Upload Educational PDF Note
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Store educational PDFs securely in the private <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700 font-mono text-xs">pdf-notes</code> bucket and publish them to students.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{errorMsg}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        {/* PDF File Drag and Drop Zone */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 block">
            PDF Document *
          </label>

          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all ${
              dragActive
                ? 'border-blue-500 bg-blue-50/50'
                : file
                ? 'border-emerald-300 bg-emerald-50/30'
                : 'border-slate-300 hover:border-blue-400 bg-slate-50/50'
            }`}
          >
            {file ? (
              <div className="flex items-center justify-between gap-4 max-w-md mx-auto p-3 bg-white rounded-xl border border-emerald-200 shadow-2xs">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="text-left overflow-hidden">
                    <p className="text-xs font-bold text-slate-900 truncate">{file.name}</p>
                    <p className="text-[11px] text-slate-500">{formatBytes(file.size)}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setFile(null)}
                  disabled={uploading}
                  className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-2xs">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    Drag and drop your PDF file here, or{' '}
                    <label className="text-blue-600 hover:text-blue-700 cursor-pointer underline underline-offset-2">
                      browse
                      <input
                        id="admin-pdf-file-input"
                        type="file"
                        accept="application/pdf,.pdf"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Supports high-resolution PDF documents up to 50 MB
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Note Title */}
        <div className="space-y-1.5">
          <label htmlFor="admin-note-title" className="text-xs font-semibold text-slate-700 block">
            Note Title *
          </label>
          <input
            id="admin-note-title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Modern Indian History - 1857 Revolt to Independence"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {/* Category Selection */}
        <div className="space-y-1.5">
          <label htmlFor="admin-note-category" className="text-xs font-semibold text-slate-700 block">
            Subject / Discipline *
          </label>
          <select
            id="admin-note-category"
            value={categoryId}
            onChange={(e) => setCategoryId(parseInt(e.target.value, 10))}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label htmlFor="admin-note-desc" className="text-xs font-semibold text-slate-700 block">
            Description & Key Topics (Optional)
          </label>
          <textarea
            id="admin-note-desc"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the topics, key equations, or chapters included in this e-note..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
          />
        </div>

        {/* Publish Status Toggle */}
        <div className="pt-2">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              id="admin-note-publish-toggle"
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            <span className="ml-3 text-xs font-bold text-slate-800">
              {published ? 'Publish immediately (Live for students)' : 'Save as Draft (Private)'}
            </span>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/admin/notes')}
            disabled={uploading}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>

          <button
            id="admin-submit-upload-btn"
            type="submit"
            disabled={uploading || !file}
            className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-sm shadow-blue-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing & Uploading...</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4" />
                <span>Upload & Save Note</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

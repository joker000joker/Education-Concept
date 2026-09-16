import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Note } from '../../types';
import { formatBytes, downloadNotePdf, getSecurePdfUrl } from '../../lib/supabase';
import { getCategoryMeta } from '../../data/categories';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { FileText, Download, BookOpen, HardDrive, Loader2, Calendar } from 'lucide-react';

interface NoteCardProps {
  note: Note;
  showCategoryBadge?: boolean;
}

export const NoteCard: React.FC<NoteCardProps> = ({ note, showCategoryBadge = true }) => {
  const [downloading, setDownloading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  const categoryName = note.category?.name || 'General';
  const categoryMeta = getCategoryMeta(categoryName);

  const formattedDate = note.created_at
    ? new Date(note.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Recent';

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      navigate(`/notes/${note.id}`);
      return;
    }

    if (!note.file_path) {
      toast.error('File location is not available.');
      return;
    }

    try {
      setDownloading(true);
      toast.info('Preparing secure download...');
      
      // Attempt authenticated direct download or signed URL fallback
      try {
        await downloadNotePdf(note.file_path, note.file_name || `${note.title}.pdf`);
        toast.success('Download started successfully');
      } catch (dlErr) {
        // Fallback: create signed URL and trigger download link
        const signedUrl = await getSecurePdfUrl(note.file_path, 60);
        if (signedUrl) {
          const a = document.createElement('a');
          a.href = signedUrl;
          a.download = note.file_name || `${note.title}.pdf`;
          a.target = '_blank';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          toast.success('Download link generated');
        } else {
          throw dlErr;
        }
      }
    } catch (err: any) {
      if (err.message === 'FILE_NOT_FOUND' || (err.message && err.message.includes('Object not found'))) {
        console.warn('Download warning: File not found in storage.');
        toast.error('This file could not be found. It may have been deleted.');
      } else {
        console.error('Download error:', err);
        toast.error(err.message || 'Unable to download file. Please try again.');
      }
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      {/* MOBILE COMPACT UI */}
      <div
        id={`note-card-${note.id}-mobile`}
        className="block lg:hidden group relative bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow active:scale-[0.99] flex items-start gap-4"
      >
        {/* Premium PDF Icon */}
        <div className="w-12 h-12 rounded-xl shrink-0 bg-gradient-to-br from-red-500 to-red-600 flex flex-col items-center justify-center text-white shadow-sm border border-red-400">
          <FileText className="w-5 h-5 mb-0.5" />
          <span className="text-[9px] font-bold tracking-wider">PDF</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <Link to={`/notes/${note.id}`} className="block">
            <h3 className="text-sm font-bold text-slate-900 leading-tight line-clamp-2">
              {note.title}
            </h3>
          </Link>
          
          <div className="flex items-center text-[11px] text-slate-500 mt-1.5 mb-3">
            <span className="inline-flex items-center gap-1">
              <HardDrive className="w-3 h-3 text-slate-400" />
              {formatBytes(note.file_size)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              id={`read-note-btn-${note.id}-mobile`}
              to={`/notes/${note.id}`}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white bg-slate-900 hover:bg-blue-600 active:bg-blue-700 shadow-sm transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Read</span>
            </Link>
            <button
              id={`download-note-btn-${note.id}-mobile`}
              onClick={handleDownload}
              disabled={downloading}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 border border-slate-200 shadow-sm transition-colors disabled:opacity-60"
            >
              {downloading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
              ) : (
                <Download className="w-3.5 h-3.5 text-slate-600" />
              )}
              <span>{downloading ? 'Wait...' : 'Download'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* DESKTOP UI */}
      <div
        id={`note-card-${note.id}-desktop`}
        className="hidden lg:flex group relative bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md hover:border-blue-300 transition-all duration-200 flex-col justify-between"
      >
        <div>
          {/* Header meta */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 text-red-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-semibold tracking-wider uppercase text-red-600 bg-red-50/80 px-2 py-0.5 rounded-md border border-red-100">
                PDF
              </span>
            </div>
            {showCategoryBadge && (
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${categoryMeta.borderColor} ${categoryMeta.bgColor} ${categoryMeta.color}`}
              >
                {categoryName}
              </span>
            )}
          </div>

          {/* Title */}
          <Link to={`/notes/${note.id}`} className="block group-hover:text-blue-700 transition-colors">
            <h3 className="text-base font-bold text-slate-900 line-clamp-2 leading-snug">
              {note.title}
            </h3>
          </Link>
          
          {/* Short description */}
          <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
            {note.description || 'Comprehensive study and revision e-notes compiled for quick concept clarity.'}
          </p>
        </div>

        {/* Footer metadata & buttons */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-4">
            <span className="inline-flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5" />
              {formatBytes(note.file_size)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              {/* Date intentionally hidden on desktop as well based on "IMPORTANT: The note upload/created date must NOT be displayed anywhere on the student/user-facing Notes listing." */}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Link
              id={`read-note-btn-${note.id}-desktop`}
              to={`/notes/${note.id}`}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white bg-slate-900 hover:bg-blue-600 active:bg-blue-700 shadow-xs transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Read</span>
            </Link>
            <button
              id={`download-note-btn-${note.id}-desktop`}
              onClick={handleDownload}
              disabled={downloading}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 border border-slate-200 shadow-2xs transition-colors disabled:opacity-60"
            >
              {downloading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
              ) : (
                <Download className="w-3.5 h-3.5 text-slate-600" />
              )}
              <span>{downloading ? 'Downloading...' : 'Download'}</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

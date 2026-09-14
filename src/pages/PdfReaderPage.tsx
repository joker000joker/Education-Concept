import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Note } from '../types';
import { fetchNoteById, getSecurePdfUrl, downloadNotePdf, formatBytes } from '../lib/supabase';
import { getCategoryMeta } from '../data/categories';
import { BackButton } from '../components/common/BackButton';
import { useToast } from '../context/ToastContext';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';

// Set up pdf.js worker using unpkg CDN to avoid bundler issues
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

import {
  FileText,
  Download,
  ExternalLink,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Calendar,
  HardDrive,
  Loader2,
  AlertCircle,
  BookOpen,
  Share2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export const PdfReaderPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [note, setNote] = useState<Note | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [downloading, setDownloading] = useState<boolean>(false);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [documentLoaded, setDocumentLoaded] = useState<boolean>(false);
  const toast = useToast();

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
    setDocumentLoaded(true);
  };

  const changePage = (offset: number) => {
    setPageNumber(prevPageNumber => prevPageNumber + offset);
  };

  const previousPage = () => changePage(-1);
  const nextPage = () => changePage(1);

  useEffect(() => {
    let isMounted = true;

    const loadNoteAndPdf = async () => {
      if (!id) {
        setError('Note ID is required.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch note metadata
        const noteData = await fetchNoteById(id);
        if (!noteData) {
          if (isMounted) {
            setError('Note not found or has been removed.');
            setLoading(false);
          }
          return;
        }

        if (isMounted) {
          setNote(noteData);
        }

        // Fetch temporary signed URL for authorized access from private Supabase Storage bucket 'pdf-notes'
        if (noteData.file_path) {
          const url = await getSecurePdfUrl(noteData.file_path, 3600); // 1 hour expiration
          if (isMounted) {
            setSignedUrl(url);
            if (!url) {
              setError('Could not generate secure view token for this PDF.');
            }
          }
        } else {
          if (isMounted) setError('No associated PDF file found for this note.');
        }
      } catch (err: any) {
        console.error('Error loading note reader:', err);
        if (isMounted) {
          setError(err.message || 'Unable to load PDF note.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadNoteAndPdf();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleDownload = async () => {
    if (!note || !note.file_path) return;
    try {
      setDownloading(true);
      toast.info('Preparing download...');
      try {
        await downloadNotePdf(note.file_path, note.file_name || `${note.title}.pdf`);
        toast.success('Download started');
      } catch (dlErr) {
        // Fallback using signed URL
        if (signedUrl) {
          const a = document.createElement('a');
          a.href = signedUrl;
          a.download = note.file_name || `${note.title}.pdf`;
          a.target = '_blank';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          toast.success('Download triggered');
        } else {
          throw dlErr;
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Download failed');
    } finally {
      setDownloading(false);
    }
  };

  const toggleFullscreen = () => {
    const viewerElement = document.getElementById('pdf-viewer-frame-container');
    if (!viewerElement) return;

    if (!document.fullscreenElement) {
      viewerElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: note?.title || 'Education Concept Note',
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Note link copied to clipboard');
    }
  };

  const categoryName = note?.category?.name || 'General';
  const categoryMeta = getCategoryMeta(categoryName);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <h3 className="text-base font-semibold text-slate-700">Loading secure PDF note...</h3>
        <p className="text-xs text-slate-400">Authenticating access to private repository</p>
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
        <BackButton fallbackTo="/notes" label="Back to Notes" />
        <div className="bg-white rounded-2xl border border-rose-200 p-8 text-center space-y-4 max-w-md mx-auto">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Unable to View Note</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            {error || 'This note does not exist or access permissions could not be validated.'}
          </p>
          <div className="pt-2">
            <Link
              to="/notes"
              className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-semibold text-white bg-slate-900 hover:bg-blue-600"
            >
              Browse All Notes
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <BackButton fallbackTo="/notes" label="Back to Notes" />

        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-2xs transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>

          {signedUrl && (
            <a
              href={signedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-2xs transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open in New Tab</span>
            </a>
          )}

          <button
            id="pdf-download-btn"
            onClick={handleDownload}
            disabled={downloading}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-xs shadow-blue-600/20 transition-colors disabled:opacity-60"
          >
            {downloading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>{downloading ? 'Downloading...' : 'Download PDF'}</span>
          </button>
        </div>
      </div>

      {/* Note Header & Metadata Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${categoryMeta.borderColor} ${categoryMeta.bgColor} ${categoryMeta.color}`}
              >
                {categoryName}
              </span>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-md">
                Verified Material
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
              {note.title}
            </h1>

            {note.description && (
              <p className="text-sm text-slate-600 leading-relaxed pt-1">
                {note.description}
              </p>
            )}
          </div>

          <div className="flex sm:flex-col items-start sm:items-end justify-between sm:justify-center gap-2 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 text-xs text-slate-500 shrink-0">
            <span className="inline-flex items-center gap-1.5 font-medium">
              <HardDrive className="w-3.5 h-3.5 text-slate-400" />
              Size: {formatBytes(note.file_size)}
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Published: {new Date(note.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* PDF Viewer Container */}
      <div
        id="pdf-viewer-frame-container"
        className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl flex flex-col min-h-[680px] lg:min-h-[820px]"
      >
        {/* PDF Viewer Control Bar */}
        <div className="bg-slate-800 text-slate-300 px-4 py-2.5 flex items-center justify-between border-b border-slate-700 text-xs">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-red-400 shrink-0" />
            <span className="font-semibold text-white truncate max-w-[200px] sm:max-w-md">
              {note.file_name || `${note.title}.pdf`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {numPages && (
              <div className="hidden sm:flex items-center gap-2 bg-slate-700/80 rounded-lg px-2 py-1 border border-slate-600 mr-2">
                <button
                  onClick={previousPage}
                  disabled={pageNumber <= 1}
                  className="p-1 rounded hover:bg-slate-600 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono text-[11px] text-slate-300">
                  {pageNumber} / {numPages}
                </span>
                <button
                  onClick={nextPage}
                  disabled={pageNumber >= numPages}
                  className="p-1 rounded hover:bg-slate-600 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="hidden sm:flex items-center gap-1 bg-slate-700/80 rounded-lg p-0.5 border border-slate-600">
              <button
                onClick={() => setZoom((z) => Math.max(50, z - 15))}
                title="Zoom Out"
                className="p-1 rounded hover:bg-slate-600 text-slate-300 hover:text-white transition-colors"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 font-mono text-[11px] text-slate-300">{zoom}%</span>
              <button
                onClick={() => setZoom((z) => Math.min(200, z + 15))}
                title="Zoom In"
                className="p-1 rounded hover:bg-slate-600 text-slate-300 hover:text-white transition-colors"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setZoom(100)}
                title="Reset Zoom"
                className="p-1 rounded hover:bg-slate-600 text-slate-300 hover:text-white transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Viewer'}
              className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Embedded Viewer */}
        <div className="relative flex-1 w-full bg-slate-950 flex flex-col items-center overflow-auto p-4 sm:p-6">
          {signedUrl ? (
            <div
              className="flex flex-col items-center justify-start min-h-full w-full transition-all duration-150"
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
            >
              <Document
                file={signedUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                className="shadow-2xl flex flex-col items-center"
                loading={
                  <div className="flex flex-col items-center justify-center p-12 space-y-4">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    <p className="text-sm text-slate-400">Loading document...</p>
                  </div>
                }
                error={
                  <div className="text-center p-8 space-y-3 bg-slate-900 rounded-2xl border border-slate-800">
                    <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
                    <p className="text-sm text-slate-300">
                      Failed to load PDF viewer.
                    </p>
                    <button
                      onClick={handleDownload}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 mt-4"
                    >
                      Download PDF instead
                    </button>
                  </div>
                }
              >
                <Page
                  pageNumber={pageNumber}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  className="bg-white rounded-md overflow-hidden"
                  loading={
                    <div className="w-[600px] h-[800px] bg-slate-800 animate-pulse rounded-md flex items-center justify-center">
                      <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
                    </div>
                  }
                />
              </Document>

              {/* Mobile pagination controls (visible when not scrolling top) */}
              {numPages && (
                <div className="mt-6 flex sm:hidden items-center justify-center gap-4 bg-slate-800 rounded-xl p-2 px-4 shadow-lg">
                  <button
                    onClick={previousPage}
                    disabled={pageNumber <= 1}
                    className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 text-white" />
                  </button>
                  <span className="font-mono text-sm text-slate-200">
                    {pageNumber} / {numPages}
                  </span>
                  <button
                    onClick={nextPage}
                    disabled={pageNumber >= numPages}
                    className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 text-white" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center p-12 space-y-4 my-auto">
              <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
              <p className="text-sm text-slate-300 max-w-sm">
                Direct embedded rendering not supported or token expired.
              </p>
              <button
                onClick={handleDownload}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700"
              >
                Download PDF to Read
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

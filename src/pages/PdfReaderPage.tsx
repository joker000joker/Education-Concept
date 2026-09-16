import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Note } from '../types';
import { fetchNoteById, getSecurePdfUrl, downloadNotePdf, formatBytes } from '../lib/supabase';
import { getCategoryMeta } from '../data/categories';
import { BackButton } from '../components/common/BackButton';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
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
  ChevronRight,
  Lock
} from 'lucide-react';

export const PdfReaderPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [note, setNote] = useState<Note | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [visiblePage, setVisiblePage] = useState<number>(1);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [showToolbar, setShowToolbar] = useState(true);
  
  const containerRef = React.useRef<HTMLDivElement>(null);
  const observerRef = React.useRef<IntersectionObserver | null>(null);
  const lastScrollY = React.useRef(0);
  
  React.useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };
    updateWidth();
    // Use a small delay for initial render width capture
    setTimeout(updateWidth, 100);
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, [signedUrl]);

  const handleScroll = (e) => {
    const currentScrollY = e.currentTarget.scrollTop;
    if (currentScrollY > lastScrollY.current + 15) {
      setShowToolbar(false);
    } else if (currentScrollY < lastScrollY.current - 15 || currentScrollY < 20) {
      setShowToolbar(true);
    }
    lastScrollY.current = currentScrollY;
  };

  const setPageRef = (index) => (el) => {
    if (!el) return;
    if (!observerRef.current) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const pageNum = Number(entry.target.getAttribute('data-page-number'));
              if (pageNum) setVisiblePage(pageNum);
            }
          });
        },
        { threshold: 0.3 }
      );
    }
    observerRef.current.observe(el);
  };

  const [downloading, setDownloading] = useState<boolean>(false);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [documentLoaded, setDocumentLoaded] = useState<boolean>(false);
  const toast = useToast();
  const { user } = useAuth();

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
    setDocumentLoaded(true);
  };

  

  

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
        if (err.message === 'FILE_NOT_FOUND' || (err.message && err.message.includes('Object not found'))) {
          console.warn('Note reader warning: File not found in storage.');
          if (isMounted) setError('This PDF file could not be found. It may have been deleted.');
        } else {
          console.error('Error loading note reader:', err);
          if (isMounted) {
            setError(err.message || 'Unable to load PDF note.');
          }
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
      if (err.message === 'FILE_NOT_FOUND' || (err.message && err.message.includes('Object not found'))) {
        toast.error('This file could not be found. It may have been deleted.');
      } else {
        toast.error(err.message || 'Download failed');
      }
    } finally {
      setDownloading(false);
    }
  };

  const toggleFullscreen = () => {
    const viewerElement = document.documentElement; // Make the whole page fullscreen
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
    if (!user && note) {
      return (
        <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
          <BackButton fallbackTo="/notes" label="Back to Notes" />
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-6 max-w-md mx-auto shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 text-slate-900 flex items-center justify-center mx-auto ring-4 ring-slate-50/50">
              <Lock className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Sign in to Access</h2>
              <p className="text-sm text-slate-500 leading-relaxed max-w-sm mx-auto">
                This PDF is available for registered students.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                to="/login"
                state={{ from: { pathname: `/notes/${id}` } }}
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-xs"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                state={{ from: { pathname: `/notes/${id}` } }}
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Create Account
              </Link>
            </div>
          </div>
        </div>
      );
    }

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

  // Calculate dynamic page width
  // On mobile, take full width minus small padding. On desktop, max out at 1000px.
  // Then apply user zoom multiplier.
  const padding = window.innerWidth < 640 ? 16 : 48;
  const baseWidth = Math.min(containerWidth - padding, 1000);
  const pageWidth = baseWidth > 0 ? baseWidth * (zoom / 100) : undefined;

  return (
    <div className="fixed inset-0 z-50 bg-[#e8eaed] flex flex-col font-sans">
      {/* Auto-hiding Toolbar */}
      <div 
        className={`absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3 bg-white/95 backdrop-blur-md border-b border-slate-200/50 shadow-sm transition-transform duration-300 ${showToolbar ? 'translate-y-0' : '-translate-y-full'}`}
      >
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <button 
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate('/notes');
              }
            }}
            className="p-1.5 sm:p-2 -ml-1.5 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"
            title="Back to previous page"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <div className="flex flex-col max-w-[150px] sm:max-w-md md:max-w-xl">
            <h1 className="text-sm sm:text-base font-bold text-slate-800 truncate leading-tight">
              {note.title}
            </h1>
            <p className="text-[10px] sm:text-xs font-medium text-slate-500 truncate">
              {note.category?.name || 'Education Concept'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {numPages && (
            <div className="hidden sm:flex items-center px-3 py-1.5 rounded-full bg-slate-100/80 text-xs font-medium text-slate-600 border border-slate-200/50">
              Page {visiblePage} <span className="text-slate-400 mx-1">/</span> {numPages}
            </div>
          )}

          <div className="hidden md:flex items-center gap-0.5 bg-slate-100/80 rounded-full p-0.5 border border-slate-200/50">
            <button
              onClick={() => setZoom((z) => Math.max(50, z - 15))}
              className="p-1.5 rounded-full hover:bg-white hover:shadow-xs text-slate-600 transition-all"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="w-10 text-center font-medium text-xs text-slate-600 select-none">
              {zoom}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(250, z + 15))}
              className="p-1.5 rounded-full hover:bg-white hover:shadow-xs text-slate-600 transition-all"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          <div className="w-px h-6 bg-slate-200 mx-1 hidden sm:block"></div>

          <button
            onClick={toggleFullscreen}
            className="hidden sm:flex p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold transition-all shadow-sm shadow-blue-600/20 disabled:opacity-70"
          >
            {downloading ? <Loader2 className="w-4 h-4 sm:w-4 sm:h-4 animate-spin" /> : <Download className="w-4 h-4 sm:w-4 sm:h-4" />}
            <span className="hidden sm:inline">Download</span>
          </button>
        </div>
      </div>

      {/* PDF Scroll Container */}
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto w-full pt-16 sm:pt-20 pb-12 sm:pb-24 px-2 sm:px-6 scroll-smooth"
      >
        <div className="flex flex-col items-center max-w-full mx-auto">
          {signedUrl ? (
            <Document
              file={signedUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={
                <div className="flex flex-col items-center justify-center p-20 space-y-4">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <p className="text-sm font-medium text-slate-500">Loading document...</p>
                </div>
              }
              error={
                <div className="mt-20 text-center p-8 space-y-4 bg-white rounded-2xl border border-rose-100 max-w-md mx-auto shadow-sm">
                  <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
                  <p className="text-sm font-medium text-slate-800">
                    Failed to load PDF viewer.
                  </p>
                  <button
                    onClick={handleDownload}
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 w-full"
                  >
                    Download PDF instead
                  </button>
                </div>
              }
            >
              {numPages && Array.from(new Array(numPages), (el, index) => (
                <div 
                  key={`page_${index + 1}`}
                  data-page-number={index + 1}
                  ref={setPageRef(index)}
                  className="mb-2 sm:mb-4 bg-white shadow-md transition-shadow hover:shadow-lg flex items-center justify-center"
                  style={{ minHeight: '400px' }}
                >
                  <Page
                    pageNumber={index + 1}
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                    width={pageWidth}
                    loading={
                      <div className="flex items-center justify-center bg-slate-50 w-full h-full text-slate-300">
                        <Loader2 className="w-6 h-6 animate-spin" />
                      </div>
                    }
                  />
                </div>
              ))}
            </Document>
          ) : (
             <div className="mt-32 text-center p-8 space-y-4 bg-white rounded-2xl border border-slate-200 max-w-md mx-auto shadow-sm">
              <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
              <p className="text-sm text-slate-600">
                Direct embedded rendering not supported or token expired.
              </p>
              <button
                onClick={handleDownload}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 w-full"
              >
                Download PDF to Read
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Mobile Page Indicator floating */}
      {numPages && (
        <div className={`sm:hidden fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-slate-900/80 backdrop-blur text-white text-xs font-medium shadow-lg transition-opacity duration-300 ${showToolbar ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          {visiblePage} / {numPages}
        </div>
      )}
    </div>
  );
};

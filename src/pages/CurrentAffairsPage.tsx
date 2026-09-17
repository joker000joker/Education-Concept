import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, formatBytes, getSecurePdfUrl, downloadNotePdf } from '../lib/supabase';
import { CurrentAffair } from '../types';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import {
  ChevronLeft, Newspaper, Search, FileText, Download,
  BookOpen, HardDrive, Calendar, Loader2, FileQuestion
} from 'lucide-react';

export const CurrentAffairsPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();

  const [currentAffairs, setCurrentAffairs] = useState<CurrentAffair[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [actionType, setActionType] = useState<'read' | 'download' | null>(null);

  useEffect(() => {
    fetchCurrentAffairs();
  }, []);

  const fetchCurrentAffairs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('current_affairs')
        .select('*')
        .eq('published', true)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCurrentAffairs((data || []) as CurrentAffair[]);
    } catch (err: any) {
      console.error('Error fetching Current Affairs:', err);
      toast.error('Failed to load Current Affairs: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return currentAffairs;
    const q = searchQuery.toLowerCase();
    return currentAffairs.filter((ca) => ca.title.toLowerCase().includes(q));
  }, [currentAffairs, searchQuery]);

  // Handle Secure Read Action
  const handleRead = async (item: CurrentAffair) => {
    if (!item.file_path) {
      toast.error('PDF file location is unavailable.');
      return;
    }
    navigate(`/notes/${item.id}?type=current-affairs`);
  };

  // Handle Secure Download Action
  const handleDownload = async (item: CurrentAffair) => {
    if (!item.file_path) {
      toast.error('PDF file location is unavailable.');
      return;
    }

    try {
      setActionLoadingId(item.id);
      setActionType('download');
      toast.info('Preparing secure download...');

      const fileName = item.file_name || `${item.title}.pdf`;

      try {
        await downloadNotePdf(item.file_path, fileName);
        toast.success('Download started');
      } catch (dlErr) {
        // Fallback to secure signed URL download
        const signedUrl = await getSecurePdfUrl(item.file_path, 120);
        if (signedUrl) {
          const a = document.createElement('a');
          a.href = signedUrl;
          a.download = fileName;
          a.target = '_blank';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          toast.success('Download link opened');
        } else {
          throw dlErr;
        }
      }
    } catch (err: any) {
      console.error('Download error:', err);
      toast.error('Download failed: ' + (err.message || 'Please try again.'));
    } finally {
      setActionLoadingId(null);
      setActionType(null);
    }
  };

  return (
    <div className="px-4 py-6 pb-24 min-h-screen bg-[#F4F8FF]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 max-w-5xl mx-auto">
        <button
          onClick={() => navigate('/')}
          className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-xs border border-slate-200 text-slate-700 active:scale-95 transition-transform cursor-pointer"
          title="Back to Home"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Current Affairs
          </h1>
          <p className="text-xs text-slate-500">
            Latest exam-oriented current affairs digests & study PDFs
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto space-y-6">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Current Affairs by title, month, year..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white shadow-xs"
          />
        </div>

        {/* Content Listing */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-sm text-slate-500 font-medium">Loading Current Affairs...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center shadow-xs mt-6 max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center mx-auto mb-4 border border-blue-100">
              <Newspaper className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">
              {searchQuery ? 'No Matching Current Affairs' : 'No Current Affairs Available'}
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              {searchQuery
                ? `No digests matched "${searchQuery}". Try a different search term.`
                : 'Current Affairs PDFs will appear here once published.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => {
              const isItemBusy = actionLoadingId === item.id;
              const formattedDate = item.created_at
                ? new Date(item.created_at).toLocaleDateString('en-IN', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'Recent';

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between group"
                >
                  <div>
                    {/* Badge & Meta */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 text-red-600 flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-bold tracking-wider uppercase text-red-600 bg-red-50 px-2 py-0.5 rounded-md border border-red-100">
                          PDF
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium inline-flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {formattedDate}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {item.title}
                    </h3>

                    {/* File Size & Document Name */}
                    <div className="flex items-center text-[11px] text-slate-500 mt-2 mb-4">
                      <span className="inline-flex items-center gap-1">
                        <HardDrive className="w-3 h-3 text-slate-400" />
                        {formatBytes(item.file_size)}
                      </span>
                      {item.file_name && (
                        <>
                          <span className="mx-1.5 text-slate-300">•</span>
                          <span className="truncate max-w-[150px]">{item.file_name}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => handleRead(item)}
                      disabled={isItemBusy}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-blue-600 active:bg-blue-700 shadow-xs transition-colors disabled:opacity-60 cursor-pointer min-h-[44px]"
                    >
                      {isItemBusy && actionType === 'read' ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <BookOpen className="w-3.5 h-3.5" />
                      )}
                      <span>Read</span>
                    </button>

                    <button
                      onClick={() => handleDownload(item)}
                      disabled={isItemBusy}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 border border-slate-200 shadow-xs transition-colors disabled:opacity-60 cursor-pointer min-h-[44px]"
                    >
                      {isItemBusy && actionType === 'download' ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                      ) : (
                        <Download className="w-3.5 h-3.5 text-slate-600" />
                      )}
                      <span>Download</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

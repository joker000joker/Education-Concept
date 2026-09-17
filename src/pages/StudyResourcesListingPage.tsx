import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft, FileCheck2, BookOpen, Calculator, List,
  FileText, Download, Eye, Loader2, Search, HardDrive, Calendar
} from 'lucide-react';
import { supabase, getSecurePdfUrl, downloadNotePdf, formatBytes } from '../lib/supabase';
import { StudyResource } from '../types';
import { useToast } from '../context/ToastContext';

export const StudyResourcesListingPage: React.FC = () => {
  const navigate = useNavigate();
  const { category } = useParams<{ category: string }>();
  const toast = useToast();

  const [resources, setResources] = useState<StudyResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [actionType, setActionType] = useState<'read' | 'download' | null>(null);

  // Normalize category parameter to exact DB category
  const getCategoryMeta = (catParam?: string) => {
    const raw = decodeURIComponent(catParam || '').toLowerCase();
    if (raw === 'pyp' || raw === 'previous-year-papers' || raw.includes('previous')) {
      return {
        dbCategory: 'Previous Year Papers',
        title: 'Previous Year Papers',
        emptyTitle: 'No Previous Year Papers Available',
        emptySubtitle: 'Official previous year question papers will appear here once published.',
        Icon: FileCheck2,
        accentBg: 'bg-rose-50',
        accentText: 'text-rose-600',
        accentBorder: 'border-rose-100',
      };
    }
    if (raw === 'practice-sets' || raw.includes('practice')) {
      return {
        dbCategory: 'Practice Sets',
        title: 'Practice Sets',
        emptyTitle: 'No Practice Sets Available',
        emptySubtitle: 'Curated practice problem sets will appear here once published.',
        Icon: BookOpen,
        accentBg: 'bg-blue-50',
        accentText: 'text-blue-600',
        accentBorder: 'border-blue-100',
      };
    }
    if (raw === 'formula' || raw === 'formula-short-tricks' || raw.includes('formula') || raw.includes('trick')) {
      return {
        dbCategory: 'Formula & Short Tricks',
        title: 'Formula & Short Tricks',
        emptyTitle: 'No Formula & Short Tricks Available',
        emptySubtitle: 'Quick revision formulas and shortcuts will appear here once published.',
        Icon: Calculator,
        accentBg: 'bg-purple-50',
        accentText: 'text-purple-600',
        accentBorder: 'border-purple-100',
      };
    }
    if (raw === 'one-liners' || raw.includes('one-liner') || raw.includes('oneliner')) {
      return {
        dbCategory: 'One-Liners',
        title: 'One-Liners',
        emptyTitle: 'No One-Liners Available',
        emptySubtitle: 'High-yield one-liner revision sheets will appear here once published.',
        Icon: List,
        accentBg: 'bg-emerald-50',
        accentText: 'text-emerald-600',
        accentBorder: 'border-emerald-100',
      };
    }
    // Fallback for direct match or other
    return {
      dbCategory: decodeURIComponent(catParam || 'Study Resources'),
      title: decodeURIComponent(catParam || 'Study Resources'),
      emptyTitle: 'No Study Resources Available',
      emptySubtitle: 'Study materials will appear here once published.',
      Icon: BookOpen,
      accentBg: 'bg-blue-50',
      accentText: 'text-blue-600',
      accentBorder: 'border-blue-100',
    };
  };

  const meta = getCategoryMeta(category);
  const Icon = meta.Icon;

  useEffect(() => {
    loadResources();
  }, [category]);

  const loadResources = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('study_resources')
        .select('*')
        .eq('category', meta.dbCategory)
        .eq('published', true)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setResources((data || []) as StudyResource[]);
    } catch (err: any) {
      console.error('Error loading study resources:', err);
      setResources([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRead = async (item: StudyResource) => {
    if (!item.file_path) {
      toast.error('Document file path is unavailable.');
      return;
    }
    setActionLoadingId(item.id);
    setActionType('read');
    toast.info('Opening document...');

    try {
      const secureUrl = await getSecurePdfUrl(item.file_path, 3600);
      if (!secureUrl) {
        toast.error('Unable to generate secure document URL. Please try again.');
        return;
      }
      window.open(secureUrl, '_blank', 'noopener,noreferrer');
    } catch (err: any) {
      console.error('Error reading PDF:', err);
      toast.error('Failed to open document: ' + (err.message || 'Unknown error'));
    } finally {
      setActionLoadingId(null);
      setActionType(null);
    }
  };

  const handleDownload = async (item: StudyResource) => {
    if (!item.file_path) {
      toast.error('Document file path is unavailable.');
      return;
    }
    setActionLoadingId(item.id);
    setActionType('download');
    toast.info('Starting secure download...');

    try {
      const fileName = item.file_name || `${item.title}.pdf`;
      try {
        await downloadNotePdf(item.file_path, fileName);
        toast.success('Document downloaded successfully');
      } catch (dlErr) {
        // Fallback: fetch short-lived signed URL
        const secureUrl = await getSecurePdfUrl(item.file_path, 120);
        if (secureUrl) {
          const link = document.createElement('a');
          link.href = secureUrl;
          link.download = fileName;
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          toast.success('Download started');
        } else {
          throw dlErr;
        }
      }
    } catch (err: any) {
      console.error('Error downloading document:', err);
      toast.error('Failed to download document: ' + (err.message || 'Please try again.'));
    } finally {
      setActionLoadingId(null);
      setActionType(null);
    }
  };

  const filteredItems = resources.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="px-4 py-6 pb-24 min-h-screen bg-[#F4F8FF]">
      {/* Header */}
      <div className="max-w-5xl mx-auto mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/resources')}
            className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-xs border border-slate-200 text-slate-700 active:scale-95 transition-transform cursor-pointer"
            title="Back to Study Resources"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight line-clamp-1">
              {meta.title}
            </h1>
            <p className="text-xs text-slate-500">
              Exam-oriented study material & practice PDFs
            </p>
          </div>
        </div>

        {/* Search Input if items exist */}
        {resources.length > 0 && (
          <div className="mt-5 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={`Search in ${meta.title}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl shadow-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
            />
          </div>
        )}
      </div>

      {/* Main Body */}
      <div className="max-w-5xl mx-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
            <p className="text-sm text-slate-500 font-medium">Loading {meta.title}...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center shadow-xs mt-6 max-w-md mx-auto">
            <div className={`w-16 h-16 rounded-2xl ${meta.accentBg} ${meta.accentText} border ${meta.accentBorder} flex items-center justify-center mx-auto mb-4`}>
              <Icon className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">
              {searchQuery ? 'No Matching Resources Found' : meta.emptyTitle}
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              {searchQuery
                ? `No documents matched "${searchQuery}". Please check your search term.`
                : meta.emptySubtitle}
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
                : null;

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between group"
                >
                  <div>
                    {/* Badge & Meta */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-10 h-10 rounded-xl ${meta.accentBg} border ${meta.accentBorder} ${meta.accentText} flex items-center justify-center shrink-0`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-bold tracking-wider uppercase text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                          PDF
                        </span>
                      </div>
                      {formattedDate && (
                        <span className="text-[11px] text-slate-400 font-medium inline-flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {formattedDate}
                        </span>
                      )}
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
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-xs transition-colors disabled:opacity-60 cursor-pointer min-h-[44px]"
                    >
                      {isItemBusy && actionType === 'read' ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                      <span>Read</span>
                    </button>

                    <button
                      onClick={() => handleDownload(item)}
                      disabled={isItemBusy}
                      className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 border border-slate-200 transition-colors disabled:opacity-60 cursor-pointer min-h-[44px]"
                      title="Download PDF"
                    >
                      {isItemBusy && actionType === 'download' ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Download className="w-3.5 h-3.5" />
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

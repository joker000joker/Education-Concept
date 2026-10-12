import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, BookOpen, Loader2, Image as ImageIcon, Eye } from 'lucide-react';
import { supabase, getSecurePdfUrl } from '../lib/supabase';

interface FreeEbook {
  id: number;
  title: string;
  description: string | null;
  category: string;
  file_path: string;
  cover_image_path: string | null;
  published: boolean;
  display_order: number;
  created_at: string;
}

export const FreeEbooksListingPage: React.FC = () => {
  const navigate = useNavigate();
  const { category } = useParams<{ category: string }>();
  
  const [ebooks, setEbooks] = useState<FreeEbook[]>([]);
  const [loading, setLoading] = useState(true);
  const [coverUrls, setCoverUrls] = useState<Record<number, string>>({});

  let title = 'Free E-Books';
  if (category === 'ssc') title = 'SSC E-Books';
  if (category === 'railways') title = 'Railways E-Books';
  if (category === 'state-exams') title = 'State Exams E-Books';

  useEffect(() => {
    const fetchEbooks = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('free_ebooks')
          .select('*')
          .eq('category', category)
          .eq('published', true)
          .order('display_order', { ascending: true })
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        const books = data as FreeEbook[];
        setEbooks(books);
        setLoading(false);
        
        // Fetch signed URLs for covers asynchronously in background
        const urls: Record<number, string> = {};
        await Promise.all(
          books.map(async (book) => {
            if (book.cover_image_path) {
              const url = await getSecurePdfUrl(book.cover_image_path);
              if (url) {
                urls[book.id] = url;
              }
            }
          })
        );
        setCoverUrls(urls);
      } catch (err) {
        console.error('Error fetching free ebooks:', err);
      } finally {
        setLoading(false);
      }
    };
    
    if (category) {
      fetchEbooks();
    }
  }, [category]);

  const handleRead = (ebook: FreeEbook) => {
    if (ebook.file_path) {
      navigate(`/notes/${ebook.id}?type=free-ebooks`);
    }
  };

  return (
    <div className="px-4 py-6 pb-24 min-h-screen bg-[#F4F8FF] dark:bg-[#0B0F19]">
      <div className="flex items-center gap-3 mb-8">
        <button 
          onClick={() => navigate('/free-ebooks')} 
          className="w-10 h-10 flex items-center justify-center bg-white dark:bg-[#141C2E] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 active:scale-95 transition-transform"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-slate-900 dark:text-[#F8FAFC] tracking-tight line-clamp-1">{title}</h1>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : ebooks.length === 0 ? (
        <div className="bg-white dark:bg-[#141C2E] rounded-3xl border border-slate-200 dark:border-slate-800 p-8 sm:p-12 text-center shadow-xs mt-12 max-w-md mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-500 dark:text-blue-400 flex items-center justify-center mx-auto mb-4 border border-blue-100 dark:border-blue-900">
            <BookOpen className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-[#F8FAFC] mb-2">No E-Books Available</h2>
          <p className="text-sm text-slate-500 dark:text-[#CBD5E1] leading-relaxed">
            E-books will appear here when available.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {ebooks.map((ebook) => (
            <div key={ebook.id} className="bg-white dark:bg-[#141C2E] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
              <div className="aspect-[3/4] bg-slate-100 dark:bg-[#1B263B] flex items-center justify-center relative overflow-hidden border-b border-slate-100 dark:border-slate-800">
                {coverUrls[ebook.id] ? (
                  <img src={coverUrls[ebook.id]} alt={ebook.title} className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                )}
              </div>
              <div className="p-3 flex flex-col flex-1">
                <h3 className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC] line-clamp-2 leading-snug mb-1">{ebook.title}</h3>
                {ebook.description && (
                  <p className="text-[10px] text-slate-500 dark:text-[#CBD5E1] line-clamp-2 mb-2 leading-relaxed flex-1">
                    {ebook.description}
                  </p>
                )}
                <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button 
                    onClick={() => handleRead(ebook)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-xl transition-colors border border-transparent dark:border-blue-900"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Read Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


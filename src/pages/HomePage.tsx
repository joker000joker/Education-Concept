import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Category, Note } from '../types';
import { INITIAL_CATEGORIES } from '../data/categories';
import { getCategories, fetchNotes } from '../lib/supabase';
import { CategoryCard } from '../components/common/CategoryCard';
import { NoteCard } from '../components/common/NoteCard';
import {
  Search,
  BookOpen,
  ArrowRight,
  Sparkles,
  Download,
  FileCheck2,
  Library,
  GraduationCap,
  ShieldCheck,
  Loader2,
  Book,
  Globe,
  FileText,
  Briefcase,
  MonitorPlay
} from 'lucide-react';
import {
  PaidEbooksIcon,
  FreeEbooksIcon,
  CurrentAffairsIcon,
  NotesIcon,
  SyllabusIcon,
  StudyResourcesIcon,
  DailyQuizIcon,
  ChapterTestIcon,
  SectionalTestIcon,
  TestPassIcon,
  LiveTestIcon,
  CreateTestIcon
} from '../components/icons/PremiumServiceIcons';

const CAROUSEL_BANNERS = [
  { id: 1, image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80', alt: 'Study Materials Banner', title: 'Study Materials Banner', subtitle: 'Discover premium resources tailored for competitive exam success.' },
  { id: 2, image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80', alt: 'Test Series Banner', title: 'Test Series Banner', subtitle: 'Discover premium resources tailored for competitive exam success.' }
];

const MOBILE_TEST_CATEGORIES_ROW1 = [
  { id: 'daily-quiz', title: 'Daily Quiz', icon: DailyQuizIcon, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  { id: 'chapter-wise', title: 'Chapter Wise Test', icon: ChapterTestIcon, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  { id: 'sectional', title: 'Sectional Test', icon: SectionalTestIcon, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
];

const MOBILE_TEST_CATEGORIES_ROW2 = [
  { id: 'test-pass', title: 'Test Pass', icon: TestPassIcon, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  { id: 'live-test', title: 'Live Test', icon: LiveTestIcon, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200' },
  { id: 'create-test', title: 'Create Test', icon: CreateTestIcon, color: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-200' },
];

const PROMO_BANNERS = [
  { id: 1, image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&ar=21:9&q=80', alt: 'Prepare effectively' },
  { id: 2, image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&ar=21:9&q=80', alt: 'Unlock potential' }
];

const SERVICES = [
  { id: 'paid-ebooks', title: 'Paid E-Books', mobileIcon: PaidEbooksIcon, desktopIcon: Book, color: 'text-rose-500', bg: 'bg-rose-100', path: '/paid-ebooks' },
  { id: 'free-ebooks', title: 'Free E-Books', mobileIcon: FreeEbooksIcon, desktopIcon: BookOpen, color: 'text-green-500', bg: 'bg-green-100', path: '/free-ebooks' },
  { id: 'current-affairs', title: 'Current Affairs', mobileIcon: CurrentAffairsIcon, desktopIcon: Globe, color: 'text-blue-500', bg: 'bg-blue-100', path: '/current-affairs' },
  { id: 'notes', title: 'Notes', mobileIcon: NotesIcon, desktopIcon: FileText, color: 'text-purple-500', bg: 'bg-purple-100', path: '/subjects' },
  { id: 'syllabus', title: 'Exam Pattern & Syllabus', mobileIcon: SyllabusIcon, desktopIcon: Briefcase, color: 'text-amber-500', bg: 'bg-amber-100', path: '/syllabus' },
  { id: 'study-resources', title: 'Study Resources', mobileIcon: StudyResourcesIcon, desktopIcon: Library, color: 'text-cyan-500', bg: 'bg-cyan-100', path: '/resources' },
];

const TEST_CATEGORIES = [
  { id: 'banking', title: 'Banking Exams', count: '120+ Tests', icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  { id: 'ssc', title: 'SSC Exams', count: '85+ Tests', icon: FileCheck2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  { id: 'railways', title: 'Railway Exams', count: '60+ Tests', icon: MonitorPlay, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200' },
  { id: 'state-pcs', title: 'State PCS', count: '45+ Tests', icon: Book, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
  { id: 'teaching', title: 'Teaching Exams', count: '90+ Tests', icon: GraduationCap, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  { id: 'defense', title: 'Defense Exams', count: '55+ Tests', icon: ShieldCheck, color: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-200' },
];

interface Banner {
  id: number;
  image: string;
  alt: string;
  title?: string;
  subtitle?: string;
}

const Carousel = ({ banners, className = "mb-6", autoPlayInterval = 4000 }: { banners: Banner[], className?: string, autoPlayInterval?: number }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      if (scrollContainerRef.current) {
        const clientWidth = scrollContainerRef.current.clientWidth;
        const scrollLeft = scrollContainerRef.current.scrollLeft;
        const currentIndex = Math.round(scrollLeft / clientWidth);
        const nextIndex = (currentIndex + 1) % banners.length;
        
        scrollContainerRef.current.scrollTo({
          left: nextIndex * clientWidth,
          behavior: 'smooth'
        });
      }
    }, autoPlayInterval);
    return () => clearInterval(interval);
  }, [banners.length, autoPlayInterval]);

  const scrollToSlide = (index: number) => {
    if (scrollContainerRef.current) {
      const clientWidth = scrollContainerRef.current.clientWidth;
      scrollContainerRef.current.scrollTo({
        left: index * clientWidth,
        behavior: 'smooth'
      });
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    const clientWidth = e.currentTarget.clientWidth;
    const index = Math.round(scrollLeft / clientWidth);
    if (index !== currentSlide) {
      setCurrentSlide(index);
    }
  };

  return (
    <div className={`w-full relative overflow-hidden rounded-2xl shadow-xs group isolate ${className}`}>
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex w-full overflow-x-auto snap-x snap-mandatory scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {banners.map((banner) => (
          <div key={banner.id} className="w-full shrink-0 snap-center relative">
            <img
              src={banner.image}
              alt={banner.alt}
              className="w-full h-auto block rounded-2xl"
            />
            {(banner.title || banner.subtitle) && (
              <>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent rounded-2xl" />
                <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6">
                   {banner.title && <h3 className="text-white font-bold text-lg sm:text-2xl drop-shadow-md">{banner.title}</h3>}
                   {banner.subtitle && <p className="text-white/90 text-xs sm:text-sm drop-shadow-sm mt-1 max-w-md">{banner.subtitle}</p>}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
      {/* Scroll hints */}
      <div className="absolute bottom-3 right-4 flex gap-1.5 z-10">
         {banners.map((_, i) => (
            <div 
              key={i} 
              onClick={() => scrollToSlide(i)}
              className={`w-2 h-2 rounded-full cursor-pointer transition-colors ${i === currentSlide ? 'bg-white' : 'bg-white/50 hover:bg-white/80'}`} 
            />
         ))}
      </div>
    </div>
  );
};

export const HomePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'notes' | 'test'>('notes');
  const [categories, setCategories] = useState<Category[]>(
    INITIAL_CATEGORIES.map((c) => ({ id: c.id, name: c.name }))
  );
  const [latestNotes, setLatestNotes] = useState<Note[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const loadHomeData = async () => {
      try {
        setLoading(true);
        // Load categories from Supabase (or fallback to INITIAL_CATEGORIES)
        const [catData, notesResult] = await Promise.all([
          getCategories().catch(() => []),
          fetchNotes({ publishedOnly: true, limit: 6, sortBy: 'newest' }).catch(() => ({
            notes: [],
            count: 0,
          })),
        ]);

        if (isMounted) {
          if (catData && catData.length > 0) {
            setCategories(catData);
          }
          setLatestNotes(notesResult.notes);

          // Calculate counts by category if possible
          const counts: Record<number, number> = {};
          notesResult.notes.forEach((n) => {
            if (n.category_id) {
              counts[n.category_id] = (counts[n.category_id] || 0) + 1;
            }
          });
          setCategoryCounts(counts);
        }
      } catch (err) {
        console.error('Error loading homepage data:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadHomeData();

    return () => {
      isMounted = false;
    };
  }, []);

  const renderECNotes = () => (
    <section className="mb-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-4 sm:mb-6">
        <div>
          <div className="flex items-center gap-2 text-blue-600 text-xs font-bold uppercase tracking-wider mb-1">
            <Library className="w-4 h-4" />
            <span>Categorized Curriculum</span>
          </div>
          <h2 className="text-lg sm:text-2xl font-bold text-slate-900 tracking-tight">
            EC Notes
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Browse structured study materials organized into 12 essential disciplines.
          </p>
        </div>
        <Link
          to="/subjects"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 group shrink-0"
        >
          <span>View All Subjects</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {categories.map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
            noteCount={categoryCounts[category.id]}
          />
        ))}
      </div>
    </section>
  );

  const renderServices = () => (
    <section className="mb-10">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {SERVICES.map((service) => (
          <Link
            key={service.id}
            to={service.path}
            className="flex sm:flex-col items-center gap-3 sm:gap-4 p-3 sm:p-5 bg-[#0C122A] lg:bg-white rounded-xl border border-[#1E2756] lg:border-slate-200/60 shadow-lg lg:shadow-xs shadow-[#0C122A]/30 lg:shadow-none hover:shadow-xl lg:hover:shadow-md hover:border-[#2D3870] lg:hover:border-blue-200 transition-all group"
          >
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 ${service.bg} ${service.color} group-hover:scale-110 transition-transform`}>
              <service.mobileIcon className="w-7 h-7 lg:hidden" />
              <service.desktopIcon className="w-5 h-5 sm:w-6 sm:h-6 hidden lg:block" />
            </div>
            <span className="text-xs sm:text-sm font-semibold text-white lg:text-slate-700 text-left sm:text-center leading-tight">
              {service.title}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );

  const renderTopRecommendations = () => (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-2xl font-bold text-slate-900 tracking-tight">⭐ Top Recommendations</h2>
        <Link to="/notes" className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
          View All <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      ) : latestNotes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {latestNotes.map((note) => (
            <NoteCard key={note.id} note={note} />
          ))}
        </div>
      ) : (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center text-slate-500 text-sm">
          No recommendations available at the moment.
        </div>
      )}
    </section>
  );

  const renderDesktopTests = () => (
    <section className="mb-12">
      <div className="mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-2xl font-bold text-slate-900 tracking-tight">EC Test Series</h2>
        <p className="text-sm text-slate-500 mt-1">Comprehensive mock tests for all major exams.</p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
        {TEST_CATEGORIES.map((test) => (
          <Link
            key={test.id}
            to={`/tests/${test.id}`}
            className={`flex flex-col items-center text-center p-4 sm:p-6 bg-white rounded-2xl border ${test.border} shadow-2xs hover:shadow-md transition-all group hover:-translate-y-1`}
          >
            <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mb-3 sm:mb-4 ${test.bg} ${test.color} group-hover:scale-110 transition-transform`}>
              <test.icon className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-1">{test.title}</h3>
            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold bg-slate-100 text-slate-600`}>
              {test.count}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );

  const renderMobileTests = () => (
    <section className="mb-8">
      {/* Row 1 */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {MOBILE_TEST_CATEGORIES_ROW1.map((test) => (
          <Link
            key={test.id}
            to={`/tests/${test.id}`}
            className="flex flex-col items-center justify-center text-center p-3 bg-[#0C122A] rounded-2xl border-[#1E2756] border shadow-lg shadow-[#0C122A]/30 active:scale-95 transition-transform"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${test.bg} ${test.color}`}>
              <test.icon className="w-7 h-7" />
            </div>
            <h3 className="text-[11px] font-bold text-white leading-tight">{test.title}</h3>
          </Link>
        ))}
      </div>

      {/* PROMO SLIDER */}
      <Carousel banners={PROMO_BANNERS} className="my-6" autoPlayInterval={5000} />

      {/* Row 2 */}
      <div className="grid grid-cols-3 gap-3">
        {MOBILE_TEST_CATEGORIES_ROW2.map((test) => (
          <Link
            key={test.id}
            to={`/tests/${test.id}`}
            className="flex flex-col items-center justify-center text-center p-3 bg-[#0C122A] rounded-2xl border-[#1E2756] border shadow-lg shadow-[#0C122A]/30 active:scale-95 transition-transform"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${test.bg} ${test.color}`}>
              <test.icon className="w-7 h-7" />
            </div>
            <h3 className="text-[11px] font-bold text-white leading-tight">{test.title}</h3>
          </Link>
        ))}
      </div>
    </section>
  );

  const renderFeatureBanner = () => (
    <section className="mt-8 mb-4 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-10 relative overflow-hidden shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-3 sm:space-y-4">
          <span className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 rounded-full text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30">
            <ShieldCheck className="w-3 h-3 text-blue-400" />
            Verified Educational Standard
          </span>

          <h2 className="text-lg sm:text-3xl font-extrabold tracking-tight leading-tight">
            Designed for Focused, Distraction-Free Exam Preparation
          </h2>

          <p className="text-slate-300 text-[11px] sm:text-sm leading-relaxed max-w-xl">
            Education Concept is built from the ground up for students. No clickbait, no intrusive ads. Just straightforward, syllabus-oriented notes ready to read on phone, tablet, or PC.
          </p>
        </div>
      </div>
    </section>
  );

  return (
    <div className="lg:bg-slate-50/50 min-h-screen pb-6" style={{ backgroundColor: '#F4F8FF' }}>
      {/* Mobile Pill Switch (Sticky below navbar) */}
      <div className="lg:hidden sticky top-14 z-30 bg-white/90 backdrop-blur-md border-b border-[#E2ECFF] lg:border-slate-200 px-4 py-3">
        <div className="flex bg-[#EEF5FF] lg:bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('notes')}
            className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-all ${
              activeTab === 'notes' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            EC Notes
          </button>
          <button
            onClick={() => setActiveTab('test')}
            className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-all ${
              activeTab === 'test' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            EC Test
          </button>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Mobile View */}
        <div className="lg:hidden space-y-8">
          {activeTab === 'notes' ? (
            <>
              <Carousel banners={CAROUSEL_BANNERS} />
              {renderServices()}
              {renderTopRecommendations()}
            </>
          ) : (
            renderMobileTests()
          )}
        </div>

        {/* Desktop View */}
        <div className="hidden lg:block space-y-8">
          <Carousel banners={CAROUSEL_BANNERS} />
          {renderServices()}
          {renderECNotes()}
          {renderDesktopTests()}
          {renderTopRecommendations()}
        </div>
      </div>
      
      {renderFeatureBanner()}
    </div>
  );
};

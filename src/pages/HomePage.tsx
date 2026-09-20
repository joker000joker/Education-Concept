import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Category, Note, TopRecommendation } from '../types';
import { INITIAL_CATEGORIES } from '../data/categories';
import { getCategories, fetchNotes, supabase, getSecurePdfUrl } from '../lib/supabase';
import { fetchPublicRecommendations } from '../services/recommendationService';
import { CategoryCard } from '../components/common/CategoryCard';
import { NoteCard } from '../components/common/NoteCard';
import { RecommendationCard } from '../components/common/RecommendationCard';
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

const MOBILE_TEST_CATEGORIES_ROW1 = [
  { id: 'daily-quiz', title: 'Daily Quiz', icon: DailyQuizIcon, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', path: '/tests/daily-quiz', isActive: false },
  { id: 'chapter-wise', title: 'Chapter Wise Test', icon: ChapterTestIcon, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', path: '/tests/chapter-wise', isActive: false },
  { id: 'sectional', title: 'Sectional Test', icon: SectionalTestIcon, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', path: '/tests/sectional', isActive: true },
];

const MOBILE_TEST_CATEGORIES_ROW2 = [
  { id: 'test-pass', title: 'Test Pass', icon: TestPassIcon, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', path: '/tests/test-pass', isActive: false },
  { id: 'live-test', title: 'Live Test', icon: LiveTestIcon, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200', path: '/tests/live-test', isActive: false },
  { id: 'create-test', title: 'Create Test', icon: CreateTestIcon, color: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-200', path: '/tests/create-test', isActive: false },
];

const SERVICES = [
  { id: 'paid-ebooks', title: 'Paid E-Books', icon: PaidEbooksIcon, color: 'text-rose-500', bg: 'bg-rose-100', path: '/paid-ebooks', subtitle: 'Curated E-Books' },
  { id: 'free-ebooks', title: 'Free E-Books', icon: FreeEbooksIcon, color: 'text-green-500', bg: 'bg-green-100', path: '/free-ebooks', subtitle: 'Free Digital PDFs' },
  { id: 'current-affairs', title: 'Current Affairs', icon: CurrentAffairsIcon, color: 'text-blue-500', bg: 'bg-blue-100', path: '/current-affairs', subtitle: 'Daily & Monthly' },
  { id: 'notes', title: 'Notes', icon: NotesIcon, color: 'text-purple-500', bg: 'bg-purple-100', path: '/subjects', subtitle: '12 Disciplines' },
  { id: 'syllabus', title: 'Exam Pattern & Syllabus', icon: SyllabusIcon, color: 'text-amber-500', bg: 'bg-amber-100', path: '/syllabus', subtitle: 'Official Syllabus' },
  { id: 'study-resources', title: 'Study Resources', icon: StudyResourcesIcon, color: 'text-cyan-500', bg: 'bg-cyan-100', path: '/resources', subtitle: 'Reference Material' },
];

const DESKTOP_TEST_MODULES = [
  {
    id: 'sectional',
    title: 'Sectional Tests',
    hindiTitle: 'सेक्शनल टेस्ट',
    icon: SectionalTestIcon,
    isActive: true,
    badge: 'Active',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    description: 'Subject-wise comprehensive tests covering all 12 core competitive disciplines with timed countdown & full performance analysis.',
    link: '/tests/sectional',
    ctaText: 'Start Sectional Test',
  },
  {
    id: 'daily-quiz',
    title: 'Daily Quiz',
    hindiTitle: 'दैनिक क्विज़',
    icon: DailyQuizIcon,
    isActive: false,
    badge: 'Coming Soon',
    badgeColor: 'bg-slate-100 text-slate-600 border-slate-200',
    description: 'Daily quick mock sets with instant timer and explanation for daily speed revision and concept sharpening.',
    link: '#',
    ctaText: 'Coming Soon',
  },
  {
    id: 'chapter-wise',
    title: 'Chapter Wise Test',
    hindiTitle: 'अध्याय-वार टेस्ट',
    icon: ChapterTestIcon,
    isActive: false,
    badge: 'Coming Soon',
    badgeColor: 'bg-slate-100 text-slate-600 border-slate-200',
    description: 'Chapter & topic specific assessment tests for targeted practice, question drills, and conceptual mastery.',
    link: '#',
    ctaText: 'Coming Soon',
  },
  {
    id: 'test-pass',
    title: 'Test Pass',
    hindiTitle: 'टेस्ट पास',
    icon: TestPassIcon,
    isActive: false,
    badge: 'Coming Soon',
    badgeColor: 'bg-slate-100 text-slate-600 border-slate-200',
    description: 'All-access pass unlocking complete mock test series, sectional tests & previous year papers across all examinations.',
    link: '#',
    ctaText: 'Coming Soon',
  },
];

interface HomeBannerItem {
  id: number;
  image: string;
  alt: string;
  title?: string | null;
  link_url?: string | null;
}

const Carousel = ({
  banners,
  fallbackVariant = 'notes',
  className = "mb-6",
  autoPlayInterval = 4000
}: {
  banners: HomeBannerItem[];
  fallbackVariant?: 'notes' | 'test';
  className?: string;
  autoPlayInterval?: number;
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
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

  // Clean, minimal fallbacks (16:9 ratio, no fake content)
  if (banners.length === 0) {
    if (fallbackVariant === 'test') {
      return (
        <div className={`w-full aspect-[16/9] rounded-2xl bg-gradient-to-r from-[#0C122A] via-[#151D42] to-[#1E2756] border border-[#1E2756] p-6 sm:p-8 flex flex-col justify-center text-white shadow-md relative overflow-hidden isolate ${className}`}>
          <div className="relative z-10 max-w-xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-400/30 mb-2">
              EC Test Series
            </span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white leading-tight">
              Practice • Improve • Prepare
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-md">
              Comprehensive mock tests, chapter-wise tests, and quizzes coming soon.
            </p>
          </div>
        </div>
      );
    }

    // Gracefully hide the banner area when there are no published EC Notes banners.
    // Do NOT show the old static "Distraction-Free Exam Preparation" banner.
    return null;
  }

  return (
    <div className={`w-full relative overflow-hidden rounded-2xl shadow-xs group isolate ${className}`}>
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex w-full overflow-x-auto snap-x snap-mandatory scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {banners.map((banner) => {
          const content = (
            <div className="w-full h-full relative">
              <img
                src={banner.image}
                alt={banner.alt}
                className="w-full h-full object-cover block rounded-2xl"
                loading="lazy"
              />
              {banner.title && (
                <>
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent rounded-2xl pointer-events-none" />
                  <div className="absolute bottom-3 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 pointer-events-none">
                    <h3 className="text-white font-bold text-base sm:text-2xl drop-shadow-md line-clamp-1">{banner.title}</h3>
                  </div>
                </>
              )}
            </div>
          );

          return (
            <div
              key={banner.id}
              className="w-full shrink-0 snap-center relative aspect-[16/9] overflow-hidden rounded-2xl bg-slate-900"
            >
              {banner.link_url ? (
                banner.link_url.startsWith('http') ? (
                  <a href={banner.link_url} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                    {content}
                  </a>
                ) : (
                  <Link to={banner.link_url} className="block w-full h-full">
                    {content}
                  </Link>
                )
              ) : (
                content
              )}
            </div>
          );
        })}
      </div>
      {/* Scroll hints */}
      {banners.length > 1 && (
        <div className="absolute bottom-3 right-4 flex gap-1.5 z-10">
          {banners.map((_, i) => (
            <button 
              key={i} 
              onClick={() => scrollToSlide(i)}
              className={`w-2 h-2 rounded-full cursor-pointer transition-colors ${i === currentSlide ? 'bg-white' : 'bg-white/50 hover:bg-white/80'}`} 
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const HomePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'notes' | 'test'>(tabParam === 'test' ? 'test' : 'notes');
  const [comingSoonModal, setComingSoonModal] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>(
    INITIAL_CATEGORIES.map((c) => ({ id: c.id, name: c.name }))
  );
  const [latestNotes, setLatestNotes] = useState<Note[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<Record<number, number>>({});
  const [topRecommendations, setTopRecommendations] = useState<TopRecommendation[]>([]);
  const [notesBanners, setNotesBanners] = useState<HomeBannerItem[]>([]);
  const [testBanners, setTestBanners] = useState<HomeBannerItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  const navigate = useNavigate();
 
  useEffect(() => {
    if (tabParam === 'test') {
      setActiveTab('test');
    } else if (tabParam === 'notes') {
      setActiveTab('notes');
    }
  }, [tabParam]);

  useEffect(() => {
    let isMounted = true;

    const loadHomeData = async () => {
      try {
        setLoading(true);
        // Load categories, notes, live active banners, and published recommendations in parallel
        const [catData, notesResult, bannerRes, recommendationsData] = await Promise.all([
          getCategories().catch(() => []),
          fetchNotes({ publishedOnly: true, limit: 6, sortBy: 'newest' }).catch(() => ({
            notes: [],
            count: 0,
          })),
          supabase
            .from('banners')
            .select('*')
            .eq('is_active', true)
            .order('display_order', { ascending: true })
            .order('created_at', { ascending: false }),
          fetchPublicRecommendations().catch(() => []),
        ]);

        if (isMounted) {
          if (catData && catData.length > 0) {
            setCategories(catData);
          }
          setLatestNotes(notesResult.notes);
          setTopRecommendations(recommendationsData || []);

          // Calculate counts by category
          const counts: Record<number, number> = {};
          notesResult.notes.forEach((n) => {
            if (n.category_id) {
              counts[n.category_id] = (counts[n.category_id] || 0) + 1;
            }
          });
          setCategoryCounts(counts);

          // Separate and resolve live active banners
          const rawBanners = (bannerRes as any)?.data || [];
          // Load only published/active banners belonging to the EC Notes section
          const rawNotes = rawBanners.filter((b: any) => {
            const sec = (b.section || '').trim().toLowerCase();
            return sec === 'ec notes' || sec === 'home' || sec === 'notes';
          });
          const rawTest = rawBanners.filter((b: any) => {
            const sec = (b.section || '').trim().toLowerCase();
            return sec === 'ec test' || sec === 'test';
          });

          const resolveBannerItems = async (list: any[]): Promise<HomeBannerItem[]> => {
            const items = await Promise.all(
              list.map(async (b: any): Promise<HomeBannerItem | null> => {
                if (!b.image_path) return null;
                let imgUrl = '';
                if (b.image_path.startsWith('http://') || b.image_path.startsWith('https://')) {
                  imgUrl = b.image_path;
                } else {
                  imgUrl = (await getSecurePdfUrl(b.image_path, 3600)) || '';
                }
                if (!imgUrl) return null;
                return {
                  id: b.id,
                  image: imgUrl,
                  alt: b.title || 'Education Concept Banner',
                  title: b.title || undefined,
                  link_url: b.link_url,
                };
              })
            );
            return items.filter((item): item is HomeBannerItem => item !== null);
          };

          const [resolvedNotes, resolvedTest] = await Promise.all([
            resolveBannerItems(rawNotes),
            resolveBannerItems(rawTest),
          ]);

          if (isMounted) {
            setNotesBanners(resolvedNotes);
            setTestBanners(resolvedTest);
          }
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

  // Mobile: 2-column dark navy service cards (restored from BEFORE design)
  const renderMobileServices = () => (
    <div className="grid grid-cols-2 gap-3 mb-6">
      {SERVICES.map((service) => {
        const Icon = service.icon;
        return (
          <Link
            key={service.id}
            to={service.path}
            className="flex items-center gap-3 p-3.5 bg-[#0C122A] rounded-2xl border border-[#1E2756] shadow-lg shadow-[#0C122A]/30 active:scale-98 transition-all group"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${service.bg} ${service.color}`}>
              <Icon className="w-7 h-7" />
            </div>
            <span className="text-xs font-bold text-white leading-tight">
              {service.title}
            </span>
          </Link>
        );
      })}
    </div>
  );

  // Desktop: Core Study Resources section with 6 columns
  const renderDesktopServices = () => (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div>
          <h2 className="text-lg sm:text-2xl font-bold text-slate-900 tracking-tight">
            Core Study Resources
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Everything you need for comprehensive exam preparation in one place.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-5">
        {SERVICES.map((service) => {
          const Icon = service.icon;
          return (
            <Link
              key={service.id}
              to={service.path}
              className="flex flex-col items-center text-center p-4 sm:p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-xl hover:border-blue-300 hover:-translate-y-1 transition-all duration-200 group"
            >
              <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mb-3.5 ${service.bg} ${service.color} group-hover:scale-110 transition-transform shadow-2xs`}>
                <Icon className="w-8 h-8 sm:w-9 sm:h-9" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors leading-tight mb-1">
                {service.title}
              </h3>
              <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium line-clamp-1">
                {service.subtitle}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );

  const renderTopRecommendations = () => {
    if (loading) {
      return (
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span className="text-amber-500">⭐</span> Top Recommendations
            </h2>
          </div>
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        </section>
      );
    }

    // When admin has published top recommendations, render them dynamically
    if (topRecommendations.length > 0) {
      return (
        <section id="top-recommendations-section" className="mb-12">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div>
              <h2 className="text-lg sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span className="text-amber-500">⭐</span> Top Recommendations
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Handpicked, syllabus-aligned notes, e-books, and study resources.
              </p>
            </div>
            <Link to="/notes" className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
              Explore All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {topRecommendations.map((rec) => (
              <RecommendationCard key={rec.id} recommendation={rec} />
            ))}
          </div>
        </section>
      );
    }

    // Clean fallback when top_recommendations has no published items yet
    if (latestNotes.length > 0) {
      return (
        <section id="top-recommendations-section" className="mb-12">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div>
              <h2 className="text-lg sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span className="text-amber-500">⭐</span> Top Recommendations
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Handpicked, syllabus-aligned study material.
              </p>
            </div>
            <Link to="/notes" className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {latestNotes.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        </section>
      );
    }

    return null;
  };

  const renderDesktopTests = () => (
    <section id="ec-test" className="mb-14 pt-8 border-t border-slate-200/80">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200 uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>Online Examination Platform</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            EC Test Series
          </h2>
          <p className="text-sm text-slate-500 mt-1 max-w-xl">
            Subject-wise sectional mock tests and practice assessments designed for competitive examination readiness.
          </p>
        </div>
        <Link
          to="/tests/sectional"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs hover:shadow-md transition-all shrink-0"
        >
          <span>View Sectional Tests</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* EC Test Banner (Uses existing Carousel & published banners) */}
      {testBanners.length > 0 && (
        <Carousel banners={testBanners} fallbackVariant="test" className="mb-8" autoPlayInterval={5000} />
      )}

      {/* 4 Test Modules Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
        {DESKTOP_TEST_MODULES.map((module) => {
          const Icon = module.icon;
          return (
            <div
              key={module.id}
              className={`flex flex-col justify-between p-6 bg-white rounded-3xl border transition-all duration-200 ${
                module.isActive
                  ? 'border-purple-200/90 shadow-2xs hover:shadow-xl hover:border-purple-400 hover:-translate-y-1'
                  : 'border-slate-200/70 opacity-90 shadow-2xs'
              }`}
            >
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xs ${
                      module.isActive ? 'bg-purple-50 text-purple-600' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <Icon className="w-8 h-8" />
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${module.badgeColor}`}
                  >
                    {module.badge}
                  </span>
                </div>

                <div className="mb-2">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                    {module.title}
                  </h3>
                  <span className="text-xs font-semibold text-purple-700">
                    {module.hindiTitle}
                  </span>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed mb-6">
                  {module.description}
                </p>
              </div>

              <div>
                {module.isActive ? (
                  <Link
                    to={module.link}
                    className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white text-xs font-bold shadow-xs hover:shadow-md transition-all group"
                  >
                    <span>{module.ctaText}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="w-full py-3 px-4 rounded-xl bg-slate-100 text-slate-400 text-xs font-bold cursor-not-allowed border border-slate-200/60"
                  >
                    {module.ctaText}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );

  const renderMobileTests = () => (
    <section className="mb-8">
      {/* Row 1 - 3-column test module layout */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {MOBILE_TEST_CATEGORIES_ROW1.map((test) => (
          <Link
            key={test.id}
            to={test.isActive ? test.path : '#'}
            onClick={(e) => {
              if (!test.isActive) {
                e.preventDefault();
                setComingSoonModal(test.title);
              }
            }}
            className="flex flex-col items-center justify-center text-center p-3 bg-[#0C122A] rounded-2xl border-[#1E2756] border shadow-lg shadow-[#0C122A]/30 active:scale-95 transition-transform"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${test.bg} ${test.color}`}>
              <test.icon className="w-7 h-7" />
            </div>
            <h3 className="text-[11px] font-bold text-white leading-tight">{test.title}</h3>
          </Link>
        ))}
      </div>

      {/* EC TEST PROMO SLIDER (Live active banners from Supabase) */}
      <Carousel banners={testBanners} fallbackVariant="test" className="my-6" autoPlayInterval={5000} />

      {/* Row 2 - 3-column test module layout with Test Pass */}
      <div className="grid grid-cols-3 gap-3">
        {MOBILE_TEST_CATEGORIES_ROW2.map((test) => (
          <Link
            key={test.id}
            to={test.isActive ? test.path : '#'}
            onClick={(e) => {
              if (!test.isActive) {
                e.preventDefault();
                setComingSoonModal(test.title);
              }
            }}
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
      {/* Mobile Pill Switch (Normal page flow below navbar) */}
      <div className="lg:hidden bg-white border-b border-[#E2ECFF] px-4 py-3">
        <div className="flex bg-[#EEF5FF] lg:bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => {
              setActiveTab('notes');
              setSearchParams({}, { replace: true });
            }}
            className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-all ${
              activeTab === 'notes' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            EC Notes
          </button>
          <button
            onClick={() => {
              setActiveTab('test');
              setSearchParams({ tab: 'test' }, { replace: true });
            }}
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
        <div className="lg:hidden space-y-6">
          {activeTab === 'notes' ? (
            <>
              <Carousel banners={notesBanners} fallbackVariant="notes" />
              {renderMobileServices()}
              {renderTopRecommendations()}
            </>
          ) : (
            renderMobileTests()
          )}
        </div>

        {/* Desktop View */}
        <div className="hidden lg:block space-y-10">
          <Carousel banners={notesBanners} fallbackVariant="notes" />
          {renderDesktopServices()}
          {renderECNotes()}
          {renderTopRecommendations()}
          {renderDesktopTests()}
        </div>
      </div>
      
      {renderFeatureBanner()}

      {/* Coming Soon Modal for Pending Test Modules */}
      {comingSoonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-xs w-full shadow-2xl border border-slate-100 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">{comingSoonModal}</h3>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              This module is currently being finalized for competitive examination preparation and will be available soon. Sectional Tests are live now!
            </p>
            <button
              onClick={() => setComingSoonModal(null)}
              className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

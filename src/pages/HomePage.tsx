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
    color: 'text-purple-500',
    bg: 'bg-purple-100',
    isActive: true,
    badge: 'Active',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    description: 'Subject-wise comprehensive tests covering all 12 core competitive disciplines with timed countdown.',
    link: '/tests/sectional',
    ctaText: 'Start Sectional Test',
  },
  {
    id: 'chapter-wise',
    title: 'Chapter Wise Test',
    hindiTitle: 'अध्याय-वार टेस्ट',
    icon: ChapterTestIcon,
    color: 'text-emerald-500',
    bg: 'bg-emerald-100',
    isActive: false,
    badge: 'Coming Soon',
    badgeColor: 'bg-slate-100 text-slate-600 border-slate-200',
    description: 'Chapter & topic specific assessment tests for targeted practice and conceptual drills.',
    link: '#',
    ctaText: 'Coming Soon',
  },
  {
    id: 'daily-quiz',
    title: 'Daily Quiz',
    hindiTitle: 'दैनिक क्विज़',
    icon: DailyQuizIcon,
    color: 'text-blue-500',
    bg: 'bg-blue-100',
    isActive: false,
    badge: 'Coming Soon',
    badgeColor: 'bg-slate-100 text-slate-600 border-slate-200',
    description: 'Daily quick mock sets with instant timer and explanation for rapid concept revision.',
    link: '#',
    ctaText: 'Coming Soon',
  },
  {
    id: 'test-pass',
    title: 'Test Pass',
    hindiTitle: 'टेस्ट पास',
    icon: TestPassIcon,
    color: 'text-amber-500',
    bg: 'bg-amber-100',
    isActive: false,
    badge: 'Coming Soon',
    badgeColor: 'bg-slate-100 text-slate-600 border-slate-200',
    description: 'All-access pass unlocking complete mock test series and previous year papers.',
    link: '#',
    ctaText: 'Coming Soon',
  },
  {
    id: 'live-test',
    title: 'Live Test',
    hindiTitle: 'लाइव टेस्ट',
    icon: LiveTestIcon,
    color: 'text-rose-500',
    bg: 'bg-rose-100',
    isActive: false,
    badge: 'Coming Soon',
    badgeColor: 'bg-slate-100 text-slate-600 border-slate-200',
    description: 'Real-time scheduled mock exams simulating examination hall pressure and percentile ranking.',
    link: '#',
    ctaText: 'Coming Soon',
  },
  {
    id: 'create-test',
    title: 'Create Test',
    hindiTitle: 'कस्टम टेस्ट',
    icon: CreateTestIcon,
    color: 'text-cyan-500',
    bg: 'bg-cyan-100',
    isActive: false,
    badge: 'Coming Soon',
    badgeColor: 'bg-slate-100 text-slate-600 border-slate-200',
    description: 'Customize practice tests with self-selected questions, time limits, and subjects.',
    link: '#',
    ctaText: 'Coming Soon',
  },
];

interface HomeBannerItem {
  id: number;
  image: string;
  imagePath?: string;
  alt: string;
  title?: string | null;
  link_url?: string | null;
}

// Session-level signed URL cache to avoid redundant roundtrips across navigation
interface CachedBannerUrl {
  url: string;
  expiresAt: number; // Unix timestamp in ms
}

const SESSION_BANNER_CACHE_KEY = 'ec_banner_signed_urls_v1';
const bannerUrlMemoryCache = new Map<string, CachedBannerUrl>();

// Memory cache for parsed banner items to enable instant 0ms restoration on route returns
let memoryCachedNotesBanners: HomeBannerItem[] | null = null;
let memoryCachedTestBanners: HomeBannerItem[] | null = null;

// Initialize memory cache from sessionStorage if available
try {
  const stored = sessionStorage.getItem(SESSION_BANNER_CACHE_KEY);
  if (stored) {
    const parsed: Record<string, CachedBannerUrl> = JSON.parse(stored);
    const now = Date.now();
    Object.entries(parsed).forEach(([key, val]) => {
      if (val?.url && val.expiresAt > now + 60_000) {
        bannerUrlMemoryCache.set(key, val);
      }
    });
  }
} catch {
  // Gracefully ignore storage quota / sandbox restrictions
}

function getValidCachedBannerUrl(path: string): string | null {
  const now = Date.now();
  const cached = bannerUrlMemoryCache.get(path);
  if (cached && cached.expiresAt > now + 60_000) {
    return cached.url;
  }
  return null;
}

function setCachedBannerUrl(path: string, url: string, expiresInSeconds = 3600) {
  const expiresAt = Date.now() + (expiresInSeconds - 60) * 1000;
  const item: CachedBannerUrl = { url, expiresAt };
  bannerUrlMemoryCache.set(path, item);

  try {
    const raw = sessionStorage.getItem(SESSION_BANNER_CACHE_KEY);
    const map: Record<string, CachedBannerUrl> = raw ? JSON.parse(raw) : {};
    map[path] = item;
    sessionStorage.setItem(SESSION_BANNER_CACHE_KEY, JSON.stringify(map));
  } catch {
    // Ignore storage errors
  }
}

function invalidateCachedBannerUrl(path: string) {
  bannerUrlMemoryCache.delete(path);
  try {
    const raw = sessionStorage.getItem(SESSION_BANNER_CACHE_KEY);
    if (raw) {
      const map: Record<string, CachedBannerUrl> = JSON.parse(raw);
      delete map[path];
      sessionStorage.setItem(SESSION_BANNER_CACHE_KEY, JSON.stringify(map));
    }
  } catch {
    // Ignore storage errors
  }
}

const Carousel = ({
  banners,
  fallbackVariant = 'notes',
  className = "mb-6",
  autoPlayInterval = 4000,
  onImageError,
}: {
  banners: HomeBannerItem[];
  fallbackVariant?: 'notes' | 'test';
  className?: string;
  autoPlayInterval?: number;
  onImageError?: (bannerId: number, imagePath?: string) => void;
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [firstImageLoaded, setFirstImageLoaded] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Safety fallback: allow off-screen slides to load after 2.5s even if onLoad hasn't fired
  useEffect(() => {
    const timer = setTimeout(() => setFirstImageLoaded(true), 2500);
    return () => clearTimeout(timer);
  }, []);

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
    setHasInteracted(true);
    if (scrollContainerRef.current) {
      const clientWidth = scrollContainerRef.current.clientWidth;
      scrollContainerRef.current.scrollTo({
        left: index * clientWidth,
        behavior: 'smooth'
      });
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setHasInteracted(true);
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
        onTouchStart={() => setHasInteracted(true)}
        className="flex w-full overflow-x-auto snap-x snap-mandatory scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {banners.map((banner, index) => {
          const isFirst = index === 0;
          // First banner renders and downloads immediately. Subsequent banners
          // wait until first banner finishes loading or user swipes/interacts.
          const shouldLoad = isFirst || firstImageLoaded || hasInteracted || currentSlide > 0;

          const content = (
            <div className="w-full h-full relative">
              {shouldLoad ? (
                <img
                  src={banner.image}
                  alt={banner.alt}
                  className="w-full h-full object-cover block rounded-2xl"
                  loading={isFirst ? "eager" : "lazy"}
                  {...(isFirst ? { fetchPriority: "high" } : {})}
                  onLoad={isFirst ? () => setFirstImageLoaded(true) : undefined}
                  onError={() => {
                    if (isFirst) setFirstImageLoaded(true);
                    onImageError?.(banner.id, banner.imagePath);
                  }}
                />
              ) : (
                <div className="w-full h-full bg-slate-900 rounded-2xl" />
              )}
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
  const [notesBanners, setNotesBanners] = useState<HomeBannerItem[]>(() => memoryCachedNotesBanners || []);
  const [testBanners, setTestBanners] = useState<HomeBannerItem[]>(() => memoryCachedTestBanners || []);
  const [loading, setLoading] = useState(true);
  
  const navigate = useNavigate();

  const handleBannerImageError = async (bannerId: number, imagePath?: string) => {
    if (!imagePath) return;
    invalidateCachedBannerUrl(imagePath);
    try {
      const freshUrl = await getSecurePdfUrl(imagePath, 3600);
      if (freshUrl) {
        setCachedBannerUrl(imagePath, freshUrl, 3600);
        setNotesBanners((prev) =>
          prev.map((b) => (b.id === bannerId ? { ...b, image: freshUrl } : b))
        );
        setTestBanners((prev) =>
          prev.map((b) => (b.id === bannerId ? { ...b, image: freshUrl } : b))
        );
      }
    } catch (err) {
      console.warn('Failed to refresh banner signed URL:', err);
    }
  };

  useEffect(() => {
    if (tabParam === 'test') {
      setActiveTab('test');
    } else if (tabParam === 'notes') {
      setActiveTab('notes');
    }
  }, [tabParam]);

  useEffect(() => {
    let isMounted = true;

    // 1. Decoupled, independent banner fetch & URL resolution
    // Runs immediately without waiting for categories, notes, or recommendations
    const loadBanners = async () => {
      try {
        const bannerRes = await supabase
          .from('banners')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true })
          .order('created_at', { ascending: false });

        if (!isMounted) return;

        const rawBanners = (bannerRes as any)?.data || [];
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
                // Reuse valid session cache or request fresh 1-hour signed URL
                const cached = getValidCachedBannerUrl(b.image_path);
                if (cached) {
                  imgUrl = cached;
                } else {
                  const fresh = await getSecurePdfUrl(b.image_path, 3600);
                  if (fresh) {
                    setCachedBannerUrl(b.image_path, fresh, 3600);
                    imgUrl = fresh;
                  }
                }
              }
              if (!imgUrl) return null;
              return {
                id: b.id,
                image: imgUrl,
                imagePath: b.image_path,
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
          memoryCachedNotesBanners = resolvedNotes;
          memoryCachedTestBanners = resolvedTest;
          setNotesBanners(resolvedNotes);
          setTestBanners(resolvedTest);
        }
      } catch (err) {
        console.warn('Error loading homepage banners:', err);
      }
    };

    // 2. Original Home data loading (categories, notes, recommendations)
    const loadHomeData = async () => {
      try {
        setLoading(true);
        const [catData, notesResult, recommendationsData] = await Promise.all([
          getCategories().catch(() => []),
          fetchNotes({ publishedOnly: true, limit: 6, sortBy: 'newest' }).catch(() => ({
            notes: [],
            count: 0,
          })),
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
        }
      } catch (err) {
        console.error('Error loading homepage data:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadBanners();
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

  // Desktop: EC Notes section with 6 service cards
  const renderDesktopServices = () => (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div>
          <h2 className="text-lg sm:text-2xl font-bold text-slate-900 tracking-tight">
            EC Notes
          </h2>
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
    <section id="ec-test" className="mb-12 pt-6 border-t border-slate-200/80">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-4 sm:mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            EC Test Series
          </h2>
        </div>
      </div>

      {/* Compact 6 Test Modules Grid matching EC Notes service-card layout */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-5">
        {DESKTOP_TEST_MODULES.map((module) => {
          const Icon = module.icon;
          const cardContent = (
            <>
              {/* Status State Badge */}
              <span
                className={`absolute top-2.5 right-2.5 inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold border ${module.badgeColor}`}
              >
                {module.isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />
                )}
                {module.badge}
              </span>

              {/* Icon Container matching EC Notes dimensions & hover */}
              <div
                className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mb-3.5 ${module.bg} ${module.color} group-hover:scale-110 transition-transform shadow-2xs`}
              >
                <Icon className="w-8 h-8 sm:w-9 sm:h-9" />
              </div>

              {/* Title */}
              <h3
                className={`text-xs sm:text-sm font-bold text-slate-800 ${
                  module.isActive ? 'group-hover:text-purple-600' : 'group-hover:text-slate-900'
                } transition-colors leading-tight mb-1`}
              >
                {module.title}
              </h3>

              {/* Subtitle / Hindi Title matching EC Notes typography */}
              <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium line-clamp-1">
                {module.hindiTitle}
              </p>
            </>
          );

          if (module.isActive) {
            return (
              <Link
                key={module.id}
                to={module.link}
                className="relative flex flex-col items-center text-center p-4 sm:p-5 bg-white rounded-2xl border border-purple-200/90 shadow-2xs hover:shadow-xl hover:border-purple-400 hover:-translate-y-1 transition-all duration-200 group cursor-pointer w-full"
              >
                {cardContent}
              </Link>
            );
          }

          return (
            <button
              key={module.id}
              type="button"
              onClick={() => setComingSoonModal(module.title)}
              className="relative flex flex-col items-center text-center p-4 sm:p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-xl hover:border-slate-300 hover:-translate-y-1 transition-all duration-200 group cursor-pointer w-full text-slate-800"
            >
              {cardContent}
            </button>
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
      <Carousel
        banners={testBanners}
        fallbackVariant="test"
        className="my-6"
        autoPlayInterval={5000}
        onImageError={handleBannerImageError}
      />

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
    <section className="lg:hidden mt-8 mb-4 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
              <Carousel
                banners={notesBanners}
                fallbackVariant="notes"
                onImageError={handleBannerImageError}
              />
              {renderMobileServices()}
              {renderTopRecommendations()}
            </>
          ) : (
            renderMobileTests()
          )}
        </div>

        {/* Desktop View */}
        <div className="hidden lg:block space-y-10">
          {renderDesktopServices()}
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

import React from 'react';
import {
  MathIcon,
  HistoryIcon,
  GeographyIcon,
  PolityIcon,
  EconomicsIcon,
  PhysicsIcon,
  ChemistryIcon,
  BiologyIcon,
  CurrentAffairsSubjectIcon,
  HindiIcon
} from '../components/icons/PremiumSubjectIcons';
import { Brain, BookOpen } from 'lucide-react';
import { SectionalSubject } from '../types';

export interface SubjectMeta {
  name: SectionalSubject;
  slug: string;
  hindiName: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  border: string;
  description: string;
}

export const SECTIONAL_SUBJECTS_LIST: SubjectMeta[] = [
  {
    name: 'Mathematics',
    slug: 'mathematics',
    hindiName: 'गणित',
    icon: MathIcon,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    description: 'Arithmetic, Algebra, Geometry, Mensuration & Trigonometry'
  },
  {
    name: 'Reasoning',
    slug: 'reasoning',
    hindiName: 'तर्कशक्ति',
    icon: Brain,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    description: 'Verbal, Non-Verbal, Logical deduction, Syllogisms & Puzzles'
  },
  {
    name: 'English',
    slug: 'english',
    hindiName: 'अंग्रेज़ी',
    icon: BookOpen,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    description: 'Grammar, Vocabulary, Comprehension & Error Spotting'
  },
  {
    name: 'Hindi',
    slug: 'hindi',
    hindiName: 'सामान्य हिंदी',
    icon: HindiIcon,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    description: 'व्याकरण, वर्तनी, संधि, समास, पर्यायवाची व विलोम शब्द'
  },
  {
    name: 'Current Affairs',
    slug: 'current-affairs',
    hindiName: 'करेंट अफेयर्स',
    icon: CurrentAffairsSubjectIcon,
    color: 'text-cyan-600',
    bg: 'bg-cyan-50',
    border: 'border-cyan-200',
    description: 'National & International Summits, Awards, Defense & Schemes'
  },
  {
    name: 'History',
    slug: 'history',
    hindiName: 'इतिहास',
    icon: HistoryIcon,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    description: 'Ancient, Medieval & Modern Indian National Movement'
  },
  {
    name: 'Geography',
    slug: 'geography',
    hindiName: 'भूगोल',
    icon: GeographyIcon,
    color: 'text-teal-600',
    bg: 'bg-teal-50',
    border: 'border-teal-200',
    description: 'Indian & World Physical, Climate, Rivers & Economic Geography'
  },
  {
    name: 'Polity',
    slug: 'polity',
    hindiName: 'राजव्यवस्था',
    icon: PolityIcon,
    color: 'text-rose-600',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    description: 'Constitution, Fundamental Rights, Parliament & Judiciary'
  },
  {
    name: 'Economics',
    slug: 'economics',
    hindiName: 'अर्थशास्त्र',
    icon: EconomicsIcon,
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    description: 'Banking, Budget, Inflation, National Income & Schemes'
  },
  {
    name: 'Physics',
    slug: 'physics',
    hindiName: 'भौतिक विज्ञान',
    icon: PhysicsIcon,
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    description: 'Mechanics, Heat, Optics, Electricity & Magnetism'
  },
  {
    name: 'Chemistry',
    slug: 'chemistry',
    hindiName: 'रसायन विज्ञान',
    icon: ChemistryIcon,
    color: 'text-pink-600',
    bg: 'bg-pink-50',
    border: 'border-pink-200',
    description: 'Atomic structure, Periodic Table, Acids, Bases & Metals'
  },
  {
    name: 'Biology',
    slug: 'biology',
    hindiName: 'जीव विज्ञान',
    icon: BiologyIcon,
    color: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-200',
    description: 'Human Anatomy, Diseases, Cell Biology, Botany & Nutrition'
  }
];

export function getSubjectBySlug(slug: string): SubjectMeta | undefined {
  const clean = (slug || '').toLowerCase().trim();
  return SECTIONAL_SUBJECTS_LIST.find(
    (s) => s.slug.toLowerCase() === clean || s.name.toLowerCase() === clean
  );
}

export function getSubjectByName(name: string): SubjectMeta | undefined {
  const clean = (name || '').toLowerCase().trim();
  return SECTIONAL_SUBJECTS_LIST.find(
    (s) => s.name.toLowerCase() === clean || s.slug.toLowerCase() === clean
  );
}

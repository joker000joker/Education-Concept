import { CategoryMeta } from '../types';

export const INITIAL_CATEGORIES: CategoryMeta[] = [
  {
    id: 1,
    name: 'Mathematics',
    iconName: 'Calculator',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 hover:bg-blue-100/80',
    borderColor: 'border-blue-200',
    description: 'Formulas, theorems, algebra, calculus, and problem solving sets.',
  },
  {
    id: 2,
    name: 'History',
    iconName: 'Landmark',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50 hover:bg-amber-100/80',
    borderColor: 'border-amber-200',
    description: 'Ancient, Medieval, Modern world history, and national movements.',
  },
  {
    id: 3,
    name: 'Geography',
    iconName: 'Globe2',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50 hover:bg-emerald-100/80',
    borderColor: 'border-emerald-200',
    description: 'Physical geography, climate, topography, maps, and demographics.',
  },
  {
    id: 4,
    name: 'Polity',
    iconName: 'Scale',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50 hover:bg-indigo-100/80',
    borderColor: 'border-indigo-200',
    description: 'Constitution, governance, fundamental rights, and political systems.',
  },
  {
    id: 5,
    name: 'Economics',
    iconName: 'TrendingUp',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50 hover:bg-cyan-100/80',
    borderColor: 'border-cyan-200',
    description: 'Macroeconomics, microeconomics, public finance, and development.',
  },
  {
    id: 6,
    name: 'Physics',
    iconName: 'Atom',
    color: 'text-violet-600',
    bgColor: 'bg-violet-50 hover:bg-violet-100/80',
    borderColor: 'border-violet-200',
    description: 'Mechanics, electromagnetism, optics, thermodynamics, and modern physics.',
  },
  {
    id: 7,
    name: 'Chemistry',
    iconName: 'FlaskConical',
    color: 'text-teal-600',
    bgColor: 'bg-teal-50 hover:bg-teal-100/80',
    borderColor: 'border-teal-200',
    description: 'Organic, inorganic, physical reactions, atomic models, and formulas.',
  },
  {
    id: 8,
    name: 'Biology',
    iconName: 'Dna',
    color: 'text-rose-600',
    bgColor: 'bg-rose-50 hover:bg-rose-100/80',
    borderColor: 'border-rose-200',
    description: 'Botany, zoology, human anatomy, genetics, and ecology.',
  },
  {
    id: 10,
    name: 'Hindi',
    iconName: 'BookOpenCheck',
    color: 'text-red-600',
    bgColor: 'bg-red-50 hover:bg-red-100/80',
    borderColor: 'border-red-200',
    description: 'Vyakaran, literature, comprehension, vocabulary, and exam notes.',
  },
  {
    id: 11,
    name: 'Static GK',
    iconName: 'Award',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 hover:bg-purple-100/80',
    borderColor: 'border-purple-200',
    description: 'Important dates, awards, national symbols, capitals, and monuments.',
  },
  {
    id: 12,
    name: 'Other E-Notes',
    iconName: 'Layers',
    color: 'text-slate-700',
    bgColor: 'bg-slate-100 hover:bg-slate-200/80',
    borderColor: 'border-slate-300',
    description: 'Miscellaneous handbooks, study planners, mock questions, and guides.',
  },
];

export function getCategoryMeta(idOrName: number | string): CategoryMeta {
  if (typeof idOrName === 'number') {
    // Gracefully map legacy id 9 (Current Affairs) to Other E-Notes
    if (idOrName === 9) {
      const other = INITIAL_CATEGORIES.find((c) => c.id === 12);
      if (other) return other;
    }
    const found = INITIAL_CATEGORIES.find((c) => c.id === idOrName);
    if (found) return found;
  } else {
    const clean = idOrName.trim().toLowerCase();
    if (clean === 'current affairs' || clean === 'current-affairs') {
      const other = INITIAL_CATEGORIES.find((c) => c.id === 12);
      if (other) return other;
    }
    const found = INITIAL_CATEGORIES.find(
      (c) => c.name.toLowerCase() === clean || c.name.toLowerCase().replace(/\s+/g, '-') === clean
    );
    if (found) return found;
  }

  return {
    id: 12,
    name: typeof idOrName === 'string' ? idOrName : 'General Subject',
    iconName: 'FileText',
    color: 'text-slate-600',
    bgColor: 'bg-slate-50 hover:bg-slate-100',
    borderColor: 'border-slate-200',
    description: 'Curated educational notes and resources.',
  };
}

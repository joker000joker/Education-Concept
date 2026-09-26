import React from 'react';
import {
  Calculator,
  Brain,
  BookOpen,
  Languages,
  Newspaper,
  Landmark,
  Globe,
  Building2,
  TrendingUp,
  Atom,
  FlaskConical,
  Dna,
  Compass,
  FileText
} from 'lucide-react';

export const MathIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <Calculator className={className} />
);

export const ReasoningIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <Brain className={className} />
);

export const EnglishIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <BookOpen className={className} />
);

export const HindiIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <Languages className={className} />
);

export const CurrentAffairsSubjectIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <Newspaper className={className} />
);

export const HistoryIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <Landmark className={className} />
);

export const GeographyIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <Globe className={className} />
);

export const PolityIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <Building2 className={className} />
);

export const EconomicsIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <TrendingUp className={className} />
);

export const PhysicsIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <Atom className={className} />
);

export const ChemistryIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <FlaskConical className={className} />
);

export const BiologyIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <Dna className={className} />
);

export const StaticGkIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <Compass className={className} />
);

export const OtherNotesIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <FileText className={className} />
);

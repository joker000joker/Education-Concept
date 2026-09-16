import React from 'react';

const SvgDefs = () => (
  <defs>
    {/* Base Gradients */}
    <linearGradient id="p-blue" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#3B82F6" /> {/* Blue 500 */}
      <stop offset="100%" stopColor="#1E3A8A" /> {/* Blue 800 */}
    </linearGradient>
    <linearGradient id="p-light-blue" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#60A5FA" /> {/* Blue 400 */}
      <stop offset="100%" stopColor="#2563EB" /> {/* Blue 600 */}
    </linearGradient>
    <linearGradient id="p-white" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#FFFFFF" />
      <stop offset="100%" stopColor="#E2E8F0" /> {/* Slate 200 */}
    </linearGradient>
    <linearGradient id="p-glass" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.7" />
      <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.1" />
    </linearGradient>
    
    {/* Shadows */}
    <filter id="p-shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#0F172A" floodOpacity="0.15" />
    </filter>
    <filter id="p-shadow-lg" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#0F172A" floodOpacity="0.25" />
    </filter>
  </defs>
);

export const PaidEbooksIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <SvgDefs />
    <rect x="16" y="12" width="32" height="40" rx="4" fill="url(#p-white)" filter="url(#p-shadow)" />
    <rect x="12" y="16" width="32" height="40" rx="4" fill="url(#p-blue)" filter="url(#p-shadow-lg)" />
    <path d="M30 16 L40 16 L40 36 L35 31 L30 36 Z" fill="url(#p-light-blue)" />
    <circle cx="35" cy="24" r="3" fill="white" />
  </svg>
);

export const FreeEbooksIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <SvgDefs />
    <rect x="16" y="12" width="32" height="40" rx="4" fill="url(#p-white)" filter="url(#p-shadow)" />
    <rect x="12" y="16" width="32" height="40" rx="4" fill="url(#p-blue)" filter="url(#p-shadow-lg)" />
    <circle cx="28" cy="36" r="10" fill="url(#p-light-blue)" filter="url(#p-shadow)" />
    <path d="M28 31 L28 41 M24 37 L28 41 L32 37" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const CurrentAffairsIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <SvgDefs />
    <circle cx="32" cy="32" r="22" fill="url(#p-blue)" filter="url(#p-shadow-lg)" />
    <ellipse cx="32" cy="32" rx="10" ry="22" stroke="url(#p-glass)" strokeWidth="2" fill="none" />
    <path d="M10 32 L54 32" stroke="url(#p-glass)" strokeWidth="2" />
    <rect x="34" y="34" width="20" height="24" rx="3" fill="url(#p-white)" filter="url(#p-shadow-lg)" />
    <rect x="38" y="40" width="12" height="3" rx="1.5" fill="url(#p-blue)" />
    <rect x="38" y="46" width="8" height="2" rx="1" fill="#94A3B8" />
    <rect x="38" y="50" width="12" height="2" rx="1" fill="#94A3B8" />
  </svg>
);

export const NotesIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <SvgDefs />
    <rect x="18" y="10" width="32" height="40" rx="3" fill="url(#p-white)" filter="url(#p-shadow)" transform="rotate(8 34 30)" />
    <rect x="12" y="14" width="32" height="40" rx="3" fill="url(#p-blue)" filter="url(#p-shadow-lg)" />
    <rect x="18" y="24" width="20" height="2" rx="1" fill="url(#p-glass)" />
    <rect x="18" y="32" width="14" height="2" rx="1" fill="url(#p-glass)" />
    <rect x="18" y="40" width="20" height="2" rx="1" fill="url(#p-glass)" />
    <path d="M46 22 L52 28 L30 50 L24 44 Z" fill="url(#p-light-blue)" filter="url(#p-shadow-lg)" />
    <path d="M24 44 L30 50 L28 54 L22 48 Z" fill="url(#p-white)" />
    <path d="M22 48 L28 54 L24 56 Z" fill="#1E3A8A" />
  </svg>
);

export const SyllabusIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <SvgDefs />
    <rect x="14" y="12" width="36" height="44" rx="4" fill="url(#p-blue)" filter="url(#p-shadow-lg)" />
    <rect x="24" y="6" width="16" height="12" rx="3" fill="url(#p-white)" filter="url(#p-shadow)" />
    <rect x="28" y="10" width="8" height="4" rx="2" fill="#94A3B8" />
    
    <rect x="20" y="26" width="6" height="6" rx="2" fill="url(#p-light-blue)" />
    <path d="M21 29 L23 31 L25 27" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="30" y="28" width="14" height="2" rx="1" fill="url(#p-glass)" />
    
    <rect x="20" y="36" width="6" height="6" rx="2" fill="url(#p-light-blue)" />
    <path d="M21 39 L23 41 L25 37" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="30" y="38" width="14" height="2" rx="1" fill="url(#p-glass)" />
    
    <rect x="20" y="46" width="6" height="6" rx="2" fill="url(#p-glass)" />
    <rect x="30" y="48" width="8" height="2" rx="1" fill="url(#p-glass)" />
  </svg>
);

export const StudyResourcesIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <SvgDefs />
    <path d="M10 22 L24 22 L28 28 L54 28 L54 52 L10 52 Z" fill="url(#p-blue)" filter="url(#p-shadow-lg)" />
    <rect x="16" y="26" width="32" height="20" rx="2" fill="url(#p-white)" filter="url(#p-shadow)" />
    <rect x="20" y="32" width="24" height="2" rx="1" fill="#CBD5E1" />
    <rect x="20" y="38" width="16" height="2" rx="1" fill="#CBD5E1" />
    <path d="M8 32 L56 32 L52 56 L12 56 Z" fill="url(#p-light-blue)" filter="url(#p-shadow-lg)" />
    <circle cx="44" cy="44" r="8" fill="url(#p-white)" filter="url(#p-shadow)" />
    <circle cx="44" cy="44" r="4" fill="url(#p-blue)" />
  </svg>
);

export const DailyQuizIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <SvgDefs />
    <rect x="14" y="16" width="36" height="40" rx="4" fill="url(#p-blue)" filter="url(#p-shadow-lg)" />
    <rect x="14" y="16" width="36" height="14" rx="4" fill="#1E3A8A" />
    <rect x="20" y="10" width="4" height="12" rx="2" fill="url(#p-white)" filter="url(#p-shadow)" />
    <rect x="40" y="10" width="4" height="12" rx="2" fill="url(#p-white)" filter="url(#p-shadow)" />
    <path d="M35 28 L25 40 L31 40 L29 50 L39 38 L33 38 Z" fill="url(#p-light-blue)" filter="url(#p-shadow)" />
  </svg>
);

export const ChapterTestIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <SvgDefs />
    <path d="M32 18 L12 14 L12 48 L32 54 Z" fill="url(#p-blue)" filter="url(#p-shadow-lg)" />
    <path d="M32 18 L52 14 L52 48 L32 54 Z" fill="url(#p-light-blue)" filter="url(#p-shadow-lg)" />
    <circle cx="32" cy="38" r="12" fill="url(#p-white)" filter="url(#p-shadow)" />
    <path d="M27 38 L30 41 L37 34" stroke="#1E3A8A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const SectionalTestIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <SvgDefs />
    <rect x="12" y="32" width="18" height="18" rx="3" fill="url(#p-light-blue)" filter="url(#p-shadow)" />
    <rect x="22" y="12" width="20" height="20" rx="3" fill="url(#p-white)" filter="url(#p-shadow)" />
    <rect x="28" y="28" width="24" height="24" rx="4" fill="url(#p-blue)" filter="url(#p-shadow-lg)" />
    <path d="M34 40 L38 44 L46 34" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const TestPassIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <SvgDefs />
    <path d="M28 6 L36 6 L36 12 L28 12 Z" fill="url(#p-white)" filter="url(#p-shadow)" />
    <rect x="16" y="16" width="32" height="42" rx="4" fill="url(#p-blue)" filter="url(#p-shadow-lg)" />
    <rect x="26" y="20" width="12" height="4" rx="2" fill="#0F172A" />
    <circle cx="32" cy="38" r="10" fill="url(#p-light-blue)" filter="url(#p-shadow)" />
    <path d="M29 38 L31 40 L35 35" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const LiveTestIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <SvgDefs />
    <rect x="8" y="18" width="48" height="32" rx="4" fill="url(#p-blue)" filter="url(#p-shadow-lg)" />
    <rect x="12" y="22" width="40" height="24" rx="2" fill="#0F172A" />
    <circle cx="32" cy="34" r="10" stroke="url(#p-light-blue)" strokeWidth="2" fill="none" />
    <circle cx="32" cy="34" r="5" fill="url(#p-white)" filter="url(#p-shadow)" />
    <rect x="16" y="26" width="8" height="4" rx="2" fill="url(#p-light-blue)" />
  </svg>
);

export const CreateTestIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <SvgDefs />
    <rect x="16" y="12" width="32" height="40" rx="3" fill="url(#p-blue)" filter="url(#p-shadow-lg)" />
    <rect x="22" y="22" width="16" height="2" rx="1" fill="url(#p-glass)" />
    <rect x="22" y="28" width="20" height="2" rx="1" fill="url(#p-glass)" />
    <rect x="22" y="34" width="12" height="2" rx="1" fill="url(#p-glass)" />
    <circle cx="44" cy="44" r="10" fill="url(#p-white)" filter="url(#p-shadow)" />
    <path d="M44 39 L44 49 M39 44 L49 44" stroke="#1E3A8A" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

export const SscEbooksIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <SvgDefs />
    <rect x="12" y="16" width="40" height="32" rx="4" fill="url(#p-blue)" filter="url(#p-shadow-lg)" />
    <path d="M12 28 L52 28" stroke="url(#p-glass)" strokeWidth="2" />
    <rect x="20" y="34" width="24" height="2" rx="1" fill="url(#p-white)" />
    <rect x="20" y="40" width="16" height="2" rx="1" fill="url(#p-white)" />
    <circle cx="32" cy="16" r="10" fill="url(#p-white)" filter="url(#p-shadow)" />
    <path d="M28 16 L31 19 L36 13" stroke="#1E3A8A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const RailwaysEbooksIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <SvgDefs />
    <rect x="20" y="12" width="24" height="40" rx="6" fill="url(#p-blue)" filter="url(#p-shadow-lg)" />
    <path d="M20 24 L44 24" stroke="url(#p-glass)" strokeWidth="2" />
    <rect x="26" y="16" width="12" height="4" rx="2" fill="url(#p-light-blue)" />
    <circle cx="26" cy="46" r="3" fill="url(#p-white)" filter="url(#p-shadow)" />
    <circle cx="38" cy="46" r="3" fill="url(#p-white)" filter="url(#p-shadow)" />
    <path d="M32 28 L32 38 M28 33 L36 33" stroke="url(#p-white)" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const StateExamsEbooksIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <SvgDefs />
    <path d="M12 32 L32 16 L52 32 L52 48 L12 48 Z" fill="url(#p-blue)" filter="url(#p-shadow-lg)" />
    <rect x="24" y="32" width="16" height="16" rx="2" fill="url(#p-white)" filter="url(#p-shadow)" />
    <circle cx="32" cy="40" r="4" fill="url(#p-light-blue)" />
    <path d="M32 24 L32 24.01" stroke="url(#p-white)" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

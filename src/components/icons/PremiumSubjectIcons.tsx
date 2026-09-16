import React from 'react';

const SvgDefs = () => (
  <defs>
    <linearGradient id="p-blue" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#3B82F6" />
      <stop offset="100%" stopColor="#1E3A8A" />
    </linearGradient>
    <linearGradient id="p-light-blue" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#60A5FA" />
      <stop offset="100%" stopColor="#2563EB" />
    </linearGradient>
    <linearGradient id="p-white" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#FFFFFF" />
      <stop offset="100%" stopColor="#E2E8F0" />
    </linearGradient>
    <linearGradient id="p-glass" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.7" />
      <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.1" />
    </linearGradient>
    
    <filter id="p-shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#0F172A" floodOpacity="0.15" />
    </filter>
    <filter id="p-shadow-lg" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#0F172A" floodOpacity="0.25" />
    </filter>
  </defs>
);

export const MathIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <SvgDefs />
    <rect x="14" y="14" width="36" height="36" rx="6" fill="url(#p-blue)" filter="url(#p-shadow-lg)" />
    <rect x="22" y="22" width="8" height="2" rx="1" fill="url(#p-white)" />
    <rect x="25" y="19" width="2" height="8" rx="1" fill="url(#p-white)" />
    <rect x="36" y="22" width="8" height="2" rx="1" fill="url(#p-white)" />
    <rect x="22" y="38" width="8" height="2" rx="1" fill="url(#p-white)" />
    <circle cx="26" cy="34" r="1.5" fill="url(#p-white)" />
    <circle cx="26" cy="43" r="1.5" fill="url(#p-white)" />
    <rect x="36" y="36" width="8" height="2" rx="1" fill="url(#p-white)" />
    <rect x="36" y="40" width="8" height="2" rx="1" fill="url(#p-white)" />
    <path d="M14 26 L50 42" stroke="url(#p-glass)" strokeWidth="1" />
  </svg>
);

export const HistoryIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <SvgDefs />
    <rect x="12" y="20" width="40" height="32" rx="4" fill="url(#p-blue)" filter="url(#p-shadow-lg)" />
    <path d="M22 12 L42 12 L42 20 L22 20 Z" fill="url(#p-white)" filter="url(#p-shadow)" />
    <path d="M16 20 L48 20 L44 32 L20 32 Z" fill="url(#p-light-blue)" />
    <rect x="24" y="36" width="16" height="16" rx="2" fill="url(#p-white)" />
    <path d="M28 36 L28 52 M36 36 L36 52" stroke="#1E3A8A" strokeWidth="1.5" />
  </svg>
);

export const GeographyIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <SvgDefs />
    <circle cx="32" cy="32" r="20" fill="url(#p-blue)" filter="url(#p-shadow-lg)" />
    <path d="M16 24 Q32 12 48 24 Q40 40 28 44 Z" fill="url(#p-light-blue)" />
    <path d="M24 12 Q36 32 20 48" stroke="url(#p-glass)" strokeWidth="2" fill="none" />
    <circle cx="32" cy="32" r="20" stroke="url(#p-white)" strokeWidth="2" fill="none" />
    <ellipse cx="32" cy="32" rx="8" ry="20" stroke="url(#p-glass)" strokeWidth="1.5" fill="none" />
    <path d="M12 32 L52 32" stroke="url(#p-glass)" strokeWidth="1.5" />
  </svg>
);

export const PolityIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <SvgDefs />
    <path d="M32 12 L12 24 L52 24 Z" fill="url(#p-blue)" filter="url(#p-shadow-lg)" />
    <rect x="14" y="24" width="36" height="4" fill="url(#p-white)" />
    <rect x="18" y="28" width="6" height="20" fill="url(#p-light-blue)" />
    <rect x="29" y="28" width="6" height="20" fill="url(#p-light-blue)" />
    <rect x="40" y="28" width="6" height="20" fill="url(#p-light-blue)" />
    <rect x="12" y="48" width="40" height="6" rx="1" fill="url(#p-white)" filter="url(#p-shadow)" />
    <circle cx="32" cy="18" r="3" fill="url(#p-white)" />
  </svg>
);

export const EconomicsIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <SvgDefs />
    <rect x="12" y="16" width="40" height="32" rx="4" fill="url(#p-blue)" filter="url(#p-shadow-lg)" />
    <path d="M20 40 L28 28 L36 34 L48 18" stroke="url(#p-white)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="48" cy="18" r="4" fill="url(#p-light-blue)" />
    <rect x="16" y="32" width="6" height="12" rx="1" fill="url(#p-glass)" />
    <rect x="26" y="24" width="6" height="20" rx="1" fill="url(#p-glass)" />
    <rect x="36" y="30" width="6" height="14" rx="1" fill="url(#p-glass)" />
    <rect x="46" y="14" width="6" height="30" rx="1" fill="url(#p-glass)" />
  </svg>
);

export const PhysicsIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <SvgDefs />
    <circle cx="32" cy="32" r="20" fill="url(#p-blue)" filter="url(#p-shadow-lg)" />
    <ellipse cx="32" cy="32" rx="16" ry="6" stroke="url(#p-white)" strokeWidth="2" fill="none" transform="rotate(30 32 32)" />
    <ellipse cx="32" cy="32" rx="16" ry="6" stroke="url(#p-light-blue)" strokeWidth="2" fill="none" transform="rotate(-30 32 32)" />
    <ellipse cx="32" cy="32" rx="16" ry="6" stroke="url(#p-glass)" strokeWidth="2" fill="none" transform="rotate(90 32 32)" />
    <circle cx="32" cy="32" r="4" fill="url(#p-white)" filter="url(#p-shadow)" />
  </svg>
);

export const ChemistryIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <SvgDefs />
    <path d="M28 12 L36 12 L36 24 L48 48 L16 48 L28 24 Z" fill="url(#p-white)" filter="url(#p-shadow-lg)" />
    <path d="M28 12 L36 12 L36 24 L48 48 L16 48 L28 24 Z" fill="url(#p-glass)" />
    <path d="M19 42 L45 42 L40 32 L24 32 Z" fill="url(#p-blue)" />
    <circle cx="28" cy="38" r="2" fill="url(#p-light-blue)" />
    <circle cx="36" cy="36" r="3" fill="url(#p-light-blue)" />
    <circle cx="32" cy="44" r="1.5" fill="url(#p-light-blue)" />
    <rect x="30" y="8" width="4" height="4" rx="1" fill="#94A3B8" />
  </svg>
);

export const BiologyIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <SvgDefs />
    <rect x="14" y="14" width="36" height="36" rx="18" fill="url(#p-blue)" filter="url(#p-shadow-lg)" />
    <path d="M32 20 Q44 32 32 44 Q20 32 32 20 Z" fill="url(#p-light-blue)" />
    <path d="M32 20 L32 44" stroke="url(#p-white)" strokeWidth="2" />
    <path d="M25 27 L32 32" stroke="url(#p-white)" strokeWidth="2" strokeLinecap="round" />
    <path d="M39 37 L32 32" stroke="url(#p-white)" strokeWidth="2" strokeLinecap="round" />
    <path d="M25 37 L32 32" stroke="url(#p-white)" strokeWidth="2" strokeLinecap="round" />
    <path d="M39 27 L32 32" stroke="url(#p-white)" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const CurrentAffairsSubjectIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <SvgDefs />
    <rect x="12" y="16" width="40" height="32" rx="4" fill="url(#p-white)" filter="url(#p-shadow-lg)" />
    <rect x="12" y="16" width="14" height="32" rx="4" fill="url(#p-blue)" />
    <rect x="12" y="16" width="14" height="32" fill="url(#p-blue)" /> 
    <rect x="30" y="24" width="18" height="2" rx="1" fill="#94A3B8" />
    <rect x="30" y="30" width="14" height="2" rx="1" fill="#94A3B8" />
    <rect x="30" y="36" width="16" height="2" rx="1" fill="#94A3B8" />
    <circle cx="19" cy="32" r="4" fill="url(#p-light-blue)" />
  </svg>
);

export const HindiIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <SvgDefs />
    <rect x="14" y="16" width="36" height="32" rx="4" fill="url(#p-blue)" filter="url(#p-shadow-lg)" />
    <path d="M22 28 L42 28" stroke="url(#p-white)" strokeWidth="2" strokeLinecap="round" />
    <path d="M32 28 L32 40 Q32 44 26 44" stroke="url(#p-white)" strokeWidth="2" strokeLinecap="round" fill="none" />
    <path d="M40 34 L32 34" stroke="url(#p-white)" strokeWidth="2" strokeLinecap="round" />
    <circle cx="42" cy="22" r="1.5" fill="url(#p-light-blue)" />
  </svg>
);

export const StaticGkIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <SvgDefs />
    <path d="M16 28 L32 16 L48 28 L48 48 L16 48 Z" fill="url(#p-blue)" filter="url(#p-shadow-lg)" />
    <rect x="28" y="36" width="8" height="12" fill="url(#p-light-blue)" />
    <circle cx="32" cy="26" r="4" fill="url(#p-white)" />
    <path d="M20 48 L44 48" stroke="url(#p-white)" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const OtherNotesIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <SvgDefs />
    <rect x="14" y="24" width="36" height="24" rx="4" fill="url(#p-white)" filter="url(#p-shadow-lg)" />
    <rect x="18" y="18" width="28" height="12" rx="2" fill="url(#p-light-blue)" filter="url(#p-shadow)" />
    <rect x="22" y="12" width="20" height="12" rx="2" fill="url(#p-blue)" />
    <rect x="28" y="32" width="14" height="2" rx="1" fill="#94A3B8" />
    <rect x="28" y="38" width="8" height="2" rx="1" fill="#94A3B8" />
  </svg>
);

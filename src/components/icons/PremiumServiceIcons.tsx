import React from 'react';

/**
 * Premium 3D-styled SVG Service Icons for Education Concept.
 * Self-contained gradients with unique IDs to prevent cross-SVG collisions,
 * solid fallbacks, and resilient SVG vector rendering.
 */

// 1. Paid E-Books Icon (Deep Blue & Rose Gold Digital Book)
export const PaidEbooksIcon = ({ className = 'w-8 h-8' }: { className?: string }) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ display: 'block' }}
  >
    <defs>
      <linearGradient id="psi-pe-bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#2563EB" />
        <stop offset="100%" stopColor="#1E3A8A" />
      </linearGradient>
      <linearGradient id="psi-pe-gold" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#FBBF24" />
        <stop offset="100%" stopColor="#D97706" />
      </linearGradient>
      <linearGradient id="psi-pe-sheet" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="100%" stopColor="#E2E8F0" />
      </linearGradient>
    </defs>
    {/* Back Page Glow */}
    <rect x="18" y="10" width="32" height="44" rx="5" fill="#CBD5E1" opacity="0.6" />
    <rect x="16" y="12" width="32" height="42" rx="4" fill="url(#psi-pe-sheet)" stroke="#94A3B8" strokeWidth="1" />
    {/* Main Front Book Cover */}
    <rect x="12" y="15" width="34" height="42" rx="5" fill="url(#psi-pe-bg)" />
    {/* Spine Highlight */}
    <path d="M12 19 C12 16.5 14 15 17 15 L17 57 C14 57 12 55.5 12 53 Z" fill="#1D4ED8" />
    {/* Golden Bookmark Ribbon */}
    <path d="M30 15 L40 15 L40 34 L35 30 L30 34 Z" fill="url(#psi-pe-gold)" />
    {/* E-Reader Screen lines */}
    <rect x="19" y="38" width="18" height="2.5" rx="1.25" fill="#93C5FD" />
    <rect x="19" y="44" width="12" height="2.5" rx="1.25" fill="#60A5FA" />
    <circle cx="38" cy="45" r="4.5" fill="url(#psi-pe-gold)" />
    <path d="M38 43 L38 47 M36 45 L40 45" stroke="#78350F" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

// 2. Free E-Books Icon (Emerald Green & Sky Blue Digital Download Book)
export const FreeEbooksIcon = ({ className = 'w-8 h-8' }: { className?: string }) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ display: 'block' }}
  >
    <defs>
      <linearGradient id="psi-fe-bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#059669" />
        <stop offset="100%" stopColor="#065F46" />
      </linearGradient>
      <linearGradient id="psi-fe-sheet" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="100%" stopColor="#ECFDF5" />
      </linearGradient>
      <linearGradient id="psi-fe-badge" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#34D399" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>
    </defs>
    {/* Page Shadow */}
    <rect x="18" y="10" width="32" height="44" rx="5" fill="#A7F3D0" opacity="0.6" />
    <rect x="16" y="12" width="32" height="42" rx="4" fill="url(#psi-fe-sheet)" stroke="#6EE7B7" strokeWidth="1" />
    {/* Book Cover */}
    <rect x="12" y="15" width="34" height="42" rx="5" fill="url(#psi-fe-bg)" />
    {/* Spine */}
    <path d="M12 19 C12 16.5 14 15 17 15 L17 57 C14 57 12 55.5 12 53 Z" fill="#047857" />
    {/* Download Badge & Arrow */}
    <circle cx="29" cy="36" r="12" fill="url(#psi-fe-badge)" stroke="#FFFFFF" strokeWidth="2" />
    <path d="M29 29 L29 40 M24 36 L29 41 L34 36" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M22 44 L36 44" stroke="#D1FAE5" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// 3. Current Affairs Icon (Global Earth & Daily News Dispatch)
export const CurrentAffairsIcon = ({ className = 'w-8 h-8' }: { className?: string }) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ display: 'block' }}
  >
    <defs>
      <linearGradient id="psi-ca-globe" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#3B82F6" />
        <stop offset="100%" stopColor="#1D4ED8" />
      </linearGradient>
      <linearGradient id="psi-ca-news" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="100%" stopColor="#F1F5F9" />
      </linearGradient>
    </defs>
    {/* World Globe */}
    <circle cx="28" cy="28" r="20" fill="url(#psi-ca-globe)" />
    <ellipse cx="28" cy="28" rx="9" ry="20" stroke="#93C5FD" strokeWidth="1.5" strokeOpacity="0.7" fill="none" />
    <path d="M8 28 L48 28" stroke="#93C5FD" strokeWidth="1.5" strokeOpacity="0.7" />
    <path d="M12 18 L44 18 M12 38 L44 38" stroke="#60A5FA" strokeWidth="1" strokeOpacity="0.5" />
    {/* Front Daily Gazette Newspaper */}
    <rect x="28" y="26" width="26" height="30" rx="4" fill="url(#psi-ca-news)" stroke="#CBD5E1" strokeWidth="1.5" />
    {/* Gazette Header */}
    <rect x="33" y="31" width="16" height="4" rx="1" fill="#1E3A8A" />
    {/* News Lines */}
    <rect x="33" y="39" width="16" height="2" rx="1" fill="#64748B" />
    <rect x="33" y="44" width="12" height="2" rx="1" fill="#94A3B8" />
    <rect x="33" y="49" width="16" height="2" rx="1" fill="#94A3B8" />
  </svg>
);

// 4. Notes Icon (Curated Notebook with Pen / Quill)
export const NotesIcon = ({ className = 'w-8 h-8' }: { className?: string }) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ display: 'block' }}
  >
    <defs>
      <linearGradient id="psi-no-cover" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#8B5CF6" />
        <stop offset="100%" stopColor="#5B21B6" />
      </linearGradient>
      <linearGradient id="psi-no-pen" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#B45309" />
      </linearGradient>
    </defs>
    {/* Tilted Under-paper */}
    <rect x="18" y="10" width="30" height="40" rx="4" fill="#E2E8F0" stroke="#CBD5E1" strokeWidth="1" transform="rotate(7 33 30)" />
    {/* Main Note Sheet */}
    <rect x="12" y="14" width="32" height="42" rx="4" fill="url(#psi-no-cover)" />
    {/* Ruled lines */}
    <rect x="18" y="24" width="18" height="2" rx="1" fill="#DDD6FE" />
    <rect x="18" y="31" width="20" height="2" rx="1" fill="#C4B5FD" />
    <rect x="18" y="38" width="14" height="2" rx="1" fill="#C4B5FD" />
    <rect x="18" y="45" width="18" height="2" rx="1" fill="#A78BFA" />
    {/* Floating Pen */}
    <g transform="rotate(-30 44 40)">
      <rect x="42" y="22" width="6" height="24" rx="2" fill="url(#psi-no-pen)" />
      <path d="M42 46 L45 52 L48 46 Z" fill="#FDE68A" />
      <circle cx="45" cy="51" r="1" fill="#1E293B" />
    </g>
  </svg>
);

// 5. Exam Pattern & Syllabus Icon (Official Assessment Checklist)
export const SyllabusIcon = ({ className = 'w-8 h-8' }: { className?: string }) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ display: 'block' }}
  >
    <defs>
      <linearGradient id="psi-sy-board" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#D97706" />
        <stop offset="100%" stopColor="#92400E" />
      </linearGradient>
      <linearGradient id="psi-sy-paper" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="100%" stopColor="#FEF3C7" />
      </linearGradient>
    </defs>
    {/* Clipboard Base */}
    <rect x="12" y="14" width="40" height="44" rx="6" fill="url(#psi-sy-board)" />
    {/* Clipboard Paper */}
    <rect x="16" y="18" width="32" height="36" rx="4" fill="url(#psi-sy-paper)" />
    {/* Top Clip */}
    <rect x="24" y="9" width="16" height="9" rx="3" fill="#64748B" />
    <rect x="28" y="11" width="8" height="3" rx="1.5" fill="#E2E8F0" />
    {/* Check items */}
    <circle cx="22" cy="27" r="3" fill="#10B981" />
    <path d="M21 27 L22 28.5 L24 25.5" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="28" y="26" width="15" height="2" rx="1" fill="#78350F" />

    <circle cx="22" cy="35" r="3" fill="#10B981" />
    <path d="M21 35 L22 36.5 L24 33.5" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="28" y="34" width="17" height="2" rx="1" fill="#78350F" />

    <circle cx="22" cy="43" r="3" fill="#3B82F6" />
    <path d="M21 43 L22 44.5 L24 41.5" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="28" y="42" width="12" height="2" rx="1" fill="#78350F" />
  </svg>
);

// 6. Study Resources Icon (Library Archive & Document Dossier)
export const StudyResourcesIcon = ({ className = 'w-8 h-8' }: { className?: string }) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ display: 'block' }}
  >
    <defs>
      <linearGradient id="psi-sr-folder" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#0284C7" />
        <stop offset="100%" stopColor="#075985" />
      </linearGradient>
      <linearGradient id="psi-sr-front" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#38BDF8" />
        <stop offset="100%" stopColor="#0284C7" />
      </linearGradient>
    </defs>
    {/* Folder Back Tab */}
    <path d="M10 20 L24 20 L29 25 L54 25 C56 25 57 26 57 28 L57 50 C57 52 56 53 54 53 L10 53 C8 53 7 52 7 50 L7 23 C7 21 8 20 10 20 Z" fill="url(#psi-sr-folder)" />
    {/* Inside Insert Sheets */}
    <rect x="15" y="16" width="34" height="24" rx="2" fill="#FFFFFF" stroke="#BAE6FD" strokeWidth="1" />
    <rect x="19" y="21" width="20" height="2" rx="1" fill="#0284C7" />
    <rect x="19" y="26" width="26" height="2" rx="1" fill="#94A3B8" />
    {/* Front Flap */}
    <path d="M7 31 L57 31 L53 53 L11 53 Z" fill="url(#psi-sr-front)" />
    {/* Magnifier / Search Badge */}
    <circle cx="43" cy="42" r="7" fill="#FFFFFF" stroke="#0284C7" strokeWidth="2" />
    <path d="M48 47 L53 52" stroke="#0284C7" strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="43" cy="42" r="3" fill="#38BDF8" />
  </svg>
);

// 7. Daily Quiz Icon (Speed Revision Lightning & Timer)
export const DailyQuizIcon = ({ className = 'w-8 h-8' }: { className?: string }) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ display: 'block' }}
  >
    <defs>
      <linearGradient id="psi-dq-cal" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#2563EB" />
        <stop offset="100%" stopColor="#1E40AF" />
      </linearGradient>
      <linearGradient id="psi-dq-bolt" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#FDE047" />
        <stop offset="100%" stopColor="#EAB308" />
      </linearGradient>
    </defs>
    {/* Calendar / Desk Timer Body */}
    <rect x="13" y="15" width="38" height="41" rx="6" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
    {/* Header Band */}
    <rect x="13" y="15" width="38" height="13" rx="6" fill="url(#psi-dq-cal)" />
    {/* Spiral Binder Rings */}
    <rect x="20" y="10" width="4" height="9" rx="2" fill="#94A3B8" />
    <rect x="40" y="10" width="4" height="9" rx="2" fill="#94A3B8" />
    {/* Daily Lightning Bolt */}
    <path
      d="M35 30 L23 43 L32 43 L29 53 L41 39 L33 39 Z"
      fill="url(#psi-dq-bolt)"
      stroke="#CA8A04"
      strokeWidth="1"
    />
  </svg>
);

// 8. Chapter Wise Test Icon (Topic Book & Assessment Check)
export const ChapterTestIcon = ({ className = 'w-8 h-8' }: { className?: string }) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ display: 'block' }}
  >
    <defs>
      <linearGradient id="psi-ct-left" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#059669" />
        <stop offset="100%" stopColor="#065F46" />
      </linearGradient>
      <linearGradient id="psi-ct-right" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#10B981" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>
    </defs>
    {/* Open Chapter Book Wings */}
    <path d="M32 20 C24 16 14 16 11 18 L11 48 C14 46 24 46 32 50 Z" fill="url(#psi-ct-left)" />
    <path d="M32 20 C40 16 50 16 53 18 L53 48 C50 46 40 46 32 50 Z" fill="url(#psi-ct-right)" />
    {/* Book Pages Texture */}
    <path d="M16 26 C22 24 28 25 31 27" stroke="#A7F3D0" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M16 33 C22 31 28 32 31 34" stroke="#A7F3D0" strokeWidth="1.5" strokeLinecap="round" />
    {/* Center Seal Badge */}
    <circle cx="32" cy="36" r="10" fill="#FFFFFF" stroke="#059669" strokeWidth="2" />
    <path d="M28 36 L31 39 L37 32" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// 9. Sectional Test Icon (12-Discipline Section Grid & Verification)
export const SectionalTestIcon = ({ className = 'w-8 h-8' }: { className?: string }) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ display: 'block' }}
  >
    <defs>
      <linearGradient id="psi-st-base" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#7C3AED" />
        <stop offset="100%" stopColor="#5B21B6" />
      </linearGradient>
      <linearGradient id="psi-st-sub" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#A78BFA" />
        <stop offset="100%" stopColor="#7C3AED" />
      </linearGradient>
    </defs>
    {/* 4 Quadrant Sectional Blocks */}
    <rect x="13" y="13" width="17" height="17" rx="4" fill="url(#psi-st-sub)" opacity="0.85" />
    <rect x="34" y="13" width="17" height="17" rx="4" fill="#E2E8F0" />
    <rect x="13" y="34" width="17" height="17" rx="4" fill="#E2E8F0" />
    {/* Main Highlight Test Block */}
    <rect x="28" y="27" width="24" height="25" rx="5" fill="url(#psi-st-base)" stroke="#FFFFFF" strokeWidth="2" />
    {/* Big Checkmark */}
    <path d="M34 40 L38 44 L46 34" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// 10. Test Pass Icon (VIP Golden All-Access Key Card / Ticket)
export const TestPassIcon = ({ className = 'w-8 h-8' }: { className?: string }) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ display: 'block' }}
  >
    <defs>
      <linearGradient id="psi-tp-pass" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#B45309" />
      </linearGradient>
    </defs>
    {/* Lanyard / Clasp */}
    <path d="M28 8 L36 8 L36 14 L28 14 Z" fill="#64748B" rx="2" />
    <circle cx="32" cy="11" r="2" fill="#E2E8F0" />
    {/* ID Pass Card */}
    <rect x="15" y="14" width="34" height="44" rx="5" fill="url(#psi-tp-pass)" stroke="#FDE68A" strokeWidth="1.5" />
    {/* Holographic Chip */}
    <rect x="22" y="20" width="10" height="7" rx="2" fill="#FEF08A" stroke="#CA8A04" strokeWidth="1" />
    {/* VIP Stars */}
    <circle cx="32" cy="38" r="9" fill="#FFFFFF" />
    <path d="M32 32 L34 36 L38 37 L35 40 L36 44 L32 42 L28 44 L29 40 L26 37 L30 36 Z" fill="#D97706" />
    {/* Barcode bottom */}
    <rect x="20" y="50" width="24" height="3" rx="1.5" fill="#78350F" opacity="0.8" />
  </svg>
);

// 11. Live Test Icon (Broadcasting Screen & Live Signal Radar)
export const LiveTestIcon = ({ className = 'w-8 h-8' }: { className?: string }) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ display: 'block' }}
  >
    <defs>
      <linearGradient id="psi-lt-monitor" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#E11D48" />
        <stop offset="100%" stopColor="#9F1239" />
      </linearGradient>
    </defs>
    {/* Live Monitor Outer Frame */}
    <rect x="9" y="15" width="46" height="34" rx="5" fill="url(#psi-lt-monitor)" />
    <rect x="13" y="19" width="38" height="26" rx="3" fill="#0F172A" />
    {/* Monitor Stand */}
    <path d="M28 49 L36 49 L38 55 L26 55 Z" fill="#64748B" />
    <rect x="22" y="55" width="20" height="3" rx="1.5" fill="#475569" />
    {/* Live Pulsing Beacon Wave */}
    <circle cx="32" cy="32" r="8" stroke="#FB7185" strokeWidth="2" strokeDasharray="3 3" fill="none" />
    <circle cx="32" cy="32" r="4" fill="#F43F5E" />
    {/* "LIVE" text badge indicator top left */}
    <rect x="16" y="22" width="10" height="4" rx="1" fill="#E11D48" />
  </svg>
);

// 12. Create Test Icon (Custom Mock Test Workshop Builder)
export const CreateTestIcon = ({ className = 'w-8 h-8' }: { className?: string }) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ display: 'block' }}
  >
    <defs>
      <linearGradient id="psi-ct-doc" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#0891B2" />
        <stop offset="100%" stopColor="#155E75" />
      </linearGradient>
    </defs>
    {/* Document Canvas */}
    <rect x="14" y="12" width="36" height="42" rx="5" fill="url(#psi-ct-doc)" />
    {/* Document Lines */}
    <rect x="20" y="20" width="16" height="2.5" rx="1.25" fill="#A5F3FC" />
    <rect x="20" y="26" width="22" height="2.5" rx="1.25" fill="#67E8F9" />
    <rect x="20" y="32" width="14" height="2.5" rx="1.25" fill="#67E8F9" />
    {/* Plus Add Button Badge */}
    <circle cx="44" cy="44" r="10" fill="#FFFFFF" stroke="#0891B2" strokeWidth="2" />
    <path d="M44 38 L44 50 M38 44 L50 44" stroke="#0891B2" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

// Category Specific Icons for SSC, Railways, State Exams
export const SscEbooksIcon = ({ className = 'w-8 h-8' }: { className?: string }) => (
  <PaidEbooksIcon className={className} />
);

export const RailwaysEbooksIcon = ({ className = 'w-8 h-8' }: { className?: string }) => (
  <FreeEbooksIcon className={className} />
);

export const StateExamsEbooksIcon = ({ className = 'w-8 h-8' }: { className?: string }) => (
  <StudyResourcesIcon className={className} />
);

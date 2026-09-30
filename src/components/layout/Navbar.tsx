import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { HamburgerDrawer } from './HamburgerDrawer';
import { EditProfileModal } from '../profile/EditProfileModal';
import { ChangePasswordModal } from '../profile/ChangePasswordModal';
import { SettingsModal } from '../profile/SettingsModal';
import { PWAInstallButton } from '../common/PWAInstallButton';
import {
  Menu,
  Search,
  Bell,
  User,
  ChevronDown,
  BookOpen,
  GraduationCap,
  Library,
  ClipboardList
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, profile, signOut } = useAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Desktop "More" dropdown state & ref
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  const location = useLocation();
  const navigate = useNavigate();

  // Close "More" dropdown on route change
  useEffect(() => {
    setIsMoreOpen(false);
  }, [location.pathname]);

  // Close "More" dropdown when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setIsMoreOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMoreOpen(false);
      }
    };

    if (isMoreOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMoreOpen]);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
    setIsDrawerOpen(false);
  };

  // Direct desktop top navigation items
  const directNavLinks = [
    { name: 'HOME', path: '/' },
    { name: 'PAID E-BOOKS', path: '/paid-ebooks' },
    { name: 'FREE E-BOOKS', path: '/free-ebooks' },
    { name: 'CURRENT AFFAIRS', path: '/current-affairs' },
  ];

  // Secondary items placed inside the "More" dropdown
  const moreNavItems = [
    {
      name: 'Notes',
      path: '/notes',
      icon: BookOpen,
      isActive: (pathname: string) =>
        (pathname.startsWith('/notes') && !pathname.startsWith('/paid-ebooks')) ||
        pathname.startsWith('/subjects'),
    },
    {
      name: 'Exam Pattern & Syllabus',
      path: '/syllabus',
      icon: GraduationCap,
      isActive: (pathname: string) => pathname.startsWith('/syllabus'),
    },
    {
      name: 'Study Resources',
      path: '/resources',
      icon: Library,
      isActive: (pathname: string) =>
        pathname.startsWith('/resources') || pathname.startsWith('/study-resources'),
    },
    {
      name: 'Sectional Test',
      path: '/tests/sectional',
      icon: ClipboardList,
      isActive: (pathname: string) => pathname.startsWith('/tests'),
    },
  ];

  const isDirectActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const isMoreActive = moreNavItems.some((item) => item.isActive(location.pathname));

  return (
    <>
      <header className="sticky top-0 z-40 bg-blue-600 shadow-md text-white">
        {/* MOBILE HEADER */}
        <div className="lg:hidden flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-3">
            <button
              id="main-mobile-hamburger-btn"
              onClick={() => setIsDrawerOpen(true)}
              className="p-1 hover:bg-blue-700 rounded-lg transition-colors"
              aria-label="Open main menu"
            >
              <Menu className="w-6 h-6 text-white" />
            </button>
            <Link to="/" className="flex items-center" onClick={() => setIsDrawerOpen(false)}>
              <span className="text-lg font-bold tracking-tight text-white block leading-tight font-sans">
                Education Concept
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/notes" className="p-1 hover:bg-blue-700 rounded-lg transition-colors">
              <Search className="w-5 h-5 text-white" />
            </Link>
            <button className="p-1 hover:bg-blue-700 rounded-lg transition-colors">
              <Bell className="w-5 h-5 text-white" />
            </button>
            <PWAInstallButton />
          </div>
        </div>

        {/* DESKTOP HEADER (Two Rows) */}
        <div className="hidden lg:block max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16 border-b border-blue-500/50">
            {/* Logo */}
            <Link
              to="/"
              className="flex items-center gap-3"
              onClick={() => setIsDrawerOpen(false)}
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-sm shrink-0 overflow-hidden aspect-square">
                <img src="/ec-logo-new-2.png" alt="Education Concept Logo" className="w-full h-full object-cover object-center scale-[1.10]" />
              </div>
              <div>
                <span className="text-xl font-extrabold tracking-tight text-white block leading-tight font-sans">
                  EDUCATION CONCEPT
                </span>
              </div>
            </Link>

            <div className="flex items-center gap-6">
               <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                     <Search className="w-4 h-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search courses, notes, tests..."
                    className="w-64 pl-9 pr-4 py-1.5 rounded-full text-sm bg-white text-slate-900 placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-400"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') navigate(`/notes?q=${encodeURIComponent(e.currentTarget.value)}`);
                    }}
                  />
               </div>
               
               <PWAInstallButton />
               
               {user ? (
                 <Link to="/profile" className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-700 hover:bg-blue-800 transition-colors">
                   <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold">
                     {user.email?.charAt(0).toUpperCase()}
                   </div>
                   <span className="text-sm font-semibold">{profile?.full_name || 'Profile'}</span>
                 </Link>
               ) : (
                 <Link to="/login" className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white text-blue-600 hover:bg-blue-50 font-bold text-sm transition-colors shadow-sm">
                    <User className="w-4 h-4" />
                    LOGIN / REGISTER
                 </Link>
               )}
            </div>
          </div>
          
          {/* DESKTOP NAVBAR (Second Row) */}
          <nav className="flex items-center justify-center gap-8 h-12 whitespace-nowrap relative">
            {directNavLinks.map((link) => {
              const active = isDirectActive(link.path);
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`text-[11px] font-bold tracking-wider hover:text-yellow-300 transition-colors pb-1 ${
                    active
                      ? 'text-yellow-400 border-b-2 border-yellow-400'
                      : 'text-white/90 border-b-2 border-transparent'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}

            {/* "MORE" DROPDOWN */}
            <div className="relative" ref={moreMenuRef}>
              <button
                type="button"
                id="desktop-more-menu-btn"
                onClick={() => setIsMoreOpen((prev) => !prev)}
                className={`flex items-center gap-1.5 text-[11px] font-bold tracking-wider hover:text-yellow-300 transition-colors pb-1 cursor-pointer select-none ${
                  isMoreActive
                    ? 'text-yellow-400 border-b-2 border-yellow-400'
                    : isMoreOpen
                    ? 'text-yellow-300 border-b-2 border-yellow-300/60'
                    : 'text-white/90 border-b-2 border-transparent'
                }`}
                aria-expanded={isMoreOpen}
                aria-haspopup="true"
              >
                <span>MORE</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    isMoreOpen ? 'rotate-180 text-yellow-300' : 'text-white/80'
                  }`}
                />
              </button>

              {/* Dropdown Menu */}
              {isMoreOpen && (
                <div
                  role="menu"
                  aria-label="More navigation links"
                  className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-64 bg-white rounded-xl shadow-2xl border border-slate-200/80 py-2 z-50 transition-all duration-150 ease-out animate-in fade-in"
                >
                  <div className="px-3.5 py-1 mb-1 border-b border-slate-100">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                      More Categories
                    </span>
                  </div>

                  <div className="space-y-0.5 px-1.5">
                    {moreNavItems.map((item) => {
                      const active = item.isActive(location.pathname);
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.name}
                          to={item.path}
                          onClick={() => setIsMoreOpen(false)}
                          role="menuitem"
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all group ${
                            active
                              ? 'bg-blue-50 text-blue-600 font-bold'
                              : 'text-slate-700 hover:bg-slate-50 hover:text-blue-600'
                          }`}
                        >
                          <div
                            className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                              active
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600'
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <span className="flex-1">{item.name}</span>
                          {active && (
                            <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </nav>
        </div>
      </header>

      {/* Responsive Hamburger Drawer */}
      <HamburgerDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onOpenEditProfile={() => setIsEditProfileOpen(true)}
        onOpenChangePassword={() => setIsChangePasswordOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onOpenEditProfile={() => setIsEditProfileOpen(true)}
        onOpenChangePassword={() => setIsChangePasswordOpen(true)}
      />
    </>
  );
};

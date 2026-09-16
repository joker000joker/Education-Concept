import React, { useState } from 'react';
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
  GraduationCap
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, profile, isAdmin, signOut, roleLoading } = useAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
    setIsDrawerOpen(false);
  };

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const navLinks = [
    { name: 'HOME', path: '/' },
    { name: 'PAID E-BOOKS', path: '/subjects' },
    { name: 'FREE E-BOOKS', path: '/free-ebooks' },
    { name: 'NOTES', path: '/notes' },
    { name: 'CURRENT AFFAIRS', path: '/current-affairs' },
    { name: 'EXAM PATTERN & SYLLABUS', path: '/syllabus' },
    { name: 'STUDY RESOURCES', path: '/resources' },
    { name: 'EC TEST', path: '/tests' },
    { name: 'MORE', path: '/more' },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-blue-600 shadow-md text-white">
        {/* MOBILE HEADER */}
        <div className="lg:hidden flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="p-1 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <Menu className="w-6 h-6 text-white" />
            </button>
            <Link to="/" className="flex items-center gap-2" onClick={() => setIsDrawerOpen(false)}>
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
              <div className="w-10 h-10 rounded-xl bg-white text-blue-600 flex items-center justify-center shadow-sm shrink-0">
                 <img src="/pwa-192x192.png" alt="Logo" className="w-8 h-8 object-contain" />
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
          <nav className="flex items-center justify-center gap-6 h-12 overflow-x-auto no-scrollbar whitespace-nowrap">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`text-[11px] font-bold tracking-wider hover:text-yellow-300 transition-colors pb-1 ${
                  isActive(link.path) && link.path !== '/' || (link.path === '/' && location.pathname === '/')
                    ? 'text-yellow-400 border-b-2 border-yellow-400' 
                    : 'text-white/90 border-b-2 border-transparent'
                }`}
              >
                {link.name}
              </Link>
            ))}
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

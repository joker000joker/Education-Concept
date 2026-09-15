import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { HamburgerDrawer } from './HamburgerDrawer';
import { EditProfileModal } from '../profile/EditProfileModal';
import { ChangePasswordModal } from '../profile/ChangePasswordModal';
import { SettingsModal } from '../profile/SettingsModal';
import { PWAInstallButton } from '../common/PWAInstallButton';
import {
  GraduationCap,
  Search,
  ShieldCheck,
  Menu,
  User,
  LogOut,
  Settings,
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

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link
              id="brand-logo-link"
              to="/"
              className="flex items-center gap-2.5 group"
              onClick={() => setIsDrawerOpen(false)}
            >
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shadow-blue-500/20 group-hover:bg-blue-700 transition-colors shrink-0">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <span className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 block leading-tight font-serif sm:font-sans">
                  EDUCATION CONCEPT
                </span>
                <span className="text-[10px] tracking-wider uppercase font-semibold text-blue-600 block">
                  Educational PDF & E-Notes
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1">
              <Link
                id="nav-home-link"
                to="/"
                className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  isActive('/') && location.pathname === '/'
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Home
              </Link>
              <Link
                id="nav-subjects-link"
                to="/subjects"
                className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  isActive('/subjects')
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Subjects
              </Link>
              <Link
                id="nav-notes-link"
                to="/notes"
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  isActive('/notes') && !location.pathname.startsWith('/admin')
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Search className="w-4 h-4 text-slate-400" />
                <span>Search Notes</span>
              </Link>

              {/* Admin Dashboard link: visible ONLY if role is admin */}
              {!roleLoading && isAdmin && (
                <Link
                  id="nav-admin-link"
                  to="/admin"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors ${
                    isActive('/admin')
                      ? 'text-white bg-indigo-600 shadow-xs'
                      : 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Admin Dashboard</span>
                </Link>
              )}
            </nav>

            {/* Right Actions & Hamburger Button (visible on both Desktop & Mobile) */}
            <div className="flex items-center gap-2 sm:gap-3">
              <PWAInstallButton />
              
              {/* Desktop quick auth / profile preview */}
              <div className="hidden sm:flex items-center gap-2">
                {user ? (
                  <Link
                    id="nav-user-profile"
                    to="/profile"
                    className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                      {user.email?.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-left">
                      <span className="text-xs font-semibold text-slate-800 max-w-[130px] truncate block leading-tight">
                        {profile?.full_name || user.email}
                      </span>
                      {roleLoading ? (
                        <span className="text-[10px] text-slate-400 font-medium">Checking role...</span>
                      ) : (
                        <span
                          id="nav-role-label"
                          className={`text-[10px] font-bold block leading-tight ${
                            isAdmin ? 'text-indigo-600' : 'text-slate-500'
                          }`}
                        >
                          {isAdmin ? 'Admin User' : 'Student User'}
                        </span>
                      )}
                    </div>
                  </Link>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <Link
                      id="nav-login-btn"
                      to="/login"
                      className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                    >
                      Log in
                    </Link>
                    <Link
                      id="nav-signup-btn"
                      to="/signup"
                      className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-xs shadow-blue-600/20 transition-colors"
                    >
                      Sign up
                    </Link>
                  </div>
                )}
              </div>

              {/* RESPONSIVE HAMBURGER MENU BUTTON (☰) - Beautiful on both mobile & desktop */}
              <button
                id="main-hamburger-menu-btn"
                onClick={() => setIsDrawerOpen(true)}
                className="flex items-center gap-1.5 py-2 px-2.5 sm:px-3 rounded-xl border border-slate-200 hover:border-blue-400 bg-white hover:bg-blue-50/50 text-slate-700 hover:text-blue-600 shadow-2xs transition-all active:scale-95"
                aria-label="Open navigation and account menu (☰)"
                title="Open menu (☰)"
              >
                <Menu className="w-5 h-5 text-slate-700" />
                <span className="text-xs font-bold hidden sm:inline">Menu</span>
              </button>
            </div>
          </div>
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

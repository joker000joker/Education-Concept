import React, { useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  X,
  GraduationCap,
  User,
  UserCheck,
  KeyRound,
  Settings,
  ShieldCheck,
  LogOut,
  ChevronRight,
  BookOpen,
  Search,
  Home,
  Layers,
  Sparkles,
  LogIn,
  UserPlus,
  Loader2,
} from 'lucide-react';

interface HamburgerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenEditProfile: () => void;
  onOpenChangePassword: () => void;
  onOpenSettings: () => void;
}

export const HamburgerDrawer: React.FC<HamburgerDrawerProps> = ({
  isOpen,
  onClose,
  onOpenEditProfile,
  onOpenChangePassword,
  onOpenSettings,
}) => {
  const { user, profile, isAdmin, signOut, roleLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLogout = async () => {
    onClose();
    await signOut();
    toast.success('You have been logged out securely.');
    navigate('/');
  };

  const handleNavigation = (path: string) => {
    onClose();
    navigate(path);
  };

  const isCurrent = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200"
      aria-modal="true"
      role="dialog"
      aria-label="Application Navigation and Account Menu"
    >
      {/* Dimmed backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div
          ref={drawerRef}
          className="w-screen max-w-sm sm:max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-250 ease-out"
        >
          {/* Drawer Header */}
          <div>
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shadow-blue-500/20">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-sm font-extrabold tracking-tight text-slate-900 block leading-none">
                    EDUCATION CONCEPT
                  </span>
                  <span className="text-[10px] tracking-wider uppercase font-semibold text-blue-600 block mt-0.5">
                    Menu & Account
                  </span>
                </div>
              </div>

              <button
                id="close-hamburger-drawer-btn"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User Account Section or Guest Notice */}
            <div className="p-5 sm:p-6 pb-2">
              {user ? (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/40 border border-slate-200/80 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-xs shadow-blue-500/20 shrink-0">
                      {user.email?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {profile?.full_name || user.email}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {roleLoading ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500">
                            <Loader2 className="w-3 h-3 animate-spin text-slate-400" />
                            <span>Loading role...</span>
                          </span>
                        ) : (
                          <span
                            id="drawer-user-role-badge"
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              isAdmin
                                ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                                : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {isAdmin && <ShieldCheck className="w-3 h-3" />}
                            {isAdmin ? 'Admin User' : 'Student User'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-3">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">Welcome to Education Concept</h3>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Sign in to manage your profile, security settings, and personal reader preferences.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      id="drawer-login-btn"
                      onClick={() => handleNavigation('/login')}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                      <LogIn className="w-3.5 h-3.5 text-slate-500" />
                      <span>Log In</span>
                    </button>
                    <button
                      id="drawer-signup-btn"
                      onClick={() => handleNavigation('/signup')}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-2xs"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Sign Up</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* MANDATORY HAMBURGER MENU ACTIONS */}
            <div className="px-5 sm:px-6 py-3 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-3 mb-1">
                Account & Settings
              </span>

              {/* 1. My Profile */}
              <button
                id="drawer-item-my-profile"
                onClick={() => handleNavigation('/profile')}
                className="w-full flex items-center justify-between p-3 rounded-xl text-left hover:bg-slate-50 active:bg-slate-100 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-slate-800 block">
                      My Profile
                    </span>
                    <span className="text-[10px] text-slate-400">
                      View your registered account details
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* 2. Edit Profile */}
              <button
                id="drawer-item-edit-profile"
                onClick={() => {
                  onClose();
                  onOpenEditProfile();
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl text-left hover:bg-slate-50 active:bg-slate-100 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-slate-800 block">
                      Edit Profile
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Update contact number & profile info
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* 3. Change Password */}
              <button
                id="drawer-item-change-password"
                onClick={() => {
                  onClose();
                  onOpenChangePassword();
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl text-left hover:bg-slate-50 active:bg-slate-100 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-slate-800 block">
                      Change Password
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Securely update Supabase Auth password
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* 4. Settings */}
              <button
                id="drawer-item-settings"
                onClick={() => {
                  onClose();
                  onOpenSettings();
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl text-left hover:bg-slate-50 active:bg-slate-100 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Settings className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-slate-800 block">
                      Settings
                    </span>
                    <span className="text-[10px] text-slate-400">
                      PDF viewer preferences & app cache
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* 5. Admin Dashboard - STRICTLY CONDITIONAL: Shown ONLY if public.profiles.role === 'admin' */}
              {!roleLoading && isAdmin && (
                <button
                  id="drawer-item-admin-dashboard"
                  onClick={() => handleNavigation('/admin')}
                  className="w-full flex items-center justify-between p-3 rounded-xl text-left bg-indigo-50/80 hover:bg-indigo-100/70 border border-indigo-200/80 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs sm:text-sm font-bold text-indigo-950 block">
                        Admin Dashboard
                      </span>
                      <span className="text-[10px] text-indigo-700 font-medium">
                        Manage notes, uploads & database
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-indigo-500 group-hover:translate-x-0.5 transition-transform" />
                </button>
              )}

              {/* 6. Logout (if logged in) */}
              {user && (
                <button
                  id="drawer-item-logout"
                  onClick={handleLogout}
                  className="w-full flex items-center justify-between p-3 rounded-xl text-left hover:bg-rose-50/80 transition-colors group text-rose-600"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <LogOut className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs sm:text-sm font-bold block">
                        Logout
                      </span>
                      <span className="text-[10px] text-rose-400">
                        Sign out of Education Concept
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-rose-400 group-hover:translate-x-0.5 transition-transform" />
                </button>
              )}
            </div>

            {/* GENERAL SITE NAVIGATION */}
            <div className="px-5 sm:px-6 py-3 border-t border-slate-100 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-3 mb-1">
                Explore Content
              </span>

              <button
                onClick={() => handleNavigation('/')}
                className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-xs font-semibold transition-colors ${
                  isCurrent('/') && location.pathname === '/'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Home className="w-4 h-4" />
                <span>Home</span>
              </button>

              <button
                onClick={() => handleNavigation('/subjects')}
                className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-xs font-semibold transition-colors ${
                  isCurrent('/subjects')
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>All 12 Subjects & Categories</span>
              </button>

              <button
                onClick={() => handleNavigation('/notes')}
                className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-xs font-semibold transition-colors ${
                  isCurrent('/notes') && !location.pathname.startsWith('/admin')
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Search className="w-4 h-4" />
                <span>Search Notes & Repository</span>
              </button>
            </div>
          </div>

          {/* Drawer Footer */}
          <div className="p-5 sm:p-6 border-t border-slate-100 bg-slate-50/50 text-center">
            <p className="text-[11px] text-slate-400">
              Education Concept • Verified Educational Platform
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

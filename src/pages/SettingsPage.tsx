import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { BackButton } from '../components/common/BackButton';
import { EditProfileModal } from '../components/profile/EditProfileModal';
import { ChangePasswordModal } from '../components/profile/ChangePasswordModal';
import {
  Settings,
  BookOpen,
  Shield,
  Trash2,
  Check,
  User,
  KeyRound,
  ShieldCheck,
  ArrowRight,
  LogOut,
  Sun,
  Moon,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, profile, isAdmin, signOut } = useAuth();
  const { isDark, setTheme } = useTheme();
  const toast = useToast();
  const navigate = useNavigate();

  const [pdfZoom, setPdfZoom] = useState(() => {
    return localStorage.getItem('ec_pref_zoom') || '100';
  });
  const [confirmDownload, setConfirmDownload] = useState(() => {
    return localStorage.getItem('ec_pref_confirm_dl') !== 'false';
  });

  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const handleSavePreferences = () => {
    localStorage.setItem('ec_pref_zoom', pdfZoom);
    localStorage.setItem('ec_pref_confirm_dl', confirmDownload ? 'true' : 'false');
    toast.success('Preferences saved successfully.');
  };

  const handleClearCachedData = () => {
    localStorage.removeItem('ec_pref_zoom');
    localStorage.removeItem('ec_pref_confirm_dl');
    setPdfZoom('100');
    setConfirmDownload(true);
    toast.info('Local reader preferences reset to default values.');
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <BackButton fallbackTo="/" label="Back to Home" />
        <span className="text-xs font-semibold text-slate-400">Settings</span>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-8 transition-colors">
        <div className="flex items-center gap-3.5 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Application Settings</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Customize your display theme, PDF reader view, and manage account credentials
            </p>
          </div>
        </div>

        {/* Appearance & Display Theme */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            {isDark ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
            Appearance & Theme
          </h2>

          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <label className="text-xs font-bold text-slate-800 dark:text-white block">Theme Palette</label>
              <p className="text-xs text-slate-500 dark:text-slate-400">Switch between standard light view and high-contrast dark palette</p>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-200/70 dark:bg-slate-700/80 p-1 rounded-xl self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  !isDark ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>Light</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isDark ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
                <span>Dark</span>
              </button>
            </div>
          </div>
        </div>

        {/* Reader Preferences */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            PDF Reader & Viewer Controls
          </h2>

          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <label className="text-xs font-bold text-slate-800 dark:text-white block">Default PDF Zoom</label>
                <p className="text-xs text-slate-500 dark:text-slate-400">Initial display magnification when opening notes</p>
              </div>
              <select
                value={pdfZoom}
                onChange={(e) => setPdfZoom(e.target.value)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 focus:outline-hidden"
              >
                <option value="75">75% (Compact)</option>
                <option value="100">100% (Standard Default)</option>
                <option value="125">125% (Comfortable)</option>
                <option value="150">150% (High Detail)</option>
              </select>
            </div>

            <div className="pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <label className="text-xs font-bold text-slate-800 dark:text-white block">Download Safety Check</label>
                <p className="text-xs text-slate-500 dark:text-slate-400">Display confirmation modal before initiating large file downloads</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer self-start sm:self-auto">
                <input
                  type="checkbox"
                  checked={confirmDownload}
                  onChange={(e) => setConfirmDownload(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-200 dark:bg-slate-700 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={handleClearCachedData}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset to Defaults</span>
            </button>
            <button
              type="button"
              onClick={handleSavePreferences}
              className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition-colors flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Preferences</span>
            </button>
          </div>
        </div>

        {/* Account & Security Section */}
        {user && (
          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Account & Credentials
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIsEditProfileOpen(true)}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500 bg-white dark:bg-slate-800/80 hover:bg-blue-50/30 dark:hover:bg-slate-700 text-left transition-all flex items-center gap-3 shadow-2xs cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">Edit Profile</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Update mobile and profile info</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => setIsChangePasswordOpen(true)}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500 bg-white dark:bg-slate-800/80 hover:bg-indigo-50/30 dark:hover:bg-slate-700 text-left transition-all flex items-center gap-3 shadow-2xs cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">Change Password</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Update Supabase Auth password</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>
        )}

        {/* Admin Dashboard shortcut if admin */}
        {isAdmin && (
          <div className="p-4 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200 block">Administrator Dashboard</span>
                <span className="text-[11px] text-indigo-700 dark:text-indigo-400">Access protected upload and management controls</span>
              </div>
            </div>
            <Link
              to="/admin"
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shrink-0"
            >
              Open Dashboard
            </Link>
          </div>
        )}

        {/* Logout Action */}
        {user && (
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-900/60 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        )}
      </div>

      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
      />

      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </div>
  );
};

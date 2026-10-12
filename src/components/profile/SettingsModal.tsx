import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useTheme } from '../../context/ThemeContext';
import {
  X,
  Settings,
  BookOpen,
  Download,
  Shield,
  Trash2,
  Check,
  User,
  KeyRound,
  Sun,
  Moon,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenEditProfile?: () => void;
  onOpenChangePassword?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onOpenEditProfile,
  onOpenChangePassword,
}) => {
  const { user, profile, isAdmin } = useAuth();
  const { isDark, setTheme } = useTheme();
  const toast = useToast();

  const [pdfZoom, setPdfZoom] = useState(() => {
    return localStorage.getItem('ec_pref_zoom') || '100';
  });
  const [confirmDownload, setConfirmDownload] = useState(() => {
    return localStorage.getItem('ec_pref_confirm_dl') !== 'false';
  });

  if (!isOpen) return null;

  const handleSavePreferences = () => {
    localStorage.setItem('ec_pref_zoom', pdfZoom);
    localStorage.setItem('ec_pref_confirm_dl', confirmDownload ? 'true' : 'false');
    toast.success('Preferences saved successfully.');
    onClose();
  };

  const handleClearCachedData = () => {
    localStorage.removeItem('ec_pref_zoom');
    localStorage.removeItem('ec_pref_confirm_dl');
    setPdfZoom('100');
    setConfirmDownload(true);
    toast.info('Local reader preferences reset to default values.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 dark:border-slate-800 relative max-h-[90vh] overflow-y-auto transition-colors">
        <button
          id="close-settings-modal-btn"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Close settings dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Application Settings</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Customize appearance, reading preferences and manage account</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Appearance & Display Theme */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              {isDark ? <Moon className="w-3.5 h-3.5 text-indigo-400" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />}
              Appearance & Theme
            </h3>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-800 dark:text-white block">Theme Mode</label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Toggle between Light and Dark display</p>
              </div>
              <div className="flex items-center gap-1 bg-slate-200/70 dark:bg-slate-700/80 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    !isDark ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Sun className="w-3 h-3 text-amber-500" />
                  <span>Light</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isDark ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Moon className="w-3 h-3 text-indigo-400" />
                  <span>Dark</span>
                </button>
              </div>
            </div>
          </div>
          {/* Reader Preferences */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              PDF Reader Preferences
            </h3>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-800 dark:text-white block">Default PDF Zoom</label>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Initial scale applied when viewing PDF notes</p>
                </div>
                <select
                  value={pdfZoom}
                  onChange={(e) => setPdfZoom(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 focus:outline-hidden"
                >
                  <option value="75">75% (Compact)</option>
                  <option value="100">100% (Standard)</option>
                  <option value="125">125% (Comfortable)</option>
                  <option value="150">150% (High Detail)</option>
                </select>
              </div>

              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-800 dark:text-white block">Download Confirmation</label>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Prompt before downloading large notes</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={confirmDownload}
                    onChange={(e) => setConfirmDownload(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 dark:bg-slate-700 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Account Security Quick Links */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              Account & Credentials
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {onOpenEditProfile && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenEditProfile();
                  }}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500 bg-white dark:bg-slate-800 hover:bg-blue-50/40 dark:hover:bg-slate-700/80 text-left transition-colors flex items-center gap-2.5 cursor-pointer"
                >
                  <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">Edit Profile</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">Update phone/contact</span>
                  </div>
                </button>
              )}

              {onOpenChangePassword && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenChangePassword();
                  }}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500 bg-white dark:bg-slate-800 hover:bg-indigo-50/40 dark:hover:bg-slate-700/80 text-left transition-colors flex items-center gap-2.5 cursor-pointer"
                >
                  <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">Change Password</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">Update Auth password</span>
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* Local cache cleanup */}
          <div className="pt-2 flex items-center justify-between text-xs text-slate-500">
            <button
              type="button"
              onClick={handleClearCachedData}
              className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-rose-600 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              <span>Reset Reader Defaults</span>
            </button>

            <span className="text-[10px] font-mono text-slate-400">
              Role: {isAdmin ? 'Admin User' : 'Student User'}
            </span>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              id="save-settings-btn"
              type="button"
              onClick={handleSavePreferences}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

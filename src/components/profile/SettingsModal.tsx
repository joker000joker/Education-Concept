import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
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
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto">
        <button
          id="close-settings-modal-btn"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Close settings dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Application Settings</h2>
            <p className="text-xs text-slate-500">Customize reading preferences and manage account</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Reader Preferences */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              PDF Reader Preferences
            </h3>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-800 block">Default PDF Zoom</label>
                  <p className="text-[11px] text-slate-500">Initial scale applied when viewing PDF notes</p>
                </div>
                <select
                  value={pdfZoom}
                  onChange={(e) => setPdfZoom(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-hidden"
                >
                  <option value="75">75% (Compact)</option>
                  <option value="100">100% (Standard)</option>
                  <option value="125">125% (Comfortable)</option>
                  <option value="150">150% (High Detail)</option>
                </select>
              </div>

              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-800 block">Download Confirmation</label>
                  <p className="text-[11px] text-slate-500">Prompt before downloading large notes</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={confirmDownload}
                    onChange={(e) => setConfirmDownload(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
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
                  className="p-3 rounded-xl border border-slate-200 hover:border-blue-300 bg-white hover:bg-blue-50/40 text-left transition-colors flex items-center gap-2.5"
                >
                  <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Edit Profile</span>
                    <span className="text-[10px] text-slate-500">Update phone/contact</span>
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
                  className="p-3 rounded-xl border border-slate-200 hover:border-indigo-300 bg-white hover:bg-indigo-50/40 text-left transition-colors flex items-center gap-2.5"
                >
                  <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Change Password</span>
                    <span className="text-[10px] text-slate-500">Update Auth password</span>
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

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Close
            </button>
            <button
              id="save-settings-btn"
              type="button"
              onClick={handleSavePreferences}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-xs transition-all flex items-center gap-1.5"
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

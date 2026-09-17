import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BackButton } from '../components/common/BackButton';
import { EditProfileModal } from '../components/profile/EditProfileModal';
import { ChangePasswordModal } from '../components/profile/ChangePasswordModal';
import {
  User,
  ShieldCheck,
  LogOut,
  Mail,
  Calendar,
  Layers,
  ArrowRight,
  Phone,
  KeyRound,
  Settings,
  UserCheck,
  BookOpen,
  FileText,
  Sparkles
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, profile, isAdmin, signOut, loading, roleLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tab = searchParams.get("tab");

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };


  // ---------------------------------------------------------
  // EMPTY STATES FOR BOTTOM NAVIGATION TABS (NO PURCHASE YET)
  // ---------------------------------------------------------
  if (tab === 'notes') {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 pb-32 min-h-[80vh] flex flex-col items-center justify-center space-y-6">
        <div className="bg-white p-10 rounded-[2rem] border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-center max-w-md w-full relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-400 to-blue-600"></div>
          <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-blue-100/50">
            <BookOpen className="w-10 h-10 stroke-[1.5]" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">No Purchase Available</h2>
          <p className="text-sm text-slate-500 mt-3 leading-relaxed">
            You currently do not have any active purchased notes or study materials in your account.
          </p>
          <div className="mt-8 pt-6 border-t border-slate-100">
            <Link
              to="/"
              className="inline-flex items-center justify-center w-full px-6 py-3.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-[0_4px_12px_rgba(37,99,235,0.2)] hover:shadow-[0_6px_16px_rgba(37,99,235,0.3)] transition-all active:scale-[0.98]"
            >
              Browse Education Concept
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (tab === 'tests') {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 pb-32 min-h-[80vh] flex flex-col items-center justify-center space-y-6">
        <div className="bg-white p-10 rounded-[2rem] border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-center max-w-md w-full relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-400 to-indigo-600"></div>
          <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-indigo-100/50 relative">
            <FileText className="w-10 h-10 stroke-[1.5]" />
            <div className="absolute -top-2 -right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-sm">
              <Sparkles className="w-4 h-4 text-amber-500" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Tests Coming Soon</h2>
          <p className="text-sm text-slate-500 mt-3 leading-relaxed">
            We are actively building a state-of-the-art testing platform. Mock tests and performance analytics will be available in a future update.
          </p>
          <div className="mt-8 pt-6 border-t border-slate-100">
            <Link
              to="/"
              className="inline-flex items-center justify-center w-full px-6 py-3.5 rounded-xl text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-[0_4px_12px_rgba(15,23,42,0.15)] hover:shadow-[0_6px_16px_rgba(15,23,42,0.2)] transition-all active:scale-[0.98]"
            >
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading || roleLoading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center text-sm text-slate-500">
        Loading profile details...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 space-y-6 text-center">
        <BackButton fallbackTo="/" label="Back to Home" />
        <div className="bg-white rounded-3xl border border-slate-200 p-8 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <User className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Sign in Required</h2>
          <p className="text-xs text-slate-500">
            Please log in to view and manage your Education Concept account.
          </p>
          <div className="pt-2 flex justify-center gap-2">
            <Link
              to="/login"
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700"
            >
              Log in
            </Link>
            <Link
              to="/signup"
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const roleDisplay = profile?.role || 'user';

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <BackButton fallbackTo="/" label="Back to Home" />
        <span className="text-xs font-semibold text-slate-400">My Profile</span>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
        {/* User avatar & summary */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 pb-6 border-b border-slate-100 text-center sm:text-left">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-2xl font-bold shadow-md shadow-blue-500/20">
            {user.email?.charAt(0).toUpperCase()}
          </div>

          <div className="flex-1 space-y-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-xl font-bold text-slate-900 truncate max-w-xs sm:max-w-md">
                {profile?.full_name || user.email}
              </h1>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                  isAdmin
                    ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                    : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                }`}
              >
                {isAdmin ? <ShieldCheck className="w-3.5 h-3.5" /> : null}
                {isAdmin ? 'Admin User' : 'Student User'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Verified member of Education Concept digital learning network
            </p>
          </div>
        </div>

        {/* Quick Account Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <button
            id="profile-action-edit-btn"
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-slate-200 hover:border-blue-300 bg-slate-50/60 hover:bg-blue-50/50 text-xs font-semibold text-slate-800 transition-colors"
          >
            <UserCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Edit Profile</span>
          </button>

          <button
            id="profile-action-change-pw-btn"
            onClick={() => setIsPasswordModalOpen(true)}
            className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-slate-200 hover:border-indigo-300 bg-slate-50/60 hover:bg-indigo-50/50 text-xs font-semibold text-slate-800 transition-colors"
          >
            <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
            <span>Change Password</span>
          </button>

          <Link
            id="profile-action-settings-btn"
            to="/settings"
            className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50/60 hover:bg-slate-100 text-xs font-semibold text-slate-800 transition-colors"
          >
            <Settings className="w-3.5 h-3.5 text-slate-600" />
            <span>Settings</span>
          </Link>
        </div>

        {/* Account Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              Registered Email
            </span>
            <p className="text-sm font-semibold text-slate-900 truncate">{user.email}</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" />
              Contact / Mobile
            </span>
            <p className="text-sm font-semibold text-slate-900">
              {profile?.mobile || 'Not provided'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Assigned Access Role
            </span>
            <p className="text-sm font-semibold text-slate-900 capitalize">
              {isAdmin ? 'Admin User' : 'Student User'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Account Created
            </span>
            <p className="text-sm font-semibold text-slate-900">
              {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Active'}
            </p>
          </div>
        </div>

        {/* Admin Dashboard shortcut if admin */}
        {isAdmin && (
          <div className="p-5 rounded-2xl bg-indigo-50/80 border border-indigo-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-bold text-indigo-800">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>Admin Privileges Active</span>
              </div>
              <p className="text-xs text-indigo-700">
                You have administrative rights to upload, edit, publish, and delete notes.
              </p>
            </div>
            <Link
              id="profile-goto-admin-btn"
              to="/admin"
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs shrink-0 flex items-center gap-1.5"
            >
              <span>Go to Admin Panel</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* Logout Action */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <Link
            to="/notes"
            className="text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            Continue browsing notes
          </Link>

          <button
            id="profile-logout-btn"
            onClick={handleSignOut}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 border border-rose-200 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />

      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </div>
  );
};


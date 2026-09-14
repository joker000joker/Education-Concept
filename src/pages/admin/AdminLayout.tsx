import React from 'react';
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { BackButton } from '../../components/common/BackButton';
import {
  ShieldCheck,
  LayoutDashboard,
  FileText,
  Upload,
  AlertTriangle,
  Lock,
  ArrowRight,
} from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const { user, profile, isAdmin, loading, roleLoading } = useAuth();
  const location = useLocation();

  if (loading || roleLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="inline-block animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mb-3" />
        <p className="text-sm text-slate-500 font-medium">Verifying administrator credentials...</p>
      </div>
    );
  }

  // Not logged in or role is not admin -> immediately redirect so normal users never see or access Admin Dashboard
  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  const isTabActive = (path: string) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {/* Top back & admin identity banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <BackButton fallbackTo="/" label="Exit Admin Dashboard" />

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>Admin Active ({user.email})</span>
          </span>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="bg-white rounded-2xl p-1.5 sm:p-2 border border-slate-200 shadow-2xs flex flex-wrap gap-1.5 sm:gap-2">
        <Link
          id="admin-tab-overview"
          to="/admin"
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            isTabActive('/admin') && location.pathname === '/admin'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Dashboard</span>
        </Link>

        <Link
          id="admin-tab-notes"
          to="/admin/notes"
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            isTabActive('/admin/notes')
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>All Notes</span>
        </Link>

        <Link
          id="admin-tab-upload"
          to="/admin/upload"
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            isTabActive('/admin/upload')
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>Upload PDF Note</span>
        </Link>

        <Link
          id="admin-tab-users"
          to="/admin/users"
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            isTabActive('/admin/users')
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Registered Users</span>
        </Link>
      </div>

      {/* Admin Content Area */}
      <Outlet />
    </div>
  );
};

import React, { useState } from 'react';
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { BackButton } from '../../components/common/BackButton';
import {
  ShieldCheck, LayoutDashboard, Users, FileText, Book, BookOpen, 
  Newspaper, GraduationCap, Library, ClipboardList, Database, 
  CheckSquare, FileQuestion, Grid, Ticket, Radio, Edit3, 
  Image, Star, ShoppingCart, BarChart3, MessageCircle, Settings,
  Menu, X
} from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const { user, isAdmin, loading, roleLoading } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (loading || roleLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="inline-block animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mb-3" />
        <p className="text-sm text-slate-500 font-medium">Verifying administrator credentials...</p>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  const isTabActive = (path: string, exact = false) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const NavItem = ({ to, icon: Icon, label, exact = false, badge = null }: { to: string; icon: any; label: string; exact?: boolean; badge?: string | null }) => {
    const active = isTabActive(to, exact);
    return (
      <Link
        to={to}
        onClick={() => setMobileMenuOpen(false)}
        className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          active 
            ? 'bg-blue-50 text-blue-700' 
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-blue-600' : 'text-slate-400'}`} />
          <span className="truncate">{label}</span>
        </div>
        {badge && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 shrink-0">
            {badge}
          </span>
        )}
      </Link>
    );
  };

  const NavGroup = ({ label, children }) => (
    <div className="mb-6">
      <h3 className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
        {label}
      </h3>
      <div className="space-y-0.5">
        {children}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row overflow-x-hidden md:overflow-x-visible">
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <button 
            id="admin-mobile-menu-toggle-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 -ml-1.5 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors focus:outline-hidden"
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <span className="font-bold text-slate-900 text-sm">Admin Panel</span>
          </div>
        </div>
        <BackButton fallbackTo="/" label="Exit" className="!px-2.5 !py-1 !text-xs" />
      </div>

      {/* Sidebar / Left Navigation Drawer on Mobile */}
      <div 
        id="admin-navigation-drawer"
        className={`
          fixed md:sticky inset-y-0 left-0 right-auto z-50 md:z-20 h-screen w-64 bg-white border-r border-slate-200 
          flex flex-col shadow-2xl md:shadow-none
          transition-transform duration-200 ease-in-out
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <BackButton fallbackTo="/" label="Exit" className="!px-2 !py-1 !text-xs" />
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Close navigation menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-blue-50 border border-blue-100">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-blue-900">Admin Active</span>
              <span className="text-[10px] text-blue-600 truncate max-w-[160px]">{user.email}</span>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3">
          <NavGroup label="Dashboard">
            <NavItem to="/admin" exact icon={LayoutDashboard} label="Overview" />
          </NavGroup>

          <NavGroup label="Students">
            <NavItem to="/admin/users" icon={Users} label="All Students" />
          </NavGroup>

          <NavGroup label="EC Notes / Content Management">
            <NavItem to="/admin/notes" icon={FileText} label="Notes" />
            <NavItem to="/admin/paid-ebooks" icon={Book} label="Paid E-Books" />
            <NavItem to="/admin/free-ebooks" icon={BookOpen} label="Free E-Books" />
            <NavItem to="/admin/current-affairs" icon={Newspaper} label="Current Affairs" />
            <NavItem to="/admin/exam-pattern" icon={GraduationCap} label="Exam Pattern & Syllabus" />
            <NavItem to="/admin/study-resources" icon={Library} label="Study Resources" />
            <NavItem to="/admin/banners" icon={Image} label="Home Banners" />
            <NavItem to="/admin/recommendations" icon={Star} label="Top Recommendations" />
          </NavGroup>

          <NavGroup label="EC Test">
            <NavItem to="/admin/sectional-test" icon={Grid} label="Sectional Tests" badge="Active" />
            <NavItem to="/admin/test-dashboard" icon={ClipboardList} label="Test Dashboard" />
            <NavItem to="/admin/question-bank" icon={Database} label="Question Bank" />
            <NavItem to="/admin/daily-quiz" icon={CheckSquare} label="Daily Quiz" />
            <NavItem to="/admin/chapter-test" icon={FileQuestion} label="Chapter Wise Test" />
            <NavItem to="/admin/test-pass" icon={Ticket} label="Test Pass" />
            <NavItem to="/admin/live-test" icon={Radio} label="Live Test" />
            <NavItem to="/admin/create-test" icon={Edit3} label="Create Test" />
          </NavGroup>

          

          <NavGroup label="Commerce">
            <NavItem to="/admin/orders" icon={ShoppingCart} label="Orders / Purchases" />
          </NavGroup>

          <NavGroup label="Analytics">
            <NavItem to="/admin/analytics" icon={BarChart3} label="Test Analytics" />
          </NavGroup>

          <NavGroup label="Settings">
            <NavItem to="/admin/whatsapp" icon={MessageCircle} label="WhatsApp" />
            <NavItem to="/admin/settings" icon={Settings} label="Website Settings" />
          </NavGroup>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
      
      {/* Mobile overlay backdrop */}
      {mobileMenuOpen && (
        <div 
          id="admin-mobile-drawer-backdrop"
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 md:hidden transition-opacity duration-200"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
};

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { BottomNav } from './components/layout/BottomNav';
import { EnvNotice } from './components/common/EnvNotice';

// Pages
import { HomePage } from './pages/HomePage';
import { SubjectsPage } from './pages/SubjectsPage';
import { CategoryNotesPage } from './pages/CategoryNotesPage';
import { BrowseNotesPage } from './pages/BrowseNotesPage';
import { PdfReaderPage } from './pages/PdfReaderPage';
import { PaidEbooksPage } from './pages/PaidEbooksPage';
import { FreeEbooksPage } from './pages/FreeEbooksPage';
import { CurrentAffairsPage } from './pages/CurrentAffairsPage';
import { SyllabusPage } from './pages/SyllabusPage';
import { SyllabusCategoryPage } from './pages/SyllabusCategoryPage';
import { SyllabusExamPage } from './pages/SyllabusExamPage';
import { StudyResourcesPage } from './pages/StudyResourcesPage';
import { PaidEbooksListingPage } from './pages/PaidEbooksListingPage';
import { FreeEbooksListingPage } from './pages/FreeEbooksListingPage';
import { StudyResourcesListingPage } from './pages/StudyResourcesListingPage';
import { SyllabusContentPage } from './pages/SyllabusContentPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';

import { ComingSoonPage } from './pages/ComingSoonPage';

// Admin Pages
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminOverviewPage } from './pages/admin/AdminOverviewPage';
import { AdminNotesPage } from './pages/admin/AdminNotesPage';
import { AdminUploadPage } from './pages/admin/AdminUploadPage';

import { 
  AdminFreeEbooksPage, AdminCurrentAffairsPage, 
  AdminExamPatternPage, AdminStudyResourcesPage, AdminQuestionsPage,
  AdminTestsPage, AdminTestPassPage, AdminBannersPage, AdminRecommendationsPage
} from './pages/admin/AdminDynamicPages';
import { AdminWhatsAppPage } from './pages/admin/AdminWhatsAppPage';
import { AdminPaidEbooksPage } from './pages/admin/AdminPaidEbooksPage';
import { AdminComingSoonPage } from './pages/admin/AdminComingSoonPage';

import { AdminUsersPage } from './pages/admin/AdminUsersPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <div className="min-h-screen flex flex-col bg-[#F4F8FF] md:bg-slate-50 text-slate-900 selection:bg-blue-600 selection:text-white">
            {/* Status notice if environment secrets are pending */}
            <EnvNotice />

            {/* Sticky Navigation Bar */}
            <Navbar />

            {/* Main Application Routes */}
            <main className="flex-1">
              <Routes>
                {/* Public & Student Routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/subjects" element={<SubjectsPage />} />
                <Route path="/subjects/:category" element={<CategoryNotesPage />} />
                <Route path="/notes" element={<BrowseNotesPage />} />
                <Route path="/notes/:id" element={<PdfReaderPage />} />
                
                {/* EC Notes Flow Routes */}
                <Route path="/paid-ebooks" element={<PaidEbooksPage />} />
                <Route path="/paid-ebooks/:category" element={<PaidEbooksListingPage />} />
                <Route path="/free-ebooks" element={<FreeEbooksPage />} />
                <Route path="/free-ebooks/:category" element={<FreeEbooksListingPage />} />
                <Route path="/current-affairs" element={<CurrentAffairsPage />} />
                <Route path="/syllabus" element={<SyllabusPage />} />
                <Route path="/syllabus/:category" element={<SyllabusCategoryPage />} />
                <Route path="/syllabus/:category/:exam" element={<SyllabusExamPage />} />
                <Route path="/syllabus/:category/:exam/:type" element={<SyllabusContentPage />} />
                <Route path="/resources" element={<StudyResourcesPage />} />
                <Route path="/resources/:category" element={<StudyResourcesListingPage />} />
                
                {/* EC Test Routes */}
                <Route path="/tests/*" element={<ComingSoonPage />} />
                
                {/* Authentication & User Account */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/settings" element={<SettingsPage />} />

                {/* Protected Admin Routes (public.profiles.role = 'admin') */}
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminOverviewPage />} />
                  <Route path="notes" element={<AdminNotesPage />} />
                  <Route path="upload" element={<AdminUploadPage />} />
                {/* Admin Dynamic Content Routes */}
                <Route path="paid-ebooks" element={<AdminPaidEbooksPage />} />
                <Route path="free-ebooks" element={<AdminFreeEbooksPage />} />
                <Route path="current-affairs" element={<AdminCurrentAffairsPage />} />
                <Route path="exam-pattern" element={<AdminExamPatternPage />} />
                <Route path="study-resources" element={<AdminStudyResourcesPage />} />
                
                {/* EC Test Routes */}
                <Route path="test-dashboard" element={<AdminComingSoonPage moduleName="Test Dashboard Module" />} />
                <Route path="question-bank" element={<AdminQuestionsPage />} />
                <Route path="daily-quiz" element={<AdminTestsPage />} />
                <Route path="chapter-test" element={<AdminTestsPage />} />
                <Route path="sectional-test" element={<AdminTestsPage />} />
                <Route path="test-pass" element={<AdminTestPassPage />} />
                <Route path="live-test" element={<AdminTestsPage />} />
                <Route path="create-test" element={<AdminTestsPage />} />
                
                {/* Other Admin Routes */}
                <Route path="banners" element={<AdminBannersPage />} />
                <Route path="recommendations" element={<AdminRecommendationsPage />} />
                <Route path="orders" element={<AdminComingSoonPage moduleName="Orders / Purchases Module" />} />
                <Route path="analytics" element={<AdminComingSoonPage moduleName="Test Analytics Module" />} />
                <Route path="whatsapp" element={<AdminWhatsAppPage />} />
                <Route path="settings" element={<AdminComingSoonPage moduleName="Website Settings" />} />

                  <Route path="users" element={<AdminUsersPage />} />
                </Route>

                {/* Catch-all fallback redirect */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>

            {/* Global Footer */}
            <div className="pb-16 md:pb-0">
              <Footer />
            </div>

            {/* Mobile Bottom Navigation */}
            <BottomNav />
          </div>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { syncLocalTestsWithServer } from './services/sectionalTestService';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { BottomNav } from './components/layout/BottomNav';
import { EnvNotice } from './components/common/EnvNotice';
import { ScrollToTop } from './components/common/ScrollToTop';

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
import { TestsLandingPage } from './pages/TestsLandingPage';
import { SectionalSubjectsPage } from './pages/sectional/SectionalSubjectsPage';
import { SectionalSubjectTestsPage } from './pages/sectional/SectionalSubjectTestsPage';
import { SectionalTestTakePage } from './pages/sectional/SectionalTestTakePage';

// Admin Pages
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminOverviewPage } from './pages/admin/AdminOverviewPage';
import { AdminNotesPage } from './pages/admin/AdminNotesPage';
import { AdminUploadPage } from './pages/admin/AdminUploadPage';

import { 
  AdminFreeEbooksPage, 
  AdminQuestionsPage,
  AdminTestsPage, AdminTestPassPage
} from './pages/admin/AdminDynamicPages';
import { AdminRecommendationsPage } from './pages/admin/AdminRecommendationsPage';
import { AdminBannersPage } from './pages/admin/AdminBannersPage';
import { AdminStudyResourcesPage } from './pages/admin/AdminStudyResourcesPage';
import { AdminCurrentAffairsPage } from './pages/admin/AdminCurrentAffairsPage';
import { AdminExamPatternPage } from './pages/admin/AdminExamPatternPage';
import { AdminWhatsAppPage } from './pages/admin/AdminWhatsAppPage';
import { AdminPaidEbooksPage } from './pages/admin/AdminPaidEbooksPage';
import { AdminComingSoonPage } from './pages/admin/AdminComingSoonPage';
import { AdminSectionalTestsPage } from './pages/admin/AdminSectionalTestsPage';

import { AdminUsersPage } from './pages/admin/AdminUsersPage';

export default function App() {
  useEffect(() => {
    // Automatically synchronize any local sectional tests with the shared backend
    syncLocalTestsWithServer().catch(() => {});
    const onFocus = () => {
      syncLocalTestsWithServer().catch(() => {});
    };
    window.addEventListener('focus', onFocus);
    window.addEventListener('visibilitychange', onFocus);
    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('visibilitychange', onFocus);
    };
  }, []);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
        <ToastProvider>
          <div className="min-h-screen flex flex-col bg-[#F4F8FF] md:bg-slate-50 text-slate-900 selection:bg-blue-600 selection:text-white">
            {/* Status notice if environment secrets are pending */}
            <div className="env-notice-container">
              <EnvNotice />
            </div>

            {/* Sticky Navigation Bar */}
            <div className="global-navbar-container">
              <Navbar />
            </div>

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
                <Route path="/study-resources" element={<StudyResourcesPage />} />
                <Route path="/study-resources/:category" element={<StudyResourcesListingPage />} />
                
                {/* EC Test Routes */}
                <Route path="/tests" element={<Navigate to="/?tab=test" replace />} />
                <Route path="/tests/sectional" element={<SectionalSubjectsPage />} />
                <Route path="/tests/sectional/:subject" element={<SectionalSubjectTestsPage />} />
                <Route path="/tests/sectional/test/:testId" element={<SectionalTestTakePage />} />
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
                <Route path="sectional-test" element={<AdminSectionalTestsPage />} />
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
            <div className="global-footer-container pb-16 md:pb-0">
              <Footer />
            </div>

            {/* Mobile Bottom Navigation */}
            <div className="global-bottomnav-container">
              <BottomNav />
            </div>
          </div>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

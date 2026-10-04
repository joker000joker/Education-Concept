import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { BottomNav } from './components/layout/BottomNav';
import { EnvNotice } from './components/common/EnvNotice';
import { ScrollToTop } from './components/common/ScrollToTop';
import { ConnectionStatusBanner } from './components/common/ConnectionStatusBanner';

// Immediate load for fastest Initial Page Paint
import { HomePage } from './pages/HomePage';

// Lazy-loaded routes for code-splitting (splits heavy libraries like pdfjs-dist and admin modules)
const SubjectsPage = React.lazy(() => import('./pages/SubjectsPage').then(m => ({ default: m.SubjectsPage })));
const CategoryNotesPage = React.lazy(() => import('./pages/CategoryNotesPage').then(m => ({ default: m.CategoryNotesPage })));
const BrowseNotesPage = React.lazy(() => import('./pages/BrowseNotesPage').then(m => ({ default: m.BrowseNotesPage })));
const PdfReaderPage = React.lazy(() => import('./pages/PdfReaderPage').then(m => ({ default: m.PdfReaderPage })));
const PaidEbooksPage = React.lazy(() => import('./pages/PaidEbooksPage').then(m => ({ default: m.PaidEbooksPage })));
const FreeEbooksPage = React.lazy(() => import('./pages/FreeEbooksPage').then(m => ({ default: m.FreeEbooksPage })));
const CurrentAffairsPage = React.lazy(() => import('./pages/CurrentAffairsPage').then(m => ({ default: m.CurrentAffairsPage })));
const SyllabusPage = React.lazy(() => import('./pages/SyllabusPage').then(m => ({ default: m.SyllabusPage })));
const SyllabusCategoryPage = React.lazy(() => import('./pages/SyllabusCategoryPage').then(m => ({ default: m.SyllabusCategoryPage })));
const SyllabusExamPage = React.lazy(() => import('./pages/SyllabusExamPage').then(m => ({ default: m.SyllabusExamPage })));
const StudyResourcesPage = React.lazy(() => import('./pages/StudyResourcesPage').then(m => ({ default: m.StudyResourcesPage })));
const PaidEbooksListingPage = React.lazy(() => import('./pages/PaidEbooksListingPage').then(m => ({ default: m.PaidEbooksListingPage })));
const FreeEbooksListingPage = React.lazy(() => import('./pages/FreeEbooksListingPage').then(m => ({ default: m.FreeEbooksListingPage })));
const StudyResourcesListingPage = React.lazy(() => import('./pages/StudyResourcesListingPage').then(m => ({ default: m.StudyResourcesListingPage })));
const SyllabusContentPage = React.lazy(() => import('./pages/SyllabusContentPage').then(m => ({ default: m.SyllabusContentPage })));
const LoginPage = React.lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const SignupPage = React.lazy(() => import('./pages/SignupPage').then(m => ({ default: m.SignupPage })));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const SettingsPage = React.lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));

const ComingSoonPage = React.lazy(() => import('./pages/ComingSoonPage').then(m => ({ default: m.ComingSoonPage })));
const SectionalSubjectsPage = React.lazy(() => import('./pages/sectional/SectionalSubjectsPage').then(m => ({ default: m.SectionalSubjectsPage })));
const SectionalSubjectTestsPage = React.lazy(() => import('./pages/sectional/SectionalSubjectTestsPage').then(m => ({ default: m.SectionalSubjectTestsPage })));
const SectionalTestTakePage = React.lazy(() => import('./pages/sectional/SectionalTestTakePage').then(m => ({ default: m.SectionalTestTakePage })));

// Chapter Wise Test Pages
const ChapterSubjectsPage = React.lazy(() => import('./pages/chapter/ChapterSubjectsPage').then(m => ({ default: m.ChapterSubjectsPage })));
const ChapterListPage = React.lazy(() => import('./pages/chapter/ChapterListPage').then(m => ({ default: m.ChapterListPage })));
const ChapterTestsPage = React.lazy(() => import('./pages/chapter/ChapterTestsPage').then(m => ({ default: m.ChapterTestsPage })));
const ChapterTestTakePage = React.lazy(() => import('./pages/chapter/ChapterTestTakePage').then(m => ({ default: m.ChapterTestTakePage })));

// Lazy-loaded Admin Pages
const AdminLayout = React.lazy(() => import('./pages/admin/AdminLayout').then(m => ({ default: m.AdminLayout })));
const AdminOverviewPage = React.lazy(() => import('./pages/admin/AdminOverviewPage').then(m => ({ default: m.AdminOverviewPage })));
const AdminNotesPage = React.lazy(() => import('./pages/admin/AdminNotesPage').then(m => ({ default: m.AdminNotesPage })));
const AdminUploadPage = React.lazy(() => import('./pages/admin/AdminUploadPage').then(m => ({ default: m.AdminUploadPage })));
const AdminFreeEbooksPage = React.lazy(() => import('./pages/admin/AdminDynamicPages').then(m => ({ default: m.AdminFreeEbooksPage })));
const AdminQuestionsPage = React.lazy(() => import('./pages/admin/AdminDynamicPages').then(m => ({ default: m.AdminQuestionsPage })));
const AdminTestsPage = React.lazy(() => import('./pages/admin/AdminDynamicPages').then(m => ({ default: m.AdminTestsPage })));
const AdminTestPassPage = React.lazy(() => import('./pages/admin/AdminDynamicPages').then(m => ({ default: m.AdminTestPassPage })));
const AdminRecommendationsPage = React.lazy(() => import('./pages/admin/AdminRecommendationsPage').then(m => ({ default: m.AdminRecommendationsPage })));
const AdminBannersPage = React.lazy(() => import('./pages/admin/AdminBannersPage').then(m => ({ default: m.AdminBannersPage })));
const AdminStudyResourcesPage = React.lazy(() => import('./pages/admin/AdminStudyResourcesPage').then(m => ({ default: m.AdminStudyResourcesPage })));
const AdminCurrentAffairsPage = React.lazy(() => import('./pages/admin/AdminCurrentAffairsPage').then(m => ({ default: m.AdminCurrentAffairsPage })));
const AdminExamPatternPage = React.lazy(() => import('./pages/admin/AdminExamPatternPage').then(m => ({ default: m.AdminExamPatternPage })));
const AdminWhatsAppPage = React.lazy(() => import('./pages/admin/AdminWhatsAppPage').then(m => ({ default: m.AdminWhatsAppPage })));
const AdminPaidEbooksPage = React.lazy(() => import('./pages/admin/AdminPaidEbooksPage').then(m => ({ default: m.AdminPaidEbooksPage })));
const AdminComingSoonPage = React.lazy(() => import('./pages/admin/AdminComingSoonPage').then(m => ({ default: m.AdminComingSoonPage })));
const AdminSectionalTestsPage = React.lazy(() => import('./pages/admin/AdminSectionalTestsPage').then(m => ({ default: m.AdminSectionalTestsPage })));
const AdminChapterWiseTestsPage = React.lazy(() => import('./pages/admin/AdminChapterWiseTestsPage').then(m => ({ default: m.AdminChapterWiseTestsPage })));
const AdminUsersPage = React.lazy(() => import('./pages/admin/AdminUsersPage').then(m => ({ default: m.AdminUsersPage })));
const AdminAnalyseTestPage = React.lazy(() => import('./pages/admin/AdminAnalyseTestPage').then(m => ({ default: m.AdminAnalyseTestPage })));

const RouteLoadingFallback = () => (
  <div className="flex-1 flex items-center justify-center min-h-[50vh]">
    <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
        <ToastProvider>
          <div className="min-h-screen flex flex-col bg-[#F4F8FF] md:bg-slate-50 text-slate-900 selection:bg-blue-600 selection:text-white">
            {/* Global Online / Offline Status Indicator */}
            <ConnectionStatusBanner />

            {/* Status notice if environment secrets are pending */}
            <div className="env-notice-container">
              <EnvNotice />
            </div>

            {/* Sticky Navigation Bar */}
            <div className="global-navbar-container">
              <Navbar />
            </div>

            {/* Main Application Routes with Route-level Suspense */}
            <main className="flex-1">
              <Suspense fallback={<RouteLoadingFallback />}>
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
                  <Route path="/tests/chapter-wise" element={<ChapterSubjectsPage />} />
                  <Route path="/tests/chapter-wise/:subject" element={<ChapterListPage />} />
                  <Route path="/tests/chapter-wise/:subject/sub/:subCategory" element={<ChapterListPage />} />
                  <Route path="/tests/chapter-wise/:subject/:chapterId" element={<ChapterTestsPage />} />
                  <Route path="/tests/chapter-wise/test/:testId" element={<ChapterTestTakePage />} />
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
                    <Route path="paid-ebooks" element={<AdminPaidEbooksPage />} />
                    <Route path="free-ebooks" element={<AdminFreeEbooksPage />} />
                    <Route path="current-affairs" element={<AdminCurrentAffairsPage />} />
                    <Route path="exam-pattern" element={<AdminExamPatternPage />} />
                    <Route path="study-resources" element={<AdminStudyResourcesPage />} />
                    
                    {/* EC Test Routes */}
                    <Route path="test-dashboard" element={<AdminComingSoonPage moduleName="Test Dashboard Module" />} />
                    <Route path="question-bank" element={<AdminQuestionsPage />} />
                    <Route path="daily-quiz" element={<AdminTestsPage />} />
                    <Route path="chapter-test" element={<AdminChapterWiseTestsPage />} />
                    <Route path="sectional-test" element={<AdminSectionalTestsPage />} />
                    <Route path="test-pass" element={<AdminTestPassPage />} />
                    <Route path="live-test" element={<AdminTestsPage />} />
                    <Route path="create-test" element={<AdminTestsPage />} />
                    
                    {/* Other Admin Routes */}
                    <Route path="banners" element={<AdminBannersPage />} />
                    <Route path="recommendations" element={<AdminRecommendationsPage />} />
                    <Route path="orders" element={<AdminComingSoonPage moduleName="Orders / Purchases Module" />} />
                    <Route path="analytics" element={<AdminAnalyseTestPage />} />
                    <Route path="analyse-test" element={<AdminAnalyseTestPage />} />
                    <Route path="whatsapp" element={<AdminWhatsAppPage />} />
                    <Route path="settings" element={<AdminComingSoonPage moduleName="Website Settings" />} />
                    <Route path="users" element={<AdminUsersPage />} />
                  </Route>

                  {/* Catch-all fallback redirect */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
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

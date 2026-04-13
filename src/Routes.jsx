import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route } from "react-router-dom";
import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";
import Layout from "components/Layout";
import ProtectedRoute from "components/ProtectedRoute";
import PublicRoute from "components/PublicRoute";
import AdminRoute from "components/AdminRoute";
import NotFound from "pages/NotFound";
import Home from "./pages/Home";
import Login from "./pages/Login";
import AdminLogin from "./pages/AdminLogin";
import Register from "./pages/Register";
import AuthCallback from "./pages/AuthCallback";
import AdminPanel from "./pages/admin";
import CollegeDetailsComparison from './pages/college-details-comparison';
import BookmarksSavedColleges from './pages/bookmarks-saved-colleges';
import CollegePredictionEngine from './pages/college-prediction-engine';
import PredictionResultsReports from './pages/prediction-results-reports';
import StudentDashboard from './pages/student-dashboard';
import CollegeSearchFilter from './pages/college-search-filter';
import ExploreColleges from './pages/explore-colleges';
import ProfileSettings from './pages/profile-settings';
import Preferences from './pages/preferences';
import HelpSupport from './pages/help-support';
import Community from './pages/community';
import Guidelines from './pages/guidelines';
import PrivacyPolicy from './pages/privacy-policy';
import TermsOfService from './pages/terms-of-service';
import CookiePolicy from './pages/cookie-policy';
import GDPR from './pages/gdpr';
import Features from './pages/features';
import Pricing from './pages/pricing';
import APIDocs from './pages/api-docs';
import Documentation from './pages/documentation';
import About from './pages/about';
import CounselingUpdates from './pages/counseling-updates';

const Routes = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
      <ScrollToTop />
      <Layout>
        <RouterRoutes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/admin/login" element={<PublicRoute><AdminLogin /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          
          {/* Public Content Routes */}
          <Route path="/features" element={<Features />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/api" element={<APIDocs />} />
          <Route path="/docs" element={<Documentation />} />
          <Route path="/about" element={<About />} />
          <Route path="/counseling-updates" element={<CounselingUpdates />} />
          
          {/* Protected Routes */}
          <Route path="/student-dashboard" element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>} />
          <Route path="/college-prediction-engine" element={<ProtectedRoute><CollegePredictionEngine /></ProtectedRoute>} />
          <Route path="/explore-colleges" element={<ProtectedRoute><ExploreColleges /></ProtectedRoute>} />
          <Route path="/profile-settings" element={<ProtectedRoute><ProfileSettings /></ProtectedRoute>} />
          <Route path="/preferences" element={<ProtectedRoute><Preferences /></ProtectedRoute>} />
          <Route path="/help-support" element={<ProtectedRoute><HelpSupport /></ProtectedRoute>} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
          <Route path="/prediction-results-reports" element={<ProtectedRoute><PredictionResultsReports /></ProtectedRoute>} />
          <Route path="/bookmarks-saved-colleges" element={<ProtectedRoute><BookmarksSavedColleges /></ProtectedRoute>} />
          <Route path="/college-search-filter" element={<ProtectedRoute><CollegeSearchFilter /></ProtectedRoute>} />
          <Route path="/college-details-comparison" element={<ProtectedRoute><CollegeDetailsComparison /></ProtectedRoute>} />
          
          {/* Legal & Info Routes */}
          <Route path="/help" element={<HelpSupport />} />
          <Route path="/community" element={<Community />} />
          <Route path="/guidelines" element={<Guidelines />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/cookies" element={<CookiePolicy />} />
          <Route path="/gdpr" element={<GDPR />} />
          
          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </RouterRoutes>
      </Layout>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;

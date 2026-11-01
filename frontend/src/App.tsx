import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import AuthLayout from './layouts/AuthLayout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import ShiftReportsPage from './pages/ShiftReportsPage';
import NewReportPage from './pages/NewReportPage';
import ReportDetailPage from './pages/ReportDetailPage';
import WorkforcePage from './pages/WorkforcePage';
import EquipmentPage from './pages/EquipmentPage';
import PendingIssuesPage from './pages/PendingIssuesPage';
import HistoricalPage from './pages/HistoricalPage';
import SettingsPage from './pages/SettingsPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import LoadingSpinner from './components/LoadingSpinner';
import { useAuth } from './hooks/useAuth';

const ProtectedApp: React.FC = () => {
  const { isAuthenticated, isDemo, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingSpinner message="Checking your MineBrief session..." size="lg" />;
  if (!isAuthenticated && !isDemo) return <Navigate to="/login" replace state={{ from: location }} />;
  return <AppLayout />;
};

export const App: React.FC = () => {
  return (
    <Routes>
      {/* Public Landing */}
      <Route path="/" element={<LandingPage />} />

      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
      </Route>

      {/* Main Enterprise App Layout */}
      <Route path="/app" element={<ProtectedApp />}>
        <Route index element={<Navigate to="/app/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="reports" element={<ShiftReportsPage />} />
        <Route path="reports/new" element={<NewReportPage />} />
        <Route path="reports/:id" element={<ReportDetailPage />} />
        <Route path="workforce" element={<WorkforcePage />} />
        <Route path="equipment" element={<EquipmentPage />} />
        <Route path="issues" element={<PendingIssuesPage />} />
        <Route path="history" element={<HistoricalPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;

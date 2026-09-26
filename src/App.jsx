import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext';

// Public Pages (STRICTLY NO ADMIN TRACES)
import LandingPage from './pages/public/LandingPage';
import PassLookupPage from './pages/public/PassLookupPage';

// Admin Pages (Protected behind /admin)
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminMembersPage from './pages/admin/AdminMembersPage';
import AdminPlansPage from './pages/admin/AdminPlansPage';
import AdminPaymentsPage from './pages/admin/AdminPaymentsPage';
import AdminAttendancePage from './pages/admin/AdminAttendancePage';
import AdminTrainersPage from './pages/admin/AdminTrainersPage';
import AdminAuditPage from './pages/admin/AdminAuditPage';

// Protected Route Guard for Admin
const RequireAdminAuth = ({ children }) => {
  const { isAuthenticated, loading } = useAdminAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-amber-500">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

function App() {
  return (
    <AdminAuthProvider>
      <Routes>
        {/* ============================================== */}
        {/* PUBLIC ROUTES — NO ADMIN REFERENCES WHATSOEVER */}
        {/* ============================================== */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/pass-lookup" element={<PassLookupPage />} />

        {/* ============================================== */}
        {/* ADMIN PORTAL — SEPARATE & PROTECTED            */}
        {/* ============================================== */}
        <Route path="/admin/login" element={<AdminLoginPage />} />

        <Route
          path="/admin"
          element={
            <RequireAdminAuth>
              <AdminLayout />
            </RequireAdminAuth>
          }
        >
          <Route index element={<AdminDashboardPage />} />
          <Route path="members" element={<AdminMembersPage />} />
          <Route path="plans" element={<AdminPlansPage />} />
          <Route path="payments" element={<AdminPaymentsPage />} />
          <Route path="attendance" element={<AdminAttendancePage />} />
          <Route path="trainers" element={<AdminTrainersPage />} />
          <Route path="audit" element={<AdminAuditPage />} />
        </Route>

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AdminAuthProvider>
  );
}

export default App;

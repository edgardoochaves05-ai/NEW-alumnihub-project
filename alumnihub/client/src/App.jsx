import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./components/layout/Layout";

// Pages
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import ProfilePage from "./pages/ProfilePage";
import AlumniListPage from "./pages/AlumniListPage";
import StudentDirectoryPage from "./pages/StudentDirectoryPage";
import JobsPage from "./pages/JobsPage";
import MessagesPage from "./pages/MessagesPage";
import ReportsPage from "./pages/ReportsPage";
import CareerPredictionPage from "./pages/CareerPredictionPage";
import CurriculumImpactPage from "./pages/CurriculumImpactPage";
import SettingsPage from "./pages/SettingsPage";
import AdvisorRosterPage from "./pages/AdvisorRosterPage";
import StudentCareerPathPage from "./pages/StudentCareerPathPage";
import AdvisorManagementPage from "./pages/AdvisorManagementPage";

// Redirect career_advisor from /dashboard → their roster
function DashboardRoute() {
  const { profile } = useAuth();
  if (profile?.role === "career_advisor") return <Navigate to="/advisor/roster" replace />;
  return <DashboardPage />;
}

// Protected route wrapper
function ProtectedRoute({ children, allowedRoles }) {
  const { user, profile, loading } = useAuth();

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(profile?.role)) {
    return <Navigate to="/dashboard" />;
  }

  return children;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <RegisterPage />} />

      {/* Protected routes */}
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<DashboardRoute />} />

        {/* Profile — Alumni and Student */}
        <Route
          path="profile"
          element={
            <ProtectedRoute allowedRoles={["alumni", "student"]}>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route path="profile/:id" element={<ProfilePage />} />

        {/* Alumni Directory — Admin only */}
        <Route
          path="alumni"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AlumniListPage />
            </ProtectedRoute>
          }
        />

        {/* Student Directory — Admin only */}
        <Route
          path="students"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <StudentDirectoryPage />
            </ProtectedRoute>
          }
        />


        {/* Jobs — all roles */}
        <Route path="jobs" element={<JobsPage />} />

        {/* Inbox — Alumni, Student, Admin, Career Advisor */}
        <Route
          path="messages"
          element={
            <ProtectedRoute allowedRoles={["alumni", "student", "admin", "career_advisor"]}>
              <MessagesPage />
            </ProtectedRoute>
          }
        />

        {/* Settings — All roles */}
        <Route
          path="settings"
          element={
            <ProtectedRoute allowedRoles={["alumni", "student", "admin", "career_advisor"]}>
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        {/* Career Advisor — Roster & Student Detail */}
        <Route
          path="advisor/roster"
          element={
            <ProtectedRoute allowedRoles={["career_advisor"]}>
              <AdvisorRosterPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="advisor/student/:id"
          element={
            <ProtectedRoute allowedRoles={["career_advisor"]}>
              <StudentCareerPathPage />
            </ProtectedRoute>
          }
        />

        {/* Advisor Management — Admin only */}
        <Route
          path="advisor-management"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdvisorManagementPage />
            </ProtectedRoute>
          }
        />

        {/* Career Prediction — Alumni only */}
        <Route
          path="career-prediction"
          element={
            <ProtectedRoute allowedRoles={["alumni"]}>
              <CareerPredictionPage />
            </ProtectedRoute>
          }
        />

        {/* Reports — Admin only */}
        <Route
          path="reports"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <ReportsPage />
            </ProtectedRoute>
          }
        />

        {/* Curriculum Impact — Admin only */}
        <Route
          path="curriculum-impact"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <CurriculumImpactPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

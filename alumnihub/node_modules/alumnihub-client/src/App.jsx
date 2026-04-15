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
        <Route path="dashboard" element={<DashboardPage />} />

        {/* Profile — Alumni, Student, Faculty */}
        <Route
          path="profile"
          element={
            <ProtectedRoute allowedRoles={["alumni", "student", "faculty"]}>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route path="profile/:id" element={<ProfilePage />} />

        {/* Alumni Directory — Faculty and Admin only */}
        <Route
          path="alumni"
          element={
            <ProtectedRoute allowedRoles={["faculty", "admin"]}>
              <AlumniListPage />
            </ProtectedRoute>
          }
        />

        {/* Student Directory — Faculty and Admin only */}
        <Route
          path="students"
          element={
            <ProtectedRoute allowedRoles={["faculty", "admin"]}>
              <StudentDirectoryPage />
            </ProtectedRoute>
          }
        />

        {/* Jobs — all roles */}
        <Route path="jobs" element={<JobsPage />} />

        {/* Inbox — Alumni, Student, and Faculty */}
        <Route
          path="messages"
          element={
            <ProtectedRoute allowedRoles={["alumni", "student", "faculty"]}>
              <MessagesPage />
            </ProtectedRoute>
          }
        />

        {/* Settings — Alumni, Faculty, and Admin */}
        <Route
          path="settings"
          element={
            <ProtectedRoute allowedRoles={["alumni", "faculty", "admin"]}>
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        {/* Career Prediction — Faculty and Admin only */}
        <Route
          path="career-prediction"
          element={
            <ProtectedRoute allowedRoles={["faculty", "admin"]}>
              <CareerPredictionPage />
            </ProtectedRoute>
          }
        />

        {/* Reports — Faculty and Admin */}
        <Route
          path="reports"
          element={
            <ProtectedRoute allowedRoles={["faculty", "admin"]}>
              <ReportsPage />
            </ProtectedRoute>
          }
        />

        {/* Curriculum Impact — Faculty and Admin */}
        <Route
          path="curriculum-impact"
          element={
            <ProtectedRoute allowedRoles={["faculty", "admin"]}>
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

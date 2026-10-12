// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/layout/Navbar';
import AdminSidebar from './components/layout/AdminSidebar';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Home from './pages/Home';
import PatientDashboard from './pages/patient/Dashboard';
import DoctorDashboard from './pages/doctor/Dashboard';
import LaboratoryDashboard from './pages/laboratory/Dashboard';
import PharmacyDashboard from './pages/pharmacy/Dashboard';
import AdminDashboard from './pages/admin/Dashboard';
import PendingApprovals from './pages/admin/PendingApprovals';
import UserManagement from './pages/admin/UserManagement';
import { USER_ROLES } from './utils/constants';

// Dashboard Router Component
const DashboardRouter = () => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  switch (user.role) {
    case USER_ROLES.PATIENT:
      return <PatientDashboard />;
    case USER_ROLES.DOCTOR:
      return <DoctorDashboard />;
    case USER_ROLES.LABORATORY:
      return <LaboratoryDashboard />;
    case USER_ROLES.PHARMACY:
      return <PharmacyDashboard />;
    case USER_ROLES.ADMIN:
      return <Navigate to="/admin/dashboard" replace />;
    default:
      return <Navigate to="/" replace />;
  }
};

// Admin Layout Component (No Navbar, Has Sidebar)
const AdminLayout = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar />
      <div className="flex-1 ml-64">
        {children}
      </div>
    </div>
  );
};

// Main Layout Component (With Navbar)
const MainLayout = ({ children }) => {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            {/* Public Routes - With Navbar */}
            <Route path="/" element={<MainLayout><Home /></MainLayout>} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Dashboard - With Navbar */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <DashboardRouter />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            {/* Admin Routes - No Navbar, With Sidebar */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                  <AdminLayout>
                    <AdminDashboard />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/pending-approvals"
              element={
                <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                  <AdminLayout>
                    <PendingApprovals />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                  <AdminLayout>
                    <UserManagement />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            
            {/* Catch All */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
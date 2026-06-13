import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import Login from './components/login.jsx'
import { useAuth } from './contexts/AuthContext.jsx'
import ProtectedRoute from './routes/ProtectedRoute.jsx'
import AdminDashboard from './pages/Dashboard/AdminDashboard.jsx'
import UserDashboard from './pages/Dashboard/UserDashboard.jsx'
import Membership from './pages/Dashboard/Membership.jsx'
import Payments from './pages/Payments/Payments.jsx'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/auth" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['user']}>
              <UserDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/membership"
          element={
            <ProtectedRoute allowedRoles={['user', 'admin']}>
              <Membership />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payments"
          element={
            <ProtectedRoute allowedRoles={['user', 'admin']}>
              <Payments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

function HomeRedirect() {
  const { user, isReady, resolveDashboardPath } = useAuth();

  if (!isReady) {
    return (
      <main className="dashboard-shell">
        <section className="dashboard-card">
          <p className="eyebrow">Loading</p>
          <h1>Preparing your session.</h1>
        </section>
      </main>
    );
  }

  return <Navigate to={user ? resolveDashboardPath(user) : '/auth'} replace />;
}

export default App

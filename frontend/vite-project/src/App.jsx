import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AdminSignup from './pages/Auth/AdminSignup.jsx'
import AdminSignin from './pages/Auth/AdminSignin.jsx'
import './App.css'
import UserSignup from './pages/Auth/UserSignup.jsx'
import UserSignin from './pages/Auth/UserSignin.jsx'
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
        <Route path="/signup" element={<UserSignup />} />
        <Route path="/signin" element={<UserSignin />} />
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
        <Route path="/admin/signup" element={<AdminSignup />} />
<Route path="/admin/signin" element={<AdminSignin />} />
<Route path="*" element={<Navigate to="/signin" replace />} />
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

  return <Navigate to={user ? resolveDashboardPath(user) : '/signin'} replace />;
}

export default App

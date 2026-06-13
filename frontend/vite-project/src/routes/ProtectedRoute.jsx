import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function ProtectedRoute({ allowedRoles, children }) {
    const { user, isReady, resolveDashboardPath } = useAuth();

    if (!isReady) {
        return (
            <main className="dashboard-shell">
                <section className="dashboard-card">
                    <p className="eyebrow">Loading session</p>
                    <h1>Checking your access.</h1>
                </section>
            </main>
        );
    }

    if (!user) {
        return <Navigate to="/auth" replace />;
    }

    if (Array.isArray(allowedRoles) && !allowedRoles.includes(user.role)) {
        return <Navigate to={resolveDashboardPath(user)} replace />;
    }

    return children;
}

export default ProtectedRoute;

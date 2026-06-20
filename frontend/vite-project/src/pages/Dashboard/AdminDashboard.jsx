import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../utils/apiClient';
import DashboardLayout from '../../components/DashboardLayout/DashboardLayout';

function AdminDashboard() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [overview, setOverview] = useState(null);
    const [recentUsers, setRecentUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;

        const loadOverview = async () => {
            setLoading(true);

            try {
                const response = await apiClient.get('/auth/admin/overview');

                if (!cancelled) {
                    setOverview(response.data.overview);
                    setRecentUsers(response.data.recentUsers || []);
                }
            } catch (requestError) {
                if (!cancelled) {
                    setError(requestError.response?.data?.message || 'Unable to load admin data');
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadOverview();

        return () => {
            cancelled = true;
        };
    }, []);

    const handleLogout = async () => {
        await logout();
        navigate('/admin/signin', { replace: true });
    };

    return (
        <DashboardLayout title="Admin Dashboard">
            <section className="dashboard-card dashboard-card-admin" style={{ width: '100%', margin: '0 auto' }}>
                <p className="eyebrow">Admin dashboard</p>
                <h1>Welcome back{user?.name ? `, ${user.name}` : ''}.</h1>
                <p>
                    Administrative access is protected separately from regular users and remains active across reloads.
                </p>

                {loading ? <p className="dashboard-inline-note">Loading live admin data...</p> : null}
                {error ? <p className="dashboard-inline-note error">{error}</p> : null}

                <div className="dashboard-details">
                    <div>
                        <span>Total users</span>
                        <strong>{overview?.totalUsers ?? 0}</strong>
                    </div>
                    <div>
                        <span>Verified users</span>
                        <strong>{overview?.verifiedUsers ?? 0}</strong>
                    </div>
                    <div>
                        <span>Pending users</span>
                        <strong>{overview?.pendingUsers ?? 0}</strong>
                    </div>
                </div>

                <div className="dashboard-list">
                    <div className="dashboard-list-header">
                        <h2>Recent users</h2>
                        <span>{overview?.adminUsers ?? 0} admins total</span>
                    </div>

                    <div className="dashboard-list-body">
                        {recentUsers.length ? recentUsers.map((recentUser) => (
                            <div key={recentUser.id} className="dashboard-list-item">
                                <div>
                                    <strong>{recentUser.name}</strong>
                                    <span>{recentUser.email}</span>
                                </div>
                                <div>
                                    <span>{recentUser.role}</span>
                                    <strong>{recentUser.isVerified ? 'Verified' : 'Pending'}</strong>
                                </div>
                            </div>
                        )) : (
                            <p className="dashboard-inline-note">No user records yet.</p>
                        )}
                    </div>
                </div>

                <div className="dashboard-actions">
                    <button className="primary-button" type="button" onClick={handleLogout}>
                        Log out
                    </button>
                    <button className="secondary-button" type="button" onClick={() => navigate('/dashboard')}>
                        User dashboard
                    </button>
                </div>
            </section>
        </DashboardLayout>
    );
}

export default AdminDashboard;

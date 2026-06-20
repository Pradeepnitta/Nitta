import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../utils/apiClient';
import DashboardLayout from '../../components/DashboardLayout/DashboardLayout';

function UserDashboard() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [profile, setProfile] = useState(user);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;

        const loadProfile = async () => {
            setLoading(true);

            try {
                const response = await apiClient.get('/auth/me');

                if (!cancelled && response.data?.user) {
                    setProfile(response.data.user);
                }
            } catch (requestError) {
                if (!cancelled) {
                    setError(requestError.response?.data?.message || 'Unable to refresh your profile');
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadProfile();

        return () => {
            cancelled = true;
        };
    }, []);

    const handleLogout = async () => {
        await logout();
        navigate('/signin', { replace: true });
    };

    return (
        <DashboardLayout title="User Dashboard">
            <section className="dashboard-card dashboard-card-user" style={{ width: '100%', margin: '0 auto' }}>
                <p className="eyebrow">User dashboard</p>
                <h1>Welcome{user?.name ? `, ${user.name}` : ''}.</h1>
                <p>
                    You are signed in as a user. Your session stays active across reloads until you log out.
                </p>

                {loading ? <p className="dashboard-inline-note">Refreshing profile...</p> : null}
                {error ? <p className="dashboard-inline-note error">{error}</p> : null}

                <div className="dashboard-details">
                    <div>
                        <span>Role</span>
                        <strong>{profile?.role || 'user'}</strong>
                    </div>
                    <div>
                        <span>Email</span>
                        <strong>{profile?.email || 'not available'}</strong>
                    </div>
                    <div>
                        <span>Status</span>
                        <strong>{profile?.isVerified ? 'Verified' : 'Pending verification'}</strong>
                    </div>
                </div>

                <div className="dashboard-actions">
                    <button className="primary-button" type="button" onClick={handleLogout}>
                        Log out
                    </button>
                </div>
            </section>
        </DashboardLayout>
    );
}

export default UserDashboard;

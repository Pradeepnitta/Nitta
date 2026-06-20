import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import apiClient from '../../utils/apiClient.js';

function AdminSignin() {
  const [form, setForm] = useState({ identifier: '', password: '', adminKey: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, login, resolveDashboardPath } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const storeSession = (token, user) => {
    login(user, token);
    navigate(resolveDashboardPath(user), { replace: true });
  };

  const handleSignin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await apiClient.post('/admin/signin', {
        identifier: form.identifier,
        password: form.password,
        adminKey: form.adminKey,
        role: 'admin'
      });
      storeSession(response.data.token, response.data.user);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to sign in');
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return <Navigate to={resolveDashboardPath(user)} replace />;
  }

  return (
    <section className="auth-page">
      <h2>Admin Sign In</h2>
      <form onSubmit={handleSignin} className="auth-form">
        <label>Email or Username</label>
        <input name="identifier" value={form.identifier} onChange={handleChange} required />
        <label>Password</label>
        <input name="password" type="password" value={form.password} onChange={handleChange} required />
        <label>Admin Key</label>
        <input name="adminKey" type="password" autoComplete="new-password" value={form.adminKey} onChange={handleChange} required />
        {error && <p className="error-text">{error}</p>}
        <button type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Sign In'}</button>
      </form>
      <p>Don't have an admin account? <Link to="/admin/signup">Sign up</Link></p>
      <p style={{ marginTop: '10px', fontSize: '0.85rem' }}>
        Standard user? <Link to="/signin">Sign in here</Link>
      </p>
    </section>
  );
}

export default AdminSignin;

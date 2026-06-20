import React, { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import apiClient from '../../utils/apiClient.js';

function AdminSignup() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    adminKey: ''
  });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const { user, resolveDashboardPath } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setErrors({ confirmPassword: 'Passwords do not match' });
      return;
    }
    try {
      await apiClient.post('/admin/signup', {
        name: form.name,
        email: form.email,
        password: form.password,
        adminKey: form.adminKey
      });
      // After successful signup, redirect to admin signin
      navigate('/admin/signin');
    } catch (err) {
      console.error('Admin signup error', err);
      setErrors({ submit: err.response?.data?.message || 'Signup failed' });
    }
  };

  // If already logged in, redirect appropriately
  if (user) {
    return <Navigate to={resolveDashboardPath(user)} replace />;
  }

  return (
    <section className="auth-page">
      <h2>Admin Sign Up</h2>
      <form onSubmit={handleSubmit} className="auth-form">
        <label>Name</label>
        <input name="name" value={form.name} onChange={handleChange} required />
        <label>Email</label>
        <input name="email" type="email" value={form.email} onChange={handleChange} required />
        <label>Password</label>
        <input name="password" type="password" value={form.password} onChange={handleChange} required />
        <label>Confirm Password</label>
        <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} required />
        <label>Admin Key</label>
        <input name="adminKey" type="password" autoComplete="new-password" value={form.adminKey} onChange={handleChange} required />
        {errors.confirmPassword && <p className="error-text">{errors.confirmPassword}</p>}
        {errors.submit && <p className="error-text">{errors.submit}</p>}
        <button type="submit">Sign up</button>
      </form>
      <p>Already have an admin account? <Link to="/admin/signin">Sign in</Link></p>
      <p style={{ marginTop: '10px', fontSize: '0.85rem' }}>
        Standard user? <Link to="/signup">Sign up here</Link>
      </p>
    </section>
  );
}

export default AdminSignup;

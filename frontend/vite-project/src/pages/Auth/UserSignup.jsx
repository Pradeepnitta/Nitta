// User Signup Page (no admin role selection)
import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import apiClient from '../../utils/apiClient.js';

function UserSignup() {
  const [signupForm, setSignupForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const { user, resolveDashboardPath } = useAuth();

  const updateSignup = (e) => {
    const { name, value } = e.target;
    setSignupForm((prev) => ({ ...prev, [name]: value }));
    // clear error for this field on change
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    // basic client‑side validation
    if (signupForm.password !== signupForm.confirmPassword) {
      setErrors({ confirmPassword: 'Passwords do not match' });
      return;
    }
    try {
      const response = await apiClient.post('/auth/signup', {
        name: signupForm.name,
        email: signupForm.email,
        phone: signupForm.phone,
        password: signupForm.password,
        role: 'user'
      });
      if (response?.data?.message) {
        console.log(response.data.message);
      }
      navigate('/signin');
    } catch (err) {
      console.error('Signup error', err);
      setErrors({ submit: err.response?.data?.message || 'Signup failed' });
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = '/api/auth/google';
  };

  // If already logged in, redirect to appropriate dashboard
  if (user) {
    return <Navigate to={resolveDashboardPath(user)} replace />;
  }

  return (
    <section className="auth-page">
      <h2>Sign up</h2>
      <form onSubmit={handleSignup} className="auth-form">
        <label>Name</label>
        <input name="name" value={signupForm.name} onChange={updateSignup} required />
        <label>Email</label>
        <input name="email" type="email" value={signupForm.email} onChange={updateSignup} required />
        <label>Phone</label>
        <input name="phone" value={signupForm.phone} onChange={updateSignup} required />
        <label>Password</label>
        <input name="password" type="password" value={signupForm.password} onChange={updateSignup} required />
        <label>Confirm Password</label>
        <input name="confirmPassword" type="password" value={signupForm.confirmPassword} onChange={updateSignup} required />
        {errors.confirmPassword && <p className="error-text">{errors.confirmPassword}</p>}
        {errors.submit && <p className="error-text">{errors.submit}</p>}
        <button type="submit">Sign up</button>
        <div className="auth-divider">or</div>
        <button type="button" onClick={handleGoogleLogin} className="google-btn">
          <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '8px' }}>
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
          </svg>
          Continue with Google
        </button>
      </form>
      <p>Already have an account? <Link to="/signin">Sign in</Link></p>
      <p style={{ marginTop: '10px', fontSize: '0.85rem' }}>
        Are you an administrator? <Link to="/admin/signup">Sign up here</Link>
      </p>
    </section>
  );
}

export default UserSignup;

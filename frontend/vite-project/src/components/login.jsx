import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import apiClient from '../utils/apiClient';
import Navbar from './Navbar/Navbar';

const emptySignup = {
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  role: 'user'
};

const emptySignin = {
  identifier: '',
  password: '',
  role: 'user'
};

const emptyVerification = {
  emailOtp: '',
  phoneOtp: ''
};

function Login() {
  const navigate = useNavigate();
  const { user, login, isReady, resolveDashboardPath } = useAuth();
  const [activeTab, setActiveTab] = useState('signin');
  const [signupForm, setSignupForm] = useState(emptySignup);
  const [signinForm, setSigninForm] = useState(emptySignin);
  const [verificationForm, setVerificationForm] = useState(emptyVerification);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState(false);
  const [pendingIdentity, setPendingIdentity] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const verificationTarget = useMemo(() => {
    if (pendingIdentity) {
      return pendingIdentity;
    }

    if (activeTab === 'signin') {
      return null;
    }

    return {
      email: signupForm.email,
      phone: signupForm.phone
    };
  }, [activeTab, pendingIdentity, signupForm.email, signupForm.phone]);

  useEffect(() => {
    if (isReady && user) {
      navigate(resolveDashboardPath(user), { replace: true });
    }
  }, [isReady, navigate, resolveDashboardPath, user]);

  const googleLogin = () => {
    window.location.href = 'https://localhost:5000/api/auth/google';
  };

  const updateSignup = (event) => {
    const { name, value } = event.target;
    setSignupForm((current) => ({ ...current, [name]: value }));
  };

  const updateSignin = (event) => {
    const { name, value } = event.target;
    setSigninForm((current) => ({ ...current, [name]: value }));
  };

  const updateVerification = (event) => {
    const { name, value } = event.target;
    setVerificationForm((current) => ({ ...current, [name]: value }));
  };

  const storeSession = (token, user) => {
    login(user, token);
    navigate(resolveDashboardPath(user), { replace: true });
  };

  const handleSignup = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (signupForm.password !== signupForm.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await apiClient.post('/auth/signup', {
        name: signupForm.name,
        email: signupForm.email,
        password: signupForm.password,
        role: signupForm.role
      });

      setPendingIdentity({
        email: signupForm.email,
        role: signupForm.role
      });
      setVerificationForm(
        response.data.verificationPreview || emptyVerification
      );
      setActiveTab('verify');
      setMessage(response.data.message || 'Signup complete. Enter the OTP codes to finish verification.');
      setSignupForm(emptySignup);
      setShowSignupPassword(false);
      setShowSignupConfirmPassword(false);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to create your account');
    } finally {
      setLoading(false);
    }
  };

  const handleSignin = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await apiClient.post('/auth/signin', {
        identifier: signinForm.identifier,
        password: signinForm.password,
        role: signinForm.role
      });

      storeSession(response.data.token, response.data.user);
    } catch (requestError) {
      const responseMessage = requestError.response?.data?.message || 'Unable to sign in';

      if (requestError.response?.status === 403) {
        const user = requestError.response?.data?.user;

        if (user) {
          setPendingIdentity({
            email: user.email,
            phone: user.phone,
            role: user.role
          });
          setActiveTab('verify');
        }
      }

      setError(responseMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await apiClient.post('/auth/verify-otp', {
        email: verificationTarget?.email,
        emailOtp: verificationForm.emailOtp
      });

      if (response.data.token) {
        storeSession(response.data.token, response.data.user);
        return;
      }

      setMessage(response.data.message || 'Verification updated. Complete the remaining step to continue.');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to verify the account');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setMessage('');

    if (!verificationTarget?.email && !verificationTarget?.phone) {
      setError('Sign up or sign in first so we know where to resend the codes.');
      return;
    }

    setLoading(true);

    try {
      const response = await apiClient.post('/auth/resend-otp', {
        email: verificationTarget.email,
        phone: verificationTarget.phone
      });

      if (response.data.verificationPreview) {
        setVerificationForm(response.data.verificationPreview);
      }

      setMessage(response.data.message || 'Verification codes resent.');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to resend verification codes');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <Navbar currentPath="/auth" onNavigate={(path) => navigate(path)} />
      <div className="auth-glow auth-glow-left" />
      <div className="auth-glow auth-glow-right" />

      <section className="auth-grid" style={{ paddingTop: '20px' }}>
        <aside className="auth-hero">
          <p className="eyebrow">Secure access for teams</p>
          <h1>One entry point for users and admins.</h1>
          <p className="auth-copy">
            Register a new account, verify your email and phone with OTP, and sign in with the same screen.
          </p>

          <div className="feature-list">
            <div>
              <strong>Role aware</strong>
              <span>Separate user and admin access paths.</span>
            </div>
            <div>
              <strong>OTP verification</strong>
              <span>Email and phone are verified before login.</span>
            </div>
            <div>
              <strong>Google login</strong>
              <span>Keep the existing social sign-in for fast access.</span>
            </div>
          </div>
        </aside>

        <section className="auth-card">
          <div className="tab-row">
            <button
              type="button"
              className={activeTab === 'signin' ? 'tab active' : 'tab'}
              onClick={() => setActiveTab('signin')}
            >
              Sign in
            </button>
            <button
              type="button"
              className={activeTab === 'signup' ? 'tab active' : 'tab'}
              onClick={() => setActiveTab('signup')}
            >
              Sign up
            </button>
            <button
              type="button"
              className={activeTab === 'verify' ? 'tab active' : 'tab'}
              onClick={() => setActiveTab('verify')}
            >
              Verify OTP
            </button>
          </div>

          {message ? <div className="status success">{message}</div> : null}
          {error ? <div className="status error">{error}</div> : null}

          {activeTab === 'signin' ? (
            <form className="form-stack" onSubmit={handleSignin}>
              <label>
                Account type
                <select name="role" value={signinForm.role} onChange={updateSignin}>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </label>

              <label>
                Email or phone
                <input
                  name="identifier"
                  value={signinForm.identifier}
                  onChange={updateSignin}
                  placeholder="name@example.com or 5551234567"
                />
              </label>

              <label>
                Password
                <input
                  type="password"
                  name="password"
                  value={signinForm.password}
                  onChange={updateSignin}
                  placeholder="Enter your password"
                />
              </label>

              <button className="primary-button" type="submit" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign in'}
              </button>

              <button className="secondary-button" type="button" onClick={googleLogin}>
                Continue with Google
              </button>
            </form>
          ) : null}

          {activeTab === 'signup' ? (
            <form className="form-stack" onSubmit={handleSignup}>
              <label>
                Account type
                <select name="role" value={signupForm.role} onChange={updateSignup}>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </label>

              <label>
                Full name
                <input
                  name="name"
                  value={signupForm.name}
                  onChange={updateSignup}
                  placeholder="Your full name"
                />
              </label>

              <label>
                Email
                <input
                  type="email"
                  name="email"
                  value={signupForm.email}
                  onChange={updateSignup}
                  placeholder="name@example.com"
                />
              </label>

              <label>
                Password
                <input
                  type={showSignupPassword ? 'text' : 'password'}
                  name="password"
                  value={signupForm.password}
                  onChange={updateSignup}
                  placeholder="Create a password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowSignupPassword((current) => !current)}
                >
                  {showSignupPassword ? 'Hide password' : 'Show password'}
                </button>
              </label>

              <label>
                Confirm password
                <input
                  type={showSignupConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={signupForm.confirmPassword}
                  onChange={updateSignup}
                  placeholder="Repeat password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowSignupConfirmPassword((current) => !current)}
                >
                  {showSignupConfirmPassword ? 'Hide password' : 'Show password'}
                </button>
              </label>

              <button className="primary-button" type="submit" disabled={loading}>
                {loading ? 'Creating account...' : 'Create account'}
              </button>

              <button className="secondary-button" type="button" onClick={googleLogin}>
                Use Google instead
              </button>
            </form>
          ) : null}

          {activeTab === 'verify' ? (
            <form className="form-stack" onSubmit={handleVerify}>
              <p className="verification-note">
                Enter the code sent to {verificationTarget?.email || 'your email'}.
              </p>

              <label>
                Email OTP
                <input
                  name="emailOtp"
                  value={verificationForm.emailOtp}
                  onChange={updateVerification}
                  placeholder="6-digit email code"
                />
              </label>

              <button className="primary-button" type="submit" disabled={loading}>
                {loading ? 'Verifying...' : 'Verify and continue'}
              </button>

              <button className="secondary-button" type="button" onClick={handleResend} disabled={loading}>
                Resend codes
              </button>
            </form>
          ) : null}
        </section>
      </section>
    </div>
  );
}

export default Login;
import { useState } from 'react';
import './ForgotPasswordPage.css';

import topLogo from "../assets/yappy-logo.png";
import vectorUpper from "../assets/Vector.png";
import vectorLower from "../assets/Vector (1).png";
import whiteWave from "../assets/White wave.png";
import authService from "../services/authService";

const ForgotPasswordPage = (props) => {
  const [token, setToken] = useState(() => {
    if (typeof window !== 'undefined' && window.location.search) {
      return new URLSearchParams(window.location.search).get('token') || '';
    }
    return '';
  });
  const [mode, setMode] = useState(() => {
    if (typeof window !== 'undefined' && window.location.search) {
      return new URLSearchParams(window.location.search).get('token') ? 'reset' : 'request';
    }
    return 'request';
  }); // 'request' | 'reset'
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setErrors({});
    setStatusMessage(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setErrors({ email: 'Please enter your email address' });
      return;
    }
    if (!emailRegex.test(email.trim())) {
      setErrors({ email: 'Please enter a valid email address' });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await authService.forgotPassword({ email: email.trim() });
      setStatusMessage({
        type: 'success',
        title: 'Recovery Email Sent',
        body: response?.message || 'If an account exists with this email, a password reset link will be sent.'
      });
    } catch (err) {
      const isNetworkError = Boolean(err.isNetworkOrCors || err.code === 'ERR_NETWORK' || !err.response);
      const errMsg =
        isNetworkError
          ? 'Network Error. Please check your internet connection.'
          : err.friendlyMessage ||
            err.response?.data?.message ||
            err.message ||
            'Unable to process password reset request.';
      setStatusMessage({
        type: 'error',
        title: 'Request Failed',
        body: errMsg
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setErrors({});
    setStatusMessage(null);

    const newErrors = {};
    if (!token.trim()) {
      newErrors.token = 'Reset token is required';
    }
    if (!newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (newPassword.length < 12) {
      newErrors.newPassword = 'Password must be at least 12 characters long';
    }
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Confirm your new password';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await authService.resetPassword({
        token: token.trim(),
        newPassword
      });

      setStatusMessage({
        type: 'success',
        title: 'Password Reset Successful',
        body: response?.message || 'Your password has been securely reset. Redirecting to login...'
      });

      setTimeout(() => {
        if (props.onFormSwitch) {
          props.onFormSwitch('login', { email: email.trim() });
        }
      }, 1500);
    } catch (err) {
      const isNetworkError = Boolean(err.isNetworkOrCors || err.code === 'ERR_NETWORK' || !err.response);
      const errMsg =
        isNetworkError
          ? 'Network Error. Please check your internet connection.'
          : err.friendlyMessage ||
            err.response?.data?.message ||
            err.message ||
            'Failed to reset password. The link or token may be invalid or expired.';
      setStatusMessage({
        type: 'error',
        title: 'Reset Failed',
        body: errMsg
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocialLogin = (provider) => {
    console.log(`Social Login initiated: ${provider}`);
  };

  return (
    <div className="forgot-wrapper">
      {/* Top Logo */}
      <div
        className="top-logo"
        onClick={() => props.onFormSwitch && props.onFormSwitch('login')}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            props.onFormSwitch && props.onFormSwitch('login');
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="Go to Login"
      >
        <img src={topLogo} alt="Yappy Logo" className="logo-img" />
      </div>

      {/* Main Content Area */}
      <div className="content-container">
        {/* Centered White Card */}
        <div className="forgot-card">
          <div className="header-section">
            <h1>{mode === 'request' ? 'Forgot Password?' : 'Set New Password'}</h1>
            <p>
              {mode === 'request'
                ? 'Enter your email address to receive recovery instructions.'
                : 'Enter your reset token and choose a new secure password.'}
            </p>
          </div>

          {statusMessage && (
            <div className={`status-banner ${statusMessage.type}`} role="status">
              <div className="status-banner-title">
                {statusMessage.type === 'success' ? '✓ ' : '⚠️ '}
                {statusMessage.title}
              </div>
              <p className="status-banner-body">{statusMessage.body}</p>
            </div>
          )}

          {mode === 'request' ? (
            <form className="forgot-form" onSubmit={handleRequestSubmit} noValidate>
              <div className="input-group">
                <label htmlFor="forgot-email">Email Address</label>
                <div className="input-wrapper">
                  <input
                    id="forgot-email"
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                    }}
                    className={errors.email ? 'input-error' : ''}
                    required
                    autoComplete="email"
                    disabled={isSubmitting}
                  />
                </div>
                {errors.email && <span className="field-error">{errors.email}</span>}
              </div>

              <button type="submit" className="btn-primary" disabled={isSubmitting}>
                {isSubmitting ? "Sending..." : "Send Reset Link \u2192"}
              </button>

              <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', color: '#6434df', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700 }}
                  onClick={() => {
                    if (props.onFormSwitch) {
                      props.onFormSwitch('resetPassword');
                    } else {
                      setMode('reset');
                      setStatusMessage(null);
                      setErrors({});
                    }
                  }}
                >
                  Have a reset token? Enter it here &rarr;
                </button>
              </div>
            </form>
          ) : (
            <form className="forgot-form" onSubmit={handleResetSubmit} noValidate>
              <div className="input-group">
                <label htmlFor="reset-token">Reset Token</label>
                <div className="input-wrapper">
                  <input
                    id="reset-token"
                    type="text"
                    placeholder="Enter reset token from email"
                    value={token}
                    onChange={(e) => {
                      setToken(e.target.value);
                      if (errors.token) setErrors((prev) => ({ ...prev, token: '' }));
                    }}
                    className={errors.token ? 'input-error' : ''}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                {errors.token && <span className="field-error">{errors.token}</span>}
              </div>

              <div className="input-group">
                <label htmlFor="reset-new-password">New Password (min. 12 characters)</label>
                <div className="input-wrapper password-wrapper">
                  <input
                    id="reset-new-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter at least 12 characters"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (errors.newPassword) setErrors((prev) => ({ ...prev, newPassword: '' }));
                    }}
                    className={errors.newPassword ? 'input-error' : ''}
                    required
                    autoComplete="new-password"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>
                {errors.newPassword && <span className="field-error">{errors.newPassword}</span>}
              </div>

              <div className="input-group">
                <label htmlFor="reset-confirm-password">Confirm New Password</label>
                <div className="input-wrapper password-wrapper">
                  <input
                    id="reset-confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your new password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: '' }));
                    }}
                    className={errors.confirmPassword ? 'input-error' : ''}
                    required
                    autoComplete="new-password"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>
                {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
              </div>

              <button type="submit" className="btn-primary" disabled={isSubmitting}>
                {isSubmitting ? "Resetting Password..." : "Update Password \u2192"}
              </button>

              <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', color: '#555555', cursor: 'pointer', fontSize: '0.85rem' }}
                  onClick={() => {
                    setMode('request');
                    setStatusMessage(null);
                    setErrors({});
                  }}
                >
                  &larr; Back to request reset link
                </button>
              </div>
            </form>
          )}

          <div className="divider">
            <span>Or continue with</span>
          </div>

          {/* Social login buttons: Google and Apple */}
          <div className="social-login-group">
            <button
              type="button"
              className="btn-social"
              onClick={() => handleSocialLogin('Google')}
              aria-label="Continue with Google"
              title="Continue with Google"
            >
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z" />
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
              </svg>
            </button>
            <button
              type="button"
              className="btn-social"
              onClick={() => handleSocialLogin('Apple')}
              aria-label="Continue with Apple"
              title="Continue with Apple"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="#000000">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.84c.67-.82 1.13-1.96.99-3.12-1 .04-2.16.66-2.84 1.47-.6.7-1.13 1.83-.99 2.96 1.12.09 2.22-.55 2.84-1.31" />
              </svg>
            </button>
          </div>

          <p className="login-text">
            Remember your password?{' '}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                props.onFormSwitch && props.onFormSwitch('login');
              }}
            >
              Log in
            </a>
          </p>
        </div>
      </div>

      {/* Layered grey and white waves */}
      <div className="waves-container">
        <svg
          className="waves-svg"
          viewBox="0 0 1440 445"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <image href={vectorUpper} x="0" y="0" width="1440" height="225" />
          <image href={vectorLower} x="0" y="112" width="1440" height="270" />
          <image href={whiteWave} x="0" y="215" width="1440" height="230" />
        </svg>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
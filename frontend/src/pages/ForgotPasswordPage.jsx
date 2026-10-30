import { useState } from 'react';
import './ForgotPasswordPage.css';

import topLogo from "../assets/yappy-logo.png";
import vectorUpper from "../assets/Vector.png";
import vectorLower from "../assets/Vector (1).png";
import whiteWave from "../assets/White wave.png";

const ForgotPasswordPage = (props) => {
  const [email, setEmail] = useState('');
  const [statusMessage, setStatusMessage] = useState(null);
  const [fieldError, setFieldError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setFieldError('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setFieldError('Please enter your email address');
      return;
    }
    if (!emailRegex.test(email.trim())) {
      setFieldError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setStatusMessage({
        type: 'error',
        title: 'Network Error',
        body: 'Network Error'
      });
      setIsSubmitting(false);
      return;
    }

    // Provide immediate responsive feedback without inventing backend success
    setTimeout(() => {
      setStatusMessage({
        type: 'info',
        title: 'Backend Endpoint Pending',
        body: `A password reset endpoint has not yet been deployed to the backend API for ${email.trim()}. Please contact your community administrator or support at support@smartcommunity.org for account recovery assistance.`
      });
      setIsSubmitting(false);
    }, 350);
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
            <h1>Forgot Password?</h1>
            <p>Enter your email address to receive recovery instructions.</p>
          </div>

          {statusMessage && (
            <div className={`status-banner ${statusMessage.type}`} role="status">
              <div className="status-banner-title">⚠️ {statusMessage.title}</div>
              <p className="status-banner-body">{statusMessage.body}</p>
            </div>
          )}

          <form className="forgot-form" onSubmit={handleSubmit} noValidate>
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
                    if (fieldError) setFieldError('');
                  }}
                  className={fieldError ? 'input-error' : ''}
                  required
                  autoComplete="email"
                  disabled={isSubmitting}
                />
              </div>
              {fieldError && <span className="field-error">{fieldError}</span>}
            </div>

            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? "Checking..." : "Reset Password \u2192"}
            </button>
          </form>

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
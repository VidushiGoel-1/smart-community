import { useState } from 'react';
import './LoginPage.css';

import topLogo from "../assets/yappy-logo.png";
import vectorUpper from "../assets/Vector.png";
import vectorLower from "../assets/Vector (1).png";
import whiteWave from "../assets/White wave.png";
import authService from "../services/authService";

const LoginPage = (props) => {
  const [email, setEmail] = useState(props.initialEmail || '');
  const [prevInitialEmail, setPrevInitialEmail] = useState(props.initialEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  // Sync initialEmail if forwarded from signup or OTP verification
  if (props.initialEmail && props.initialEmail !== prevInitialEmail) {
    setPrevInitialEmail(props.initialEmail);
    setEmail(props.initialEmail);
  }

  const validate = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.trim()) {
      newErrors.email = "Please enter your email address";
    } else if (!emailRegex.test(email.trim())) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!password) {
      newErrors.password = "Please enter your password";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting || cooldownSeconds > 0) return;

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const data = await authService.login({
        email: email.trim(),
        password,
      });

      // Strict token validation - only navigate on valid response
      if (data?.accessToken) {
        if (props.onFormSwitch) {
          props.onFormSwitch('dashboard');
        }
      } else {
        setErrors({
          general: data?.message || "Login succeeded but no access token was returned by the server."
        });
      }
    } catch (err) {
      const message =
        err.friendlyMessage ||
        err.response?.data?.message ||
        err.message ||
        "Login failed. Please verify your credentials.";

      const isNetworkError = Boolean(err.isNetworkOrCors || err.code === 'ERR_NETWORK' || !err.response);
      const isUnverified =
        message.toLowerCase().includes('verify') ||
        message.toLowerCase().includes('otp');

      setErrors({
        general: isNetworkError ? 'Network Error' : message,
        isUnverified,
        isNetworkOrCors: isNetworkError,
      });

      // If connection or CORS failed, impose a 3-second cooldown to prevent request flooding
      if (err.isNetworkOrCors) {
        setCooldownSeconds(3);
        const timer = setInterval(() => {
          setCooldownSeconds((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocialLogin = (provider) => {
    console.log(`Social Login initiated: ${provider}`);
  };

  return (
    <div className="login-wrapper">
      {/* Top Logo */}
      <div
        className="top-logo"
        onClick={() => props.onFormSwitch && props.onFormSwitch('dashboard')}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            props.onFormSwitch && props.onFormSwitch('dashboard');
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="Go to Dashboard"
      >
        <img src={topLogo} alt="Yappy Logo" className="logo-img" />
      </div>

      {/* Centered White Login Card */}
      <div className="login-card">
        <div className="header-section">
          <h1>Welcome Back!</h1>
          <p>
            Log in to your Smart Community account and stay<br />
            connected.
          </p>
        </div>

        {errors.general && (
          <div className="form-error-banner" role="alert">
            <span>{errors.general}</span>
            {errors.isUnverified && (
              <button
                type="button"
                className="btn-verify-now"
                onClick={() => props.onFormSwitch('verifyOtp', { email: email.trim() })}
              >
                Verify with OTP &rarr;
              </button>
            )}
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div className="input-group">
            <label htmlFor="login-email">Email Address</label>
            <div className="input-wrapper">
              <input
                id="login-email"
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

          <div className="input-group">
            <label htmlFor="login-password">Password</label>
            <div className="input-wrapper password-wrapper">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
                }}
                className={errors.password ? 'input-error' : ''}
                required
                autoComplete="current-password"
                disabled={isSubmitting}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
              >
                {showPassword ? (
                  <svg className="eye-icon" viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="#777B85" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ) : (
                  <svg className="eye-icon" viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="#777B85" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && <span className="field-error">{errors.password}</span>}
          </div>

          <div className="form-options">
            <label className="remember-me-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isSubmitting}
              />
              <span>Remember me</span>
            </label>
            <a
              href="#"
              className="forgot-password"
              onClick={(e) => {
                e.preventDefault();
                props.onFormSwitch('forgotPassword');
              }}
            >
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={isSubmitting || cooldownSeconds > 0}
          >
            {isSubmitting
              ? "Logging in..."
              : cooldownSeconds > 0
              ? `Please wait (${cooldownSeconds}s)...`
              : "Log In \u2192"}
          </button>
        </form>

        <div className="divider">
          <span>Or continue with</span>
        </div>

        {/* Social login buttons: Google and Apple only */}
        <div className="social-login-group">
          <button
            type="button"
            className="btn-social"
            onClick={() => handleSocialLogin('Google')}
            title="Continue with Google"
            aria-label="Continue with Google"
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
            title="Continue with Apple"
            aria-label="Continue with Apple"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="#000000">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.84c.67-.82 1.13-1.96.99-3.12-1 .04-2.16.66-2.84 1.47-.6.7-1.13 1.83-.99 2.96 1.12.09 2.22-.55 2.84-1.31" />
            </svg>
          </button>
        </div>

        <p className="signup-text">
          Don’t have an account?{' '}
          <a href="#" onClick={(e) => { e.preventDefault(); props.onFormSwitch('signup'); }}>
            Sign Up
          </a>
        </p>
      </div>

      {/* Waves Section */}
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

export default LoginPage;
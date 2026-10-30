import { useState } from 'react';
import './ResetPasswordPage.css';

import topLogo from "../assets/yappy-logo.png";
import vectorUpper from "../assets/Vector.png";
import vectorLower from "../assets/Vector (1).png";
import whiteWave from "../assets/White wave.png";
import authService from "../services/authService";

/**
 * Extracts reset token from current window location (search query, pathname, or hash).
 */
function extractTokenFromLocation() {
  if (typeof window === 'undefined') return '';

  // 1. Check standard query params: ?token=..., ?resetToken=..., ?t=...
  if (window.location.search) {
    const params = new URLSearchParams(window.location.search);
    const queryToken = params.get('token') || params.get('resetToken') || params.get('t');
    if (queryToken) return queryToken.trim();
  }

  // 2. Check hash query params: #reset-password?token=... or #forgotPassword?token=...
  if (window.location.hash && window.location.hash.includes('?')) {
    const hashQuery = window.location.hash.substring(window.location.hash.indexOf('?') + 1);
    const hashParams = new URLSearchParams(hashQuery);
    const hashToken = hashParams.get('token') || hashParams.get('resetToken') || hashParams.get('t');
    if (hashToken) return hashToken.trim();
  }

  // 3. Check path parameter: /reset-password/:token or /resetPassword/:token
  const pathname = window.location.pathname || '';
  const match = pathname.match(/\/(?:reset-password|resetPassword)\/([^/?#]+)/i);
  if (match && match[1]) {
    return decodeURIComponent(match[1]).trim();
  }

  // 4. Check hash path parameter: #reset-password/:token
  if (window.location.hash) {
    const hashMatch = window.location.hash.match(/#(?:reset-password|resetPassword)\/([^/?#]+)/i);
    if (hashMatch && hashMatch[1]) {
      return decodeURIComponent(hashMatch[1]).trim();
    }
  }

  return '';
}

const ResetPasswordPage = (props) => {
  const urlToken = (props.token || extractTokenFromLocation()).trim();
  const [tokenInput, setTokenInput] = useState(urlToken);
  const isTokenFromUrl = Boolean(urlToken);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const token = tokenInput;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setErrors({});
    setStatusMessage(null);

    const newErrors = {};
    const trimmedToken = token.trim();

    if (!trimmedToken) {
      newErrors.token = 'Reset token is required. Please check your email link or enter the token.';
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
        token: trimmedToken,
        newPassword
      });

      setStatusMessage({
        type: 'success',
        title: 'Password Reset Successful',
        body: response?.message || 'Your password has been updated securely. Redirecting to login...'
      });

      setTimeout(() => {
        if (props.onFormSwitch) {
          props.onFormSwitch('login');
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
            'Password reset link is invalid or has expired.';

      setStatusMessage({
        type: 'error',
        title: 'Reset Failed',
        body: errMsg
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="reset-wrapper">
      {/* Brand logo */}
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
      <div className="reset-card">
        <div className="reset-header">
          <h1>Set New Password</h1>
          <p>Choose a secure password with at least 12 characters to protect your account.</p>
        </div>

        {/* Token status indicator */}
        {isTokenFromUrl ? (
          <div className="token-badge detected" role="status">
            <span>✓</span> Reset token loaded from email link
          </div>
        ) : (
          <div className="token-badge manual" role="status">
            <span>ℹ️</span> Please enter the reset token received in your email
          </div>
        )}

        {/* Alert status banner */}
        {statusMessage && (
          <div className={`status-banner ${statusMessage.type}`} role="alert">
            <div className="status-banner-title">
              {statusMessage.type === 'success' ? '✓ ' : '⚠️ '}
              {statusMessage.title}
            </div>
            <p className="status-banner-body">{statusMessage.body}</p>
          </div>
        )}

        <form className="reset-form" onSubmit={handleSubmit} noValidate>
          {/* Token input field — always editable if user needs to paste or fix it */}
          <div className="input-group">
            <label htmlFor="reset-token-input">Reset Token</label>
            <div className="input-wrapper">
              <input
                id="reset-token-input"
                type="text"
                placeholder="Enter reset token from email"
                value={token}
                onChange={(e) => {
                  setTokenInput(e.target.value);
                  if (errors.token) setErrors((prev) => ({ ...prev, token: '' }));
                }}
                className={errors.token ? 'input-error' : ''}
                required
                disabled={isSubmitting}
                autoComplete="off"
              />
            </div>
            {errors.token && <span className="field-error">{errors.token}</span>}
          </div>

          {/* New password input */}
          <div className="input-group">
            <label htmlFor="reset-new-password">New Password</label>
            <div className="input-wrapper password-wrapper">
              <input
                id="reset-new-password"
                type={showPassword ? "text" : "password"}
                placeholder="At least 12 characters"
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
            <span className="field-hint">Minimum 12 characters required by server policy</span>
            {errors.newPassword && <span className="field-error">{errors.newPassword}</span>}
          </div>

          {/* Confirm new password */}
          <div className="input-group">
            <label htmlFor="reset-confirm-password">Confirm New Password</label>
            <div className="input-wrapper password-wrapper">
              <input
                id="reset-confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Re-enter your new password"
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
            {isSubmitting ? "Resetting Password..." : "Update Password →"}
          </button>
        </form>

        {/* Secondary Navigation Links */}
        <div className="reset-links">
          <button
            type="button"
            className="reset-link-btn"
            onClick={() => props.onFormSwitch && props.onFormSwitch('forgotPassword')}
          >
            ← Request a new reset link
          </button>
          <button
            type="button"
            className="reset-link-btn secondary"
            onClick={() => props.onFormSwitch && props.onFormSwitch('login')}
          >
            Remember your password? Log in
          </button>
        </div>
      </div>

      {/* Decorative SVG bottom waves */}
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

export default ResetPasswordPage;

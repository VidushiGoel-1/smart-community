import { useState, useRef, useEffect } from 'react';
import './VerifyOtpPage.css';

import topLogo from "../assets/yappy-logo.png";
import vectorUpper from "../assets/Vector.png";
import vectorLower from "../assets/Vector (1).png";
import whiteWave from "../assets/White wave.png";
import authService from "../services/authService";

const VerifyOtpPage = ({ onFormSwitch, initialEmail, notice }) => {
  const [email, setEmail] = useState(initialEmail || '');
  const [prevInitialEmail, setPrevInitialEmail] = useState(initialEmail);
  const [isEditingEmail, setIsEditingEmail] = useState(!initialEmail);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState(notice || '');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(30);

  // Sync initialEmail if updated by parent router
  if (initialEmail && initialEmail !== prevInitialEmail) {
    setPrevInitialEmail(initialEmail);
    setEmail(initialEmail);
    setIsEditingEmail(false);
  }

  const inputRefs = useRef([]);

  // Resend cooldown timer countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Focus first input on mount or when switching away from email edit
  useEffect(() => {
    if (!isEditingEmail && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [isEditingEmail]);

  const handleOtpChange = (index, value) => {
    // Only accept numeric input
    const cleanVal = value.replace(/\D/g, '');
    if (!cleanVal && value !== '') return;

    const newDigits = [...otpDigits];
    newDigits[index] = cleanVal ? cleanVal.slice(-1) : '';
    setOtpDigits(newDigits);
    setError('');

    // Auto-advance to next input
    if (cleanVal && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      if (inputRefs.current[index - 1]) {
        inputRefs.current[index - 1].focus();
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleVerify();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim().replace(/\D/g, '').slice(0, 6);
    if (!pastedData) return;

    const newDigits = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pastedData[i] || '';
    }
    setOtpDigits(newDigits);
    setError('');

    // Focus last filled index or next empty
    const nextIndex = Math.min(pastedData.length, 5);
    if (inputRefs.current[nextIndex]) {
      inputRefs.current[nextIndex].focus();
    }
  };

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    if (isVerifying) return;
    const otp = otpDigits.join('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setError('Please provide a valid email address.');
      setIsEditingEmail(true);
      return;
    }

    if (otp.length < 6) {
      setError('Please enter all 6 digits of the OTP verification code.');
      return;
    }

    setError('');
    setIsVerifying(true);

    try {
      const res = await authService.verifyOtp({
        email: email.trim(),
        otp,
      });

      setSuccessMsg(res?.message || 'Email verified successfully! Redirecting to login...');
      setTimeout(() => {
        if (onFormSwitch) {
          onFormSwitch('login', { email: email.trim() });
        }
      }, 1200);
    } catch (err) {
      const isNetworkError = Boolean(err.isNetworkOrCors || err.code === 'ERR_NETWORK' || !err.response);
      const errMsg =
        isNetworkError
          ? 'Network Error'
          : err.friendlyMessage ||
            err.response?.data?.message ||
            err.message ||
            'Verification failed. The OTP may be incorrect or expired.';
      setError(errMsg);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || isResending) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setError('Please provide a valid email address to receive the verification OTP.');
      setIsEditingEmail(true);
      return;
    }

    setError('');
    setIsResending(true);

    try {
      const res = await authService.resendOtp({ email: email.trim() });
      setSuccessMsg(res?.message || 'A new OTP has been sent to your email.');
      setResendCooldown(45);
      setOtpDigits(['', '', '', '', '', '']);
      setIsEditingEmail(false);
      if (inputRefs.current[0]) inputRefs.current[0].focus();
    } catch (err) {
      const isNetworkError = Boolean(err.isNetworkOrCors || err.code === 'ERR_NETWORK' || !err.response);
      const errMsg =
        isNetworkError
          ? 'Network Error'
          : err.friendlyMessage ||
            err.response?.data?.message ||
            err.message ||
            'Failed to resend OTP. Please try again in a few moments.';
      setError(errMsg);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="verify-wrapper">
      {/* Top Logo */}
      <div
        className="top-logo"
        onClick={() => onFormSwitch && onFormSwitch('login')}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onFormSwitch && onFormSwitch('login');
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="Go to Login"
      >
        <img src={topLogo} alt="Yappy Logo" className="logo-img" />
      </div>

      {/* Centered White Verification Card */}
      <div className="verify-card">
        <div className="verify-header">
          <h1>Verification Email</h1>
          <p>
            We have sent you a verification code to{' '}
            <strong className="verify-target-email">{email || 'your email'}</strong>,
            please check both your inbox and spam folder.
          </p>
        </div>

        {error && (
          <div className="verify-alert error" role="alert">
            {error}
          </div>
        )}

        {successMsg && !error && (
          <div className="verify-alert success" role="status">
            {successMsg}
          </div>
        )}

        {isEditingEmail && (
          <div className="change-email-form">
            <label htmlFor="verify-email-input">Confirm or update your email address:</label>
            <div className="input-row">
              <input
                id="verify-email-input"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                disabled={isResending}
              />
              <button
                type="button"
                className="btn-save-email"
                onClick={handleResend}
                disabled={isResending}
              >
                {isResending ? 'Sending...' : 'Send OTP'}
              </button>
            </div>
          </div>
        )}

        {/* 6-digit OTP Input Boxes */}
        <div className="otp-boxes-group" onPaste={handlePaste}>
          {otpDigits.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => (inputRefs.current[idx] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleOtpChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              className={`otp-digit-input ${digit ? 'filled' : ''} ${error ? 'has-error' : ''}`}
              aria-label={`Digit ${idx + 1} of verification code`}
              disabled={isVerifying}
            />
          ))}
        </div>

        <div className="resend-section">
          {resendCooldown > 0 ? (
            <span className="resend-cooldown">
              Resend code in <strong>{resendCooldown}s</strong>
            </span>
          ) : (
            <button
              type="button"
              className="btn-resend-link"
              onClick={handleResend}
              disabled={isResending}
            >
              {isResending ? 'Sending new code...' : "Didn't receive email? Resend OTP"}
            </button>
          )}
        </div>

        {/* Action Buttons matching Verify.png */}
        <div className="verify-actions">
          <button
            type="button"
            className="btn-change-email"
            onClick={() => setIsEditingEmail((prev) => !prev)}
            disabled={isVerifying}
          >
            {isEditingEmail ? 'Close' : 'Change Email'}
          </button>

          <button
            type="button"
            className="btn-verify-okay"
            onClick={handleVerify}
            disabled={isVerifying || otpDigits.join('').length < 6}
          >
            {isVerifying ? 'Verifying...' : 'Okay'}
          </button>
        </div>

        <p className="back-login-text">
          Already verified?{' '}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (onFormSwitch) onFormSwitch('login', { email: email.trim() });
            }}
          >
            Back to Log in
          </a>
        </p>
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

export default VerifyOtpPage;

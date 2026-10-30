import { useState, useEffect } from 'react';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import Dashboard from './pages/Dashboard';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import VerifyOtpPage from './pages/VerifyOtpPage';

/**
 * Resolves the active route and token from the browser URL (pathname, search, and hash).
 * Ensures direct navigation and page refresh on Vercel routes work seamlessly.
 */
function resolveRouteFromUrl() {
  if (typeof window === 'undefined') {
    return { form: 'login', token: '' };
  }

  const rawPathname = window.location.pathname || '';
  const pathname = rawPathname.toLowerCase();
  const hashRaw = window.location.hash ? window.location.hash.replace(/^#\/?/, '') : '';
  const hash = hashRaw.toLowerCase();

  // Extract token from search query or hash query
  let token = '';
  if (window.location.search) {
    const params = new URLSearchParams(window.location.search);
    token = params.get('token') || params.get('resetToken') || params.get('t') || '';
  }
  if (!token && hashRaw.includes('?')) {
    const hashQuery = hashRaw.substring(hashRaw.indexOf('?') + 1);
    const hashParams = new URLSearchParams(hashQuery);
    token = hashParams.get('token') || hashParams.get('resetToken') || hashParams.get('t') || '';
  }

  // Check path parameter: /reset-password/:token or /resetPassword/:token
  const matchPathToken = rawPathname.match(/\/(?:reset-password|resetpassword)\/([^/?#]+)/i);
  if (matchPathToken && matchPathToken[1]) {
    token = decodeURIComponent(matchPathToken[1]).trim();
  }
  const matchHashToken = hashRaw.match(/(?:reset-password|resetpassword)\/([^/?#]+)/i);
  if (!token && matchHashToken && matchHashToken[1]) {
    token = decodeURIComponent(matchHashToken[1]).trim();
  }

  // 1. Reset Password route
  if (
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/resetpassword') ||
    hash.startsWith('reset-password') ||
    hash.startsWith('resetpassword')
  ) {
    return { form: 'resetPassword', token };
  }

  // 2. Forgot Password route (redirect to resetPassword if a token is present)
  if (
    pathname === '/forgot-password' ||
    pathname === '/forgotpassword' ||
    hash.startsWith('forgotpassword') ||
    hash.startsWith('forgot-password')
  ) {
    if (token) {
      return { form: 'resetPassword', token };
    }
    return { form: 'forgotPassword', token: '' };
  }

  // 3. Verify OTP route
  if (
    pathname === '/verify-otp' ||
    pathname === '/verifyotp' ||
    hash.startsWith('verifyotp') ||
    hash.startsWith('verify-otp')
  ) {
    return { form: 'verifyOtp', token: '' };
  }

  // 4. Signup route
  if (
    pathname === '/signup' ||
    pathname === '/register' ||
    hash.startsWith('signup') ||
    hash.startsWith('register')
  ) {
    return { form: 'signup', token: '' };
  }

  // 5. Dashboard route
  if (
    pathname === '/dashboard' ||
    hash.startsWith('dashboard')
  ) {
    return { form: 'dashboard', token: '' };
  }

  // 6. Default to login
  return { form: 'login', token: '' };
}

function App() {
  const initialRoute = resolveRouteFromUrl();
  const [currentForm, setCurrentForm] = useState(initialRoute.form);
  const [resetToken, setResetToken] = useState(initialRoute.token);

  const [authData, setAuthData] = useState({
    email: '',
    notice: '',
  });

  useEffect(() => {
    const handleUrlChange = () => {
      const resolved = resolveRouteFromUrl();
      setCurrentForm(resolved.form);
      if (resolved.token) {
        setResetToken(resolved.token);
      }
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);

    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  const toggleForm = (formName, params = {}) => {
    let normalized = formName;
    if (formName === 'reset-password') normalized = 'resetPassword';
    if (formName === 'forgot-password') normalized = 'forgotPassword';
    if (formName === 'verify-otp') normalized = 'verifyOtp';

    setCurrentForm(normalized);

    if (params && Object.keys(params).length > 0) {
      setAuthData((prev) => ({ ...prev, ...params }));
      if (params.token) {
        setResetToken(params.token);
      }
    }

    if (typeof window !== 'undefined') {
      window.location.hash = normalized;
    }
  };

  return (
    <>
      {currentForm === 'login' && (
        <LoginPage onFormSwitch={toggleForm} initialEmail={authData.email} />
      )}
      {currentForm === 'signup' && (
        <SignupPage onFormSwitch={toggleForm} />
      )}
      {currentForm === 'verifyOtp' && (
        <VerifyOtpPage
          onFormSwitch={toggleForm}
          initialEmail={authData.email}
          notice={authData.notice}
        />
      )}
      {currentForm === 'forgotPassword' && (
        <ForgotPasswordPage onFormSwitch={toggleForm} />
      )}
      {currentForm === 'resetPassword' && (
        <ResetPasswordPage
          onFormSwitch={toggleForm}
          token={resetToken}
        />
      )}
      {currentForm === 'dashboard' && (
        <Dashboard onFormSwitch={toggleForm} />
      )}
    </>
  );
}

export default App;
import { useState, useEffect } from 'react';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import Dashboard from './pages/Dashboard';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import VerifyOtpPage from './pages/VerifyOtpPage';

function App() {
  const [currentForm, setCurrentForm] = useState(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash.replace('#', '');
      if (['login', 'signup', 'dashboard', 'forgotPassword', 'verifyOtp'].includes(hash)) {
        return hash;
      }
    }
    return "login";
  });

  const [authData, setAuthData] = useState({
    email: '',
    notice: '',
  });

  useEffect(() => {
    const handleHashChange = () => {
      if (typeof window !== 'undefined') {
        const hash = window.location.hash.replace('#', '');
        if (['login', 'signup', 'dashboard', 'forgotPassword', 'verifyOtp'].includes(hash)) {
          setCurrentForm(hash);
        }
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const toggleForm = (formName, params = {}) => {
    setCurrentForm(formName);
    if (params && Object.keys(params).length > 0) {
      setAuthData((prev) => ({ ...prev, ...params }));
    }
    if (typeof window !== 'undefined') {
      window.location.hash = formName;
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
      {currentForm === 'dashboard' && (
        <Dashboard onFormSwitch={toggleForm} />
      )}
    </>
  );
}

export default App;
import { useState } from 'react';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import Dashboard from './pages/Dashboard';
import ForgotPasswordPage from './pages/ForgotPasswordPage';

function App() {
  const [currentForm, setCurrentForm] = useState(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash.replace('#', '');
      if (['login', 'signup', 'dashboard', 'forgotPassword'].includes(hash)) {
        return hash;
      }
    }
    return "login";
  });

  const toggleForm = (formName) => {
    setCurrentForm(formName);
    if (typeof window !== 'undefined') {
      window.location.hash = formName;
    }
  };

  return (
    <>
      {currentForm === 'login' && <LoginPage onFormSwitch={toggleForm} />}
      {currentForm === 'signup' && <SignupPage onFormSwitch={toggleForm} />}
      {currentForm === 'dashboard' && <Dashboard onFormSwitch={toggleForm} />}
      {currentForm === 'forgotPassword' && <ForgotPasswordPage onFormSwitch={toggleForm} />}
      <button
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 1000,
          padding: '10px 15px',
          backgroundColor: '#B794F6',
          color: '#101010',
          fontWeight: 600,
          border: '1px solid #FAF8F3',
          borderRadius: '8px',
          cursor: 'pointer',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}
        onClick={() => toggleForm(currentForm === "dashboard" ? "login" : "dashboard")}>
        Go to {currentForm === "dashboard" ? 'Login' : 'Dashboard'}
      </button>
    </>
  );
}

export default App;
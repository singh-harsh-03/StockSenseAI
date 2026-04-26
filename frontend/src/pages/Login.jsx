import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import './Login.css';

function formatApiError(err) {
  const d = err.response?.data?.detail;
  if (typeof d === 'string') return d;
  if (Array.isArray(d)) {
    return d.map((x) => x.msg || JSON.stringify(x)).join('; ');
  }
  return err.message || 'Authentication failed';
}

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, loading: authLoading, signInWithCredentials, signUpWithCredentials } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    if (isAuthenticated) {
      const dest = location.state?.from?.pathname || '/';
      navigate(dest, { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate, location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isSignUp) {
        await signUpWithCredentials(email, password, name);
      } else {
        await signInWithCredentials(email, password);
      }
      const dest = location.state?.from?.pathname || '/';
      navigate(dest, { replace: true });
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <span className="login-logo">📈</span>
          <h1>StockSense AI</h1>
          <p>AI-powered stock research for Indian markets</p>
        </div>
      
        <form onSubmit={handleSubmit} className="login-form">
          {isSignUp && (
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="login-input"
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="login-input"
            required
          />
          <input
            type="password"
            placeholder={isSignUp ? 'Password (at least 8 characters)' : 'Password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="login-input"
            required
            minLength={isSignUp ? 8 : undefined}
          />
          {error && <p className="login-error">{error}</p>}
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Please wait…' : isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>
        <p className="login-toggle">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="login-toggle-btn">
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
        <p className="login-footer-link">
          <Link to="/stock">Browse stocks without signing in</Link>
        </p>
      </div>
    </div>
  );
}

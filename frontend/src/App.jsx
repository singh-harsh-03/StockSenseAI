import { BrowserRouter, Routes, Route, NavLink, Navigate, useParams, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import StockDetail from './pages/StockDetail';
import Backtester from './pages/Backtester';
import Portfolio from './pages/Portfolio';
import Login from './pages/Login';
import { useAuth } from './contexts/AuthContext.jsx';
import './index.css';

/** Old links used /stock/TICKER; redirect so /stock stays search-only (no accidental fetch for partial names). */
function RedirectLegacyStockPath() {
  const { ticker } = useParams();
  return <Navigate to={`/s/${encodeURIComponent(ticker)}`} replace />;
}

function ProtectedRoute({ children }) {
  const { loading, isAuthenticated } = useAuth();
  const location = useLocation();
  if (loading) {
    return <p className="auth-gate-loading">Loading…</p>;
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
}

function Navbar() {
  const { user, isAuthenticated, signOut } = useAuth();

  return (
    <nav className="navbar">
      <NavLink to="/" className="nav-brand">📈 StockSense AI</NavLink>
      <div className="nav-links">
        <NavLink to="/" end>Dashboard</NavLink>
        <NavLink to="/stock" end>Stock Search</NavLink>
        <NavLink to="/backtest">Backtester</NavLink>
        <NavLink to="/portfolio">Portfolio</NavLink>
      </div>
      <div className="nav-auth">
        {isAuthenticated ? (
          <>
            <span className="nav-auth-email" title={user?.email || ''}>
              {user?.email || 'Signed in'}
            </span>
            <button type="button" className="nav-auth-btn" onClick={signOut}>
              Sign out
            </button>
          </>
        ) : (
          <NavLink to="/login" className="nav-auth-link">Sign in</NavLink>
        )}
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <main>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/stock" element={<StockDetail />} />
          <Route path="/stock/:ticker" element={<RedirectLegacyStockPath />} />
          <Route path="/s/:ticker" element={<StockDetail />} />
          <Route path="/backtest" element={<Backtester />} />
          <Route
            path="/"
            element={(
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/portfolio"
            element={(
              <ProtectedRoute>
                <Portfolio />
              </ProtectedRoute>
            )}
          />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

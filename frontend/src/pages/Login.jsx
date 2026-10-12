import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import { useAuth } from '../context/AuthContext.jsx';
import { LogoMark } from '../components/common/icons.jsx';

/**
 * Login form (controlled component).
 * After a successful login we return to location.state.from (ProtectedRoute
 * stores the page the user originally tried to visit).
 */
export default function Login() {
  useDocumentTitle('Log in');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const update = (field) => (event) => setForm((f) => ({ ...f, [field]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (busy) return;

    setError(null);
    if (!form.email.trim() || !form.password) {
      setError('Please fill in both fields.');
      return;
    }

    setBusy(true);
    try {
      await login(form.email.trim(), form.password);
      navigate(location.state?.from || '/', { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-card__brand">
          <LogoMark size={40} />
          <span>Sonora</span>
        </Link>

        <h1>Welcome back</h1>
        <p className="muted">Log in to keep your playlists, likes and history in sync.</p>

        {error && (
          <div className="alert alert--error" role="alert">
            {error}
          </div>
        )}

        <form className="form" onSubmit={handleSubmit} noValidate>
          <label className="field">
            <span>Email</span>
            <input
              className="input"
              type="email"
              value={form.email}
              onChange={update('email')}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              className="input"
              type="password"
              value={form.password}
              onChange={update('password')}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </label>

          <button type="submit" className="btn btn--primary btn--block" disabled={busy}>
            {busy ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        <p className="auth-card__switch">
          New here? <Link to="/register">Create an account</Link>
        </p>
      </div>
    </div>
  );
}

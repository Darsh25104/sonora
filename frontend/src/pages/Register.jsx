import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import { useAuth } from '../context/AuthContext.jsx';
import { LogoMark } from '../components/common/icons.jsx';

/** Registration form with client-side validation before hitting the API. */
export default function Register() {
  useDocumentTitle('Create account');
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const update = (field) => (event) => setForm((f) => ({ ...f, [field]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (busy) return;
    setError(null);

    if (form.name.trim().length < 2) return setError('Name must be at least 2 characters.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return setError('Please enter a valid email address.');
    if (form.password.length < 6) return setError('Password must be at least 6 characters.');
    if (form.password !== form.confirm) return setError('Passwords do not match.');

    setBusy(true);
    try {
      await register({ name: form.name.trim(), email: form.email.trim(), password: form.password });
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
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

        <h1>Create your account</h1>
        <p className="muted">Free forever — your music, your playlists, your way.</p>

        {error && (
          <div className="alert alert--error" role="alert">
            {error}
          </div>
        )}

        <form className="form" onSubmit={handleSubmit} noValidate>
          <label className="field">
            <span>Name</span>
            <input
              className="input"
              value={form.name}
              onChange={update('name')}
              placeholder="Ada Lovelace"
              autoComplete="name"
              required
            />
          </label>

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
              placeholder="At least 6 characters"
              autoComplete="new-password"
              required
            />
          </label>

          <label className="field">
            <span>Confirm password</span>
            <input
              className="input"
              type="password"
              value={form.confirm}
              onChange={update('confirm')}
              placeholder="Repeat your password"
              autoComplete="new-password"
              required
            />
          </label>

          <button type="submit" className="btn btn--primary btn--block" disabled={busy}>
            {busy ? 'Creating account...' : 'Sign up'}
          </button>
        </form>

        <p className="auth-card__switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}

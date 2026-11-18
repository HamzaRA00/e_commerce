import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { userAuthApi } from '../api/endpoints.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { Alert, Field } from '../components/ui.jsx';
import {
  ArrowRightIcon,
  CheckIcon,
  LockIcon,
  ShieldIcon,
  ShoppingBagIcon,
  UserIcon,
} from '../components/icons.jsx';
import { getErrorMessage, pickData } from '../utils/helpers.js';

export default function LoginPage() {
  const { setAuth, device } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [form, setForm] = useState({ email: '', password: '', remember_me: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  async function onSubmit(e) {
    e.preventDefault();
    setError(''); setInfo(''); setLoading(true);
    try {
      const res = await userAuthApi.login(form);
      const { message, data } = pickData(res);
      const payload = data?.data || data || {};
      setAuth({
        role: 'user',
        accessToken: payload.access_token,
        refreshToken: payload.refresh_token,
        device: payload.device || device,
        email: form.email,
        verified: true,
        userId: payload.user_id ?? payload.userId ?? null,
      });
      setInfo(message || 'Logged in.');
      nav(loc.state?.from?.pathname || '/orders', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally { setLoading(false); }
  }

  return (
    <div className="auth-grid">
      <section className="auth-aside">
        <span className="eyebrow"><UserIcon size={14} /> Customer access</span>
        <h1>Pick up where you left off.</h1>
        <p className="auth-lead">
          Sign in to place orders, follow their status, and manage the devices connected
          to your account.
        </p>
        <ul className="feature-list">
          <li><CheckIcon size={15} /> Browse categories and product detail</li>
          <li><CheckIcon size={15} /> Create orders with live stock checks</li>
          <li><CheckIcon size={15} /> Watch status changes arrive in realtime</li>
        </ul>
        <div className="aside-note">
          <LockIcon size={16} />
          <span>Access tokens stay bound to the current device session.</span>
        </div>
      </section>

      <section className="card auth-card">
        <div className="auth-head">
          <span className="icon-tile"><UserIcon size={20} /></span>
          <div>
            <span className="eyebrow">Customer</span>
            <h2>Sign in</h2>
            <p className="muted small">Use a seeded customer account.</p>
          </div>
        </div>

        <Alert kind="error">{error}</Alert>
        <Alert kind="success">{info}</Alert>

        <form className="auth-form" onSubmit={onSubmit}>
          <Field label="Email" htmlFor="email">
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            />
          </Field>
          <Field label="Password" htmlFor="password">
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            />
          </Field>
          <label className="check-row">
            <input
              type="checkbox"
              checked={form.remember_me}
              onChange={e => setForm(f => ({ ...f, remember_me: e.target.checked }))}
            />
            <span>Remember this device</span>
          </label>
          <button className="btn btn-block" disabled={loading} type="submit">
            {loading ? 'Signing in...' : 'Sign in'}
            {!loading && <ArrowRightIcon size={17} />}
          </button>
        </form>

        <div className="auth-switch">
          New here? <Link to="/register">Create an account</Link>
        </div>
        <a
          className="text-link text-link-muted"
          href={import.meta.env.VITE_ADMIN_URL || 'http://localhost:5174'}
          target="_blank"
          rel="noreferrer"
        >
          <ShieldIcon size={15} /> Admin app
        </a>
        <Link className="text-link text-link-muted" to="/catalog">
          <ShoppingBagIcon size={15} /> Browse without signing in
        </Link>
      </section>
    </div>
  );
}

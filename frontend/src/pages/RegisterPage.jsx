import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { userAuthApi } from '../api/endpoints.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { Alert, Field } from '../components/ui.jsx';
import {
  ArrowRightIcon,
  CheckIcon,
  ShoppingBagIcon,
  UserIcon,
  ZapIcon,
} from '../components/icons.jsx';
import { getErrorMessage, pickData } from '../utils/helpers.js';

export default function RegisterPage() {
  const { setAuth, device } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', password_confirmation: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  async function onSubmit(e) {
    e.preventDefault();
    setError(''); setInfo(''); setLoading(true);
    try {
      const res = await userAuthApi.register(form);
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
      setInfo(message || 'Registered successfully.');
      nav('/catalog', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally { setLoading(false); }
  }

  return (
    <div className="auth-grid">
      <section className="auth-aside">
        <span className="eyebrow"><ZapIcon size={14} /> Instant access</span>
        <h1>Create an account and start testing immediately.</h1>
        <p className="auth-lead">
          New customer accounts are activated on registration. No verification email is
          required before your first order.
        </p>
        <ul className="feature-list">
          <li><CheckIcon size={15} /> One-step registration with an active session</li>
          <li><CheckIcon size={15} /> Catalog and order flows unlocked right away</li>
          <li><CheckIcon size={15} /> Live order updates in the customer app</li>
        </ul>
        <div className="aside-note">
          <ShoppingBagIcon size={16} />
          <span>Password must include upper, lower, number, and symbol.</span>
        </div>
      </section>

      <section className="card auth-card">
        <div className="auth-head">
          <span className="icon-tile"><UserIcon size={20} /></span>
          <div>
            <span className="eyebrow">Customer</span>
            <h2>Create account</h2>
            <p className="muted small">Activated immediately after registration.</p>
          </div>
        </div>

        <Alert kind="error">{error}</Alert>
        <Alert kind="success">{info}</Alert>

        <form className="auth-form" onSubmit={onSubmit}>
          <Field label="Name" htmlFor="name">
            <input
              id="name"
              autoComplete="name"
              required
              minLength={2}
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            />
          </Field>
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
          <Field label="Password" htmlFor="password" help="Min 8 characters with upper, lower, number, and symbol.">
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            />
          </Field>
          <Field label="Confirm password" htmlFor="password_confirmation">
            <input
              id="password_confirmation"
              type="password"
              autoComplete="new-password"
              required
              value={form.password_confirmation}
              onChange={e => setForm(f => ({ ...f, password_confirmation: e.target.value }))}
            />
          </Field>
          <button className="btn btn-block" disabled={loading} type="submit">
            {loading ? 'Creating account...' : 'Create account'}
            {!loading && <ArrowRightIcon size={17} />}
          </button>
        </form>

        <div className="auth-switch">
          Already registered? <Link to="/login">Sign in</Link>
        </div>
      </section>
    </div>
  );
}

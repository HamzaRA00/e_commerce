import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAuthApi } from '../api/endpoints.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { Alert, Field } from '../components/ui.jsx';
import {
  ArrowRightIcon,
  CheckIcon,
  LockIcon,
  ShieldIcon,
  StoreIcon,
} from '../components/icons.jsx';
import { getErrorMessage, pickData } from '../utils/helpers.js';

export default function AdminLoginPage() {
  const { setAuth, device } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', remember_me: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await adminAuthApi.login(form);
      const { data } = pickData(res);
      const payload = data?.data || data || {};
      setAuth({
        role: 'admin',
        accessToken: payload.access_token,
        refreshToken: payload.refresh_token,
        device: payload.device || device,
        email: form.email,
        verified: true,
        userId: payload.user_id ?? payload.userId ?? null,
      });
      nav('/dashboard', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally { setLoading(false); }
  }

  return (
    <div className="auth-grid auth-grid-admin">
      <section className="auth-aside auth-aside-admin">
        <span className="eyebrow"><ShieldIcon size={14} /> Admin access</span>
        <h1>Run the catalog and fulfillment queue.</h1>
        <p className="auth-lead">
          Sign in with an admin account to manage categories, products, images, and
          order statuses from a single workspace.
        </p>
        <ul className="feature-list">
          <li><CheckIcon size={15} /> Manage bilingual category data</li>
          <li><CheckIcon size={15} /> Create products and upload images</li>
          <li><CheckIcon size={15} /> Follow the live admin order queue</li>
        </ul>
        <div className="aside-note">
          <LockIcon size={16} />
          <span>Use the seeded admin credentials from your backend environment.</span>
        </div>
      </section>

      <section className="card auth-card">
        <div className="auth-head">
          <span className="icon-tile icon-tile-blue"><ShieldIcon size={20} /></span>
          <div>
            <span className="eyebrow">Administrator</span>
            <h2>Admin sign in</h2>
            <p className="muted small">Access the operations workspace.</p>
          </div>
        </div>

        <Alert kind="error">{error}</Alert>

        <form className="auth-form" onSubmit={onSubmit}>
          <Field label="Email" htmlFor="admin-email">
            <input
              id="admin-email"
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            />
          </Field>
          <Field label="Password" htmlFor="admin-password">
            <input
              id="admin-password"
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
            {loading ? 'Signing in...' : 'Sign in as admin'}
            {!loading && <ArrowRightIcon size={17} />}
          </button>
        </form>

        <div className="auth-switch">
          Customer-facing app runs separately at{' '}
          <a href={import.meta.env.VITE_STOREFRONT_URL || 'http://localhost:5173'}>localhost:5173</a>.
        </div>
        <a
          className="text-link text-link-muted"
          href={import.meta.env.VITE_STOREFRONT_URL || 'http://localhost:5173'}
        >
          <StoreIcon size={15} /> Return to the storefront
        </a>
      </section>
    </div>
  );
}

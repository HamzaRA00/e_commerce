import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { userAuthApi } from '../api/endpoints.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { Alert, Field } from '../components/ui.jsx';
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
      });
      setInfo(message || 'Logged in.');
      nav(loc.state?.from?.pathname || '/orders', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally { setLoading(false); }
  }

  return (
    <div className="grid grid-2">
      <section className="card">
        <h1>User Login</h1>
        <p className="muted">Login with a customer account (e.g. seeded user) to access orders.</p>
        <Alert kind="error">{error}</Alert>
        <Alert kind="success">{info}</Alert>
        <form onSubmit={onSubmit}>
          <Field label="Email" htmlFor="email"><input id="email" type="email" required value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} /></Field>
          <Field label="Password" htmlFor="password"><input id="password" type="password" required value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} /></Field>
          <div className="field inline"><label><input type="checkbox" checked={form.remember_me} onChange={e=>setForm(f=>({...f,remember_me:e.target.checked}))} /> Remember me</label></div>
          <div className="btn-row"><button className="btn" disabled={loading} type="submit">{loading?'Logging in...':'Login'}</button></div>
        </form>
      </section>
      <section className="card">
        <h3>Need an account?</h3>
        <p>Register a new user; the account is activated immediately (no email verification).</p>
        <div className="btn-row"><Link className="btn secondary" to="/register">Go to Register</Link><Link className="btn ghost" to="/admin/login">Admin Login</Link></div>
      </section>
    </div>
  );
}

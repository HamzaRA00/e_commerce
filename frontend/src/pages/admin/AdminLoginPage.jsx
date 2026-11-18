import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAuthApi } from '../../api/endpoints.js';
import { useAuth } from '../../auth/AuthContext.jsx';
import { Alert, Field } from '../../components/ui.jsx';
import { getErrorMessage, pickData } from '../../utils/helpers.js';

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
      });
      nav('/admin/dashboard', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally { setLoading(false); }
  }

  return (
    <div className="grid grid-2">
      <section className="card">
        <h1>Admin Login</h1>
        <p className="muted">Login with an admin account to manage categories, products, and orders.</p>
        <Alert kind="error">{error}</Alert>
        <form onSubmit={onSubmit}>
          <Field label="Email" htmlFor="admin-email"><input id="admin-email" type="email" required value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} /></Field>
          <Field label="Password" htmlFor="admin-password"><input id="admin-password" type="password" required value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} /></Field>
          <div className="field inline"><label><input type="checkbox" checked={form.remember_me} onChange={e=>setForm(f=>({...f,remember_me:e.target.checked}))} /> Remember me</label></div>
          <div className="btn-row"><button className="btn" disabled={loading} type="submit">{loading?'Logging in...':'Login as Admin'}</button></div>
        </form>
      </section>
      <section className="card">
        <h3>Admin areas</h3>
        <ul className="list">
          <li>Categories: list/create/update/delete</li>
          <li>Products: list per category, create/update/delete, images</li>
          <li>Orders: list/show, view statuses, update status</li>
        </ul>
        <p className="small muted">Use seeded admin credentials from your backend environment.</p>
      </section>
    </div>
  );
}

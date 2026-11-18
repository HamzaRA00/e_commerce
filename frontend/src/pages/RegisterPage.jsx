import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { userAuthApi } from '../api/endpoints.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { Alert, Field } from '../components/ui.jsx';
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
      });
      setInfo(message || 'Registered successfully.');
      nav('/catalog', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally { setLoading(false); }
  }

  return (
    <div className="grid grid-2">
      <section className="card">
        <h1>User Registration</h1>
        <Alert kind="error">{error}</Alert>
        <Alert kind="success">{info}</Alert>
        <form onSubmit={onSubmit}>
          <Field label="Name" htmlFor="name"><input id="name" required minLength={2} value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} /></Field>
          <Field label="Email" htmlFor="email"><input id="email" type="email" required value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} /></Field>
          <Field label="Password" htmlFor="password" help="Min 8 chars, upper/lower/number/symbol as per API."><input id="password" type="password" required value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} /></Field>
          <Field label="Confirm Password" htmlFor="password_confirmation"><input id="password_confirmation" type="password" required value={form.password_confirmation} onChange={e=>setForm(f=>({...f,password_confirmation:e.target.value}))} /></Field>
          <div className="btn-row"><button className="btn" disabled={loading} type="submit">{loading?'Registering...':'Register'}</button></div>
        </form>
      </section>
      <section className="card">
        <h3>Already registered?</h3>
        <div className="btn-row"><Link className="btn secondary" to="/login">Go to Login</Link></div>
        <p className="small muted" style={{marginTop:12}}>Your account is activated immediately after registration. No email verification is required.</p>
      </section>
    </div>
  );
}

import { useState } from 'react';
import { userAuthApi } from '../api/endpoints.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { Alert, Field } from '../components/ui.jsx';
import { getErrorMessage, pickData } from '../utils/helpers.js';

export default function VerifyEmailPage() {
  const { auth, setAuth } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  async function submit(e) {
    e.preventDefault();
    setError(''); setInfo(''); setLoading(true);
    try {
      const res = await userAuthApi.verifyEmail(code);
      const { message } = pickData(res);
      setInfo(message || 'Email verified.');
      if (auth) setAuth({ ...auth, verified: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally { setLoading(false); }
  }

  async function resend() {
    setError(''); setInfo(''); setResending(true);
    try {
      const res = await userAuthApi.resendVerification();
      const { message } = pickData(res);
      setInfo(message || 'Verification code resent.');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally { setResending(false); }
  }

  return (
    <div className="grid grid-2">
      <section className="card">
        <h1>Verify Email</h1>
        <p className="muted">Submit the 6-digit code sent to your email. You must be logged in as a not-yet-verified user (device header required).</p>
        <Alert kind="error">{error}</Alert>
        <Alert kind="success">{info}</Alert>
        <form onSubmit={submit}>
          <Field label="Verification code" htmlFor="code"><input id="code" required minLength={6} maxLength={6} value={code} onChange={e=>setCode(e.target.value)} /></Field>
          <div className="btn-row">
            <button className="btn" type="submit" disabled={loading}>{loading?'Verifying...':'Verify'}</button>
            <button className="btn secondary" type="button" onClick={resend} disabled={resending}>{resending?'Resending...':'Resend code'}</button>
          </div>
        </form>
      </section>
      <section className="card">
        <h3>Session</h3>
        <div className="kv">
          <div className="muted">Role</div><div>{auth?.role || '-'}</div>
          <div className="muted">Email</div><div>{auth?.email || '-'}</div>
          <div className="muted">Device</div><div className="mono small">{auth?.device || '-'}</div>
          <div className="muted">Verified flag</div><div>{String(auth?.verified)}</div>
        </div>
        <p className="small muted" style={{marginTop:12}}>If this fails with "unauthenticated/device" errors, login/register again to refresh device-bound tokens.</p>
      </section>
    </div>
  );
}

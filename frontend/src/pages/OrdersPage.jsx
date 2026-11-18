import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { userOrdersApi } from '../api/endpoints.js';
import { Alert, Badge, Field, Spinner } from '../components/ui.jsx';
import { formatDate, getErrorMessage, normalizeList, pickData } from '../utils/helpers.js';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState('');
  const [createErr, setCreateErr] = useState('');
  const [productIdsInput, setProductIdsInput] = useState('1');

  async function load() {
    setLoading(true); setError('');
    try {
      const res = await userOrdersApi.list();
      const { data } = pickData(res);
      const { items, meta: m } = normalizeList(data, ['orders']);
      setOrders(items);
      setMeta(m);
    } catch (e) { setError(getErrorMessage(e)); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function createOrder(e) {
    e.preventDefault();
    setCreateErr(''); setCreateMsg(''); setCreating(true);
    try {
      const ids = productIdsInput.split(',').map(s => s.trim()).filter(Boolean).map(Number).filter(n => !Number.isNaN(n));
      if (!ids.length) throw new Error('Enter at least one product ID');
      const res = await userOrdersApi.create(ids);
      const { message } = pickData(res);
      setCreateMsg(message || 'Order created.');
      setProductIdsInput('');
      await load();
    } catch (e) { setCreateErr(getErrorMessage(e)); }
    finally { setCreating(false); }
  }

  return (
    <div className="grid" style={{ gap: 16 }}>
      <section className="card">
        <div className="page-header">
          <div>
            <h1>My Orders</h1>
            <p className="muted">View your orders and create a new one (requires verified user session per API).</p>
          </div>
          <button className="btn secondary" onClick={load} disabled={loading}>Refresh</button>
        </div>
        {loading && <Spinner />}
        <Alert kind="error">{error}</Alert>
        {!loading && (
          <div className="table-wrap">
            <table>
              <thead><tr><th>ID</th><th>Status</th><th>Items</th><th>Created</th><th>Action</th></tr></thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id}>
                    <td>{o.id}</td>
                    <td><Badge kind={o.status === 'delivered' ? 'ok' : o.status === 'cancelled' ? 'bad' : 'warn'}>{o.status_label || o.status || '-'}</Badge></td>
                    <td>{Array.isArray(o.items) ? o.items.length : '-'}</td>
                    <td>{formatDate(o.created_at)}</td>
                    <td><Link className="btn ghost" to={`/orders/${o.id}`}>View</Link></td>
                  </tr>
                ))}
                {!orders.length && <tr><td colSpan="5" className="muted">No orders found.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
        {meta && <p className="small muted" style={{marginTop:10}}>Page {meta.current_page} / {meta.last_page} (total {meta.total})</p>}
      </section>

      <section className="card">
        <h2>Create Order</h2>
        <p className="muted">Enter comma-separated product IDs. The API reserves stock via the warehouse service; you may get 409/503 on conflicts/unavailability.</p>
        <Alert kind="error">{createErr}</Alert>
        <Alert kind="success">{createMsg}</Alert>
        <form onSubmit={createOrder}>
          <Field label="Product IDs" htmlFor="pids" help="Example: 1,2,3 (sent as product_ids[i] form fields)">
            <input id="pids" value={productIdsInput} onChange={e=>setProductIdsInput(e.target.value)} placeholder="1,2" />
          </Field>
          <div className="btn-row"><button className="btn" type="submit" disabled={creating}>{creating?'Creating...':'Create order'}</button></div>
        </form>
      </section>
    </div>
  );
}

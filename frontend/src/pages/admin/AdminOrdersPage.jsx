import { useEffect, useRef, useState } from 'react';
import { adminOrdersApi } from '../../api/endpoints.js';
import { useAuth } from '../../auth/AuthContext.jsx';
import { Alert, Badge, Spinner } from '../../components/ui.jsx';
import { usePrivateChannel, useRealtimeConnection } from '../../realtime/usePrivateChannel.js';
import { formatDate, getErrorMessage, normalizeList, pickData } from '../../utils/helpers.js';

export default function AdminOrdersPage() {
  const { isAdmin } = useAuth();
  const liveState = useRealtimeConnection();
  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState(null);
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionMsg, setActionMsg] = useState('');
  const [liveNotice, setLiveNotice] = useState('');
  const [perPage, setPerPage] = useState(20);

  const loadRef = useRef(null);
  const viewRef = useRef(null);
  const perPageRef = useRef(perPage);
  const selectedRef = useRef(selected);
  const reloadTimer = useRef(null);

  async function load(params = { per_page: perPage }) {
    setLoading(true); setError('');
    try {
      const [ordersRes, statusesRes] = await Promise.all([
        adminOrdersApi.list(params),
        adminOrdersApi.statuses().catch(() => null),
      ]);
      const { data } = pickData(ordersRes);
      const { items, meta: m } = normalizeList(data, ['orders']);
      setOrders(items); setMeta(m);
      if (statusesRes) {
        const sdata = pickData(statusesRes).data;
        setStatuses(Array.isArray(sdata) ? sdata : (sdata?.data || []));
      }
    } catch (e) { setError(getErrorMessage(e)); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function view(order) {
    setActionError(''); setActionMsg('');
    try {
      const res = await adminOrdersApi.show(order.id);
      const { data } = pickData(res);
      setSelected(data?.data || data);
    } catch (e) { setActionError(getErrorMessage(e)); }
  }

  async function updateStatus(order, status) {
    if (!status) return;
    setUpdating(true); setActionError(''); setActionMsg('');
    try {
      const res = await adminOrdersApi.updateStatus(order.id, status);
      setActionMsg(pickData(res).message || 'Order status updated.');
      await load({ per_page: perPage });
      if (selected?.id === order.id) await view(order);
    } catch (e) { setActionError(getErrorMessage(e)); }
    finally { setUpdating(false); }
  }

  loadRef.current = load;
  viewRef.current = view;
  perPageRef.current = perPage;
  selectedRef.current = selected;

  useEffect(() => () => {
    if (reloadTimer.current) clearTimeout(reloadTimer.current);
  }, []);

  function scheduleLiveReload() {
    if (reloadTimer.current) clearTimeout(reloadTimer.current);
    reloadTimer.current = setTimeout(() => {
      loadRef.current?.({ per_page: perPageRef.current });
      if (selectedRef.current) viewRef.current?.(selectedRef.current);
    }, 250);
  }

  usePrivateChannel('admin.orders', {
    '.order.created': (event) => {
      setLiveNotice(`New order #${event.order_id} received.`);
      scheduleLiveReload();
    },
    '.order.status.updated': () => scheduleLiveReload(),
  }, isAdmin);

  return (
    <div className="grid" style={{ gap: 16 }}>
      <section className="card">
        <div className="page-header">
          <div>
            <h1>Admin Orders</h1>
            <p className="muted">Inspect orders and update statuses (cancellation releases stock).</p>
          </div>
          <div className="btn-row">
            <Badge kind={liveState === 'connected' ? 'ok' : liveState === 'connecting' ? 'warn' : 'bad'}>{liveState === 'connected' ? 'Live' : liveState}</Badge>
            <label className="small muted" htmlFor="per-page">Per page</label>
            <select id="per-page" value={perPage} onChange={(e)=>{ const v = Number(e.target.value); setPerPage(v); load({ per_page: v }); }}>
              {[10,20,50,100].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <button className="btn secondary" onClick={()=>load({ per_page: perPage })} disabled={loading}>Refresh</button>
          </div>
        </div>
        <Alert kind="error">{error}</Alert>
        <Alert kind="error">{actionError}</Alert>
        <Alert kind="success">{actionMsg}</Alert>
        <Alert kind="success">{liveNotice}</Alert>
        {loading ? <Spinner /> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>ID</th><th>User</th><th>Status</th><th>Items</th><th>Created</th><th>Actions</th></tr></thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id}>
                    <td>{o.id}</td>
                    <td>{o.user_id ?? '-'}</td>
                    <td><Badge kind={o.status === 'delivered' ? 'ok' : o.status === 'cancelled' ? 'bad' : 'warn'}>{o.status_label || o.status || '-'}</Badge></td>
                    <td>{Array.isArray(o.items) ? o.items.length : '-'}</td>
                    <td>{formatDate(o.created_at)}</td>
                    <td>
                      <div className="btn-row">
                        <button className="btn secondary" onClick={()=>view(o)}>View</button>
                        <select
                          aria-label={`Update status for order ${o.id}`}
                          defaultValue=""
                          disabled={updating}
                          onChange={(e)=>{ const v = e.target.value; e.target.value=''; updateStatus(o, v); }}
                        >
                          <option value="" disabled>Set status…</option>
                          {statuses.map(s => <option key={s.value} value={s.value}>{s.name || s.value}</option>)}
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
                {!orders.length && <tr><td colSpan="6" className="muted">No orders found.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
        {meta && (
          <div className="btn-row" style={{marginTop:12}}>
            <button className="btn secondary" disabled={(meta.current_page ?? 1)<=1} onClick={()=>load({ per_page: perPage, page: (meta.current_page ?? 1)-1 })}>Prev</button>
            <span className="small muted">Page {meta.current_page} / {meta.last_page} (total {meta.total})</span>
            <button className="btn secondary" disabled={(meta.current_page ?? 1)>=(meta.last_page ?? 1)} onClick={()=>load({ per_page: perPage, page: (meta.current_page ?? 1)+1 })}>Next</button>
          </div>
        )}
      </section>

      {selected && (
        <section className="card">
          <div className="page-header">
            <h2>Order #{selected.id} details</h2>
            <button className="btn secondary" onClick={()=>setSelected(null)}>Close</button>
          </div>
          <div className="kv" style={{marginBottom:12}}>
            <div className="muted">User ID</div><div>{selected.user_id ?? '-'}</div>
            <div className="muted">Status</div><div><Badge kind={selected.status === 'delivered' ? 'ok' : selected.status === 'cancelled' ? 'bad' : 'warn'}>{selected.status_label || selected.status}</Badge></div>
            <div className="muted">Created</div><div>{formatDate(selected.created_at)}</div>
          </div>
          <h3>Items</h3>
          <pre>{JSON.stringify(selected.items, null, 2)}</pre>
        </section>
      )}
    </div>
  );
}

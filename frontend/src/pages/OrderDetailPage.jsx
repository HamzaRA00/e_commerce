import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { userOrdersApi } from '../api/endpoints.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { Alert, Badge, Spinner } from '../components/ui.jsx';
import { usePrivateChannel, useRealtimeConnection } from '../realtime/usePrivateChannel.js';
import { formatDate, getErrorMessage, pickData } from '../utils/helpers.js';

export default function OrderDetailPage() {
  const { id } = useParams();
  const { isUser } = useAuth();
  const liveState = useRealtimeConnection();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [order, setOrder] = useState(null);

  useEffect(() => {
    let on = true;
    (async () => {
      setLoading(true); setError('');
      try {
        const res = await userOrdersApi.show(id);
        const { data } = pickData(res);
        const o = data?.data || data;
        if (on) setOrder(o);
      } catch (e) { if (on) setError(getErrorMessage(e)); }
      finally { if (on) setLoading(false); }
    })();
    return () => { on = false; };
  }, [id]);

  usePrivateChannel(`orders.${id}`, {
    '.order.status.updated': (event) => {
      setOrder((prev) => (prev ? {
        ...prev,
        status: event.status,
        status_label: event.status_label ?? prev.status_label,
      } : prev));
    },
  }, isUser);

  return (
    <div className="grid" style={{ gap: 16 }}>
      <div className="btn-row"><Link className="btn secondary" to="/orders">Back to orders</Link></div>
      <section className="card">
        <div className="page-header">
          <h1>Order #{id}</h1>
          <Badge kind={liveState === 'connected' ? 'ok' : liveState === 'connecting' ? 'warn' : 'bad'}>{liveState === 'connected' ? 'Live' : liveState}</Badge>
        </div>
        {loading && <Spinner />}
        <Alert kind="error">{error}</Alert>
        {order && (
          <>
            <div className="kv" style={{ marginBottom: 16 }}>
              <div className="muted">ID</div><div>{order.id}</div>
              <div className="muted">Status</div><div><Badge kind={order.status === 'delivered' ? 'ok' : order.status === 'cancelled' ? 'bad' : 'warn'}>{order.status_label || order.status || '-'}</Badge></div>
              <div className="muted">Created</div><div>{formatDate(order.created_at)}</div>
            </div>
            <h3>Items</h3>
            {Array.isArray(order.items) && order.items.length ? (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Item ID</th><th>Product ID</th><th>Product name</th></tr></thead>
                  <tbody>
                    {order.items.map((it) => (
                      <tr key={it.id}>
                        <td>{it.id}</td>
                        <td>{it.product?.id ?? '-'}</td>
                        <td>{it.product?.name ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p className="muted">No items.</p>}
          </>
        )}
      </section>
      {order && <section className="card"><h3>Raw data (testing)</h3><pre>{JSON.stringify(order, null, 2)}</pre></section>}
    </div>
  );
}

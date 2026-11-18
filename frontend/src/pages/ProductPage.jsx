import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { userCatalogApi } from '../api/endpoints.js';
import { Alert, Spinner } from '../components/ui.jsx';
import { getErrorMessage, pickData } from '../utils/helpers.js';

export default function ProductPage() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [product, setProduct] = useState(null);
  const [stockMessage, setStockMessage] = useState('');

  useEffect(() => {
    let on = true;
    (async () => {
      setLoading(true); setError('');
      try {
        const res = await userCatalogApi.product(id);
        const { data } = pickData(res);
        const p = data?.data || data;
        if (on) {
          setProduct(p);
          setStockMessage(p?.stock_message || '');
        }
      } catch (e) { if (on) setError(getErrorMessage(e)); }
      finally { if (on) setLoading(false); }
    })();
    return () => { on = false; };
  }, [id]);

  return (
    <div className="grid" style={{ gap: 16 }}>
      <div className="btn-row"><Link className="btn secondary" to="/catalog">Back to catalog</Link></div>
      <section className="card">
        <h1>Product #{id}</h1>
        {loading && <Spinner />}
        <Alert kind="error">{error}</Alert>
        <Alert kind="warn">{stockMessage}</Alert>
        {product && (
          <div className="grid grid-2">
            <div>
              <div className="kv">
                <div className="muted">ID</div><div>{product.id}</div>
                <div className="muted">Name</div><div>{product.name}</div>
                <div className="muted">Available quantity</div><div>{product.available_quantity ?? 'N/A'}</div>
                <div className="muted">Category</div><div>{product.category?.name || product.category?.id || '-'}</div>
              </div>
              <h3>Description</h3>
              <p>{product.description || '-'}</p>
            </div>
            <div>
              <h3>Images</h3>
              {Array.isArray(product.images) && product.images.length ? (
                <div className="grid" style={{gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))'}}>
                  {product.images.map(img => (
                    <a key={img.id || img.url} href={img.url} target="_blank" rel="noreferrer" className="card" style={{padding:8}}>
                      <img src={img.url} alt={`Product ${product.id}`} style={{width:'100%',height:120,objectFit:'cover',borderRadius:8}} />
                    </a>
                  ))}
                </div>
              ) : <p className="muted">No images.</p>}
            </div>
          </div>
        )}
      </section>
      {product && <section className="card"><h3>Raw data (testing)</h3><pre>{JSON.stringify(product, null, 2)}</pre></section>}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { userCatalogApi } from '../api/endpoints.js';
import { Alert, Field, Spinner } from '../components/ui.jsx';
import { getErrorMessage, normalizeList, pickData } from '../utils/helpers.js';

export default function CatalogPage() {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [prodState, setProdState] = useState({ loading: false, error: '', items: [], meta: null, stockMessage: '' });

  async function loadCategories(p = page, search = name) {
    setLoading(true); setError('');
    try {
      const res = await userCatalogApi.categories({ page: p, ...(search ? { name: search } : {}) });
      const { data } = pickData(res);
      const { items, meta: m } = normalizeList(data, ['categories']);
      setCategories(items);
      setMeta(m);
      setPage(p);
    } catch (e) { setError(getErrorMessage(e)); }
    finally { setLoading(false); }
  }

  async function loadProducts(category) {
    setSelected(category);
    setProdState({ loading: true, error: '', items: [], meta: null, stockMessage: '' });
    try {
      const res = await userCatalogApi.categoryProducts(category.id, { page: 1 });
      const body = res.data || {};
      const data = body.data || {};
      const items = data.products || [];
      setProdState({ loading: false, error: '', items, meta: data.meta || null, stockMessage: data.stock_message || '' });
    } catch (e) {
      setProdState(s => ({ ...s, loading: false, error: getErrorMessage(e) }));
    }
  }

  useEffect(() => { loadCategories(1, ''); }, []);

  return (
    <div className="grid" style={{ gap: 16 }}>
      <section className="card">
        <div className="page-header">
          <div>
            <h1>Catalog</h1>
            <p className="muted">Browse public categories and products (user API).</p>
          </div>
        </div>
        <form className="inline" onSubmit={(e)=>{e.preventDefault(); loadCategories(1, name);}}>
          <Field label="Search category name" htmlFor="cat-name">
            <input id="cat-name" value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Electronics" />
          </Field>
          <button className="btn" type="submit" disabled={loading}>Search</button>
          <button className="btn secondary" type="button" onClick={()=>{setName(''); loadCategories(1,'');}} disabled={loading}>Reset</button>
        </form>
        <Alert kind="error">{error}</Alert>
        {loading ? <Spinner label="Loading categories..." /> : (
          <>
            <div className="table-wrap">
              <table>
                <thead><tr><th>ID</th><th>Name</th><th>Products</th><th>Action</th></tr></thead>
                <tbody>
                  {categories.map(c => (
                    <tr key={c.id}>
                      <td>{c.id}</td>
                      <td>{c.name}</td>
                      <td>{c.products_count ?? '-'}</td>
                      <td><button className="btn secondary" onClick={()=>loadProducts(c)}>View products</button></td>
                    </tr>
                  ))}
                  {!categories.length && <tr><td colSpan="4" className="muted">No categories found.</td></tr>}
                </tbody>
              </table>
            </div>
            {meta && (
              <div className="btn-row" style={{marginTop:12}}>
                <button className="btn secondary" disabled={page<=1} onClick={()=>loadCategories(page-1)}>Prev</button>
                <span className="small muted">Page {meta.current_page} / {meta.last_page} (total {meta.total})</span>
                <button className="btn secondary" disabled={meta.current_page>=meta.last_page} onClick={()=>loadCategories(page+1)}>Next</button>
              </div>
            )}
          </>
        )}
      </section>

      <section className="card">
        <h2>Products {selected ? `in "${selected.name}" (ID ${selected.id})` : ''}</h2>
        {!selected && <p className="muted">Select a category to load products.</p>}
        <Alert kind="warn">{prodState.stockMessage}</Alert>
        <Alert kind="error">{prodState.error}</Alert>
        {prodState.loading ? <Spinner label="Loading products..." /> : selected && (
          <div className="table-wrap">
            <table>
              <thead><tr><th>ID</th><th>Name</th><th>Description</th><th>Available qty</th><th>Action</th></tr></thead>
              <tbody>
                {prodState.items.map(p => (
                  <tr key={p.id}>
                    <td>{p.id}</td>
                    <td>{p.name}</td>
                    <td className="small">{(p.description || '').slice(0,120)}{(p.description||'').length>120?'…':''}</td>
                    <td>{p.available_quantity ?? 'N/A'}</td>
                    <td><Link className="btn ghost" to={`/products/${p.id}`}>Details</Link></td>
                  </tr>
                ))}
                {!prodState.items.length && <tr><td colSpan="5" className="muted">No products found.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

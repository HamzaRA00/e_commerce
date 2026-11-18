import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminCategoriesApi } from '../api/endpoints.js';
import { Alert, Field, Spinner } from '../components/ui.jsx';
import { getErrorMessage, normalizeList, pickData } from '../utils/helpers.js';

const emptyForm = { name_en: '', name_ar: '' };

export default function AdminCategoriesPage() {
  const [name, setName] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);

  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [formMsg, setFormMsg] = useState('');

  async function load(p = page, search = name) {
    setLoading(true); setError('');
    try {
      const res = await adminCategoriesApi.list({ page: p, ...(search ? { name: search } : {}) });
      const { data } = pickData(res);
      const { items: cats, meta: m } = normalizeList(data, ['categories']);
      setItems(cats); setMeta(m); setPage(p);
    } catch (e) { setError(getErrorMessage(e)); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(1, ''); }, []);

  function resetForm() { setForm(emptyForm); setEditing(null); setFormError(''); setFormMsg(''); }

  async function onSubmit(e) {
    e.preventDefault();
    setFormError(''); setFormMsg(''); setSaving(true);
    try {
      if (editing) {
        const res = await adminCategoriesApi.update(editing.id, form);
        setFormMsg(pickData(res).message || 'Category updated.');
      } else {
        const res = await adminCategoriesApi.create(form);
        setFormMsg(pickData(res).message || 'Category created.');
      }
      resetForm();
      await load(1, name);
    } catch (e) { setFormError(getErrorMessage(e)); }
    finally { setSaving(false); }
  }

  function startEdit(category) {
    setEditing(category);
    setForm({ name_en: category.name || '', name_ar: '' });
    setFormError(''); setFormMsg('');
  }

  async function onDelete(category) {
    if (!confirm(`Delete category #${category.id} "${category.name}"? This may fail if it has products.`)) return;
    setError('');
    try {
      await adminCategoriesApi.remove(category.id);
      await load(page, name);
    } catch (e) { setError(getErrorMessage(e)); }
  }

  return (
    <div className="grid" style={{ gap: 16 }}>
      <section className="card">
        <div className="page-header">
          <div>
            <h1>Admin Categories</h1>
            <p className="muted">List, create, update, and delete categories.</p>
          </div>
          <Link className="btn secondary" to="/dashboard">Back to dashboard</Link>
        </div>
        <form className="inline" onSubmit={(e)=>{e.preventDefault(); load(1, name);}}>
          <Field label="Search by English name" htmlFor="admin-cat-name">
            <input id="admin-cat-name" value={name} onChange={e=>setName(e.target.value)} placeholder="Search categories" />
          </Field>
          <button className="btn" type="submit" disabled={loading}>Search</button>
          <button className="btn secondary" type="button" onClick={()=>{setName(''); load(1,'');}} disabled={loading}>Reset</button>
        </form>
        <Alert kind="error">{error}</Alert>
        {loading ? <Spinner /> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>ID</th><th>Name (en)</th><th>Products</th><th>Actions</th></tr></thead>
              <tbody>
                {items.map(c => (
                  <tr key={c.id}>
                    <td>{c.id}</td>
                    <td>{c.name}</td>
                    <td>{c.products_count ?? '-'}</td>
                    <td>
                      <div className="btn-row">
                        <button className="btn secondary" onClick={()=>startEdit(c)}>Edit</button>
                        <button className="btn danger" onClick={()=>onDelete(c)}>Delete</button>
                        <Link className="btn ghost" to={`/products?category=${c.id}`}>Products</Link>
                      </div>
                    </td>
                  </tr>
                ))}
                {!items.length && <tr><td colSpan="4" className="muted">No categories found.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
        {meta && (
          <div className="btn-row" style={{marginTop:12}}>
            <button className="btn secondary" disabled={page<=1} onClick={()=>load(page-1)}>Prev</button>
            <span className="small muted">Page {meta.current_page} / {meta.last_page} (total {meta.total})</span>
            <button className="btn secondary" disabled={meta.current_page>=meta.last_page} onClick={()=>load(page+1)}>Next</button>
          </div>
        )}
      </section>

      <section className="card">
        <h2>{editing ? `Edit category #${editing.id}` : 'Create category'}</h2>
        <Alert kind="error">{formError}</Alert>
        <Alert kind="success">{formMsg}</Alert>
        <form onSubmit={onSubmit}>
          <div className="grid grid-2">
            <Field label="Name (English)" htmlFor="cat-en"><input id="cat-en" required value={form.name_en} onChange={e=>setForm(f=>({...f,name_en:e.target.value}))} /></Field>
            <Field label="Name (Arabic)" htmlFor="cat-ar" help="Required by API even when UI is English."><input id="cat-ar" required value={form.name_ar} onChange={e=>setForm(f=>({...f,name_ar:e.target.value}))} /></Field>
          </div>
          <div className="btn-row">
            <button className="btn" type="submit" disabled={saving}>{saving?'Saving...':(editing?'Update category':'Create category')}</button>
            {editing && <button className="btn secondary" type="button" onClick={resetForm}>Cancel</button>}
          </div>
        </form>
      </section>
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { adminCategoriesApi, adminProductsApi } from '../../api/endpoints.js';
import { Alert, Field, Spinner } from '../../components/ui.jsx';
import { getErrorMessage, normalizeList, pickData } from '../../utils/helpers.js';

const emptyForm = { category_id: '', name_en: '', name_ar: '', description_en: '', description_ar: '' };

export default function AdminProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryId = searchParams.get('category') || '';

  const [categories, setCategories] = useState([]);
  const [catsLoading, setCatsLoading] = useState(true);
  const [catsError, setCatsError] = useState('');

  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState(emptyForm);
  const [images, setImages] = useState([]);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [formMsg, setFormMsg] = useState('');

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [imageFiles, setImageFiles] = useState([]);
  const [imgBusy, setImgBusy] = useState(false);

  async function loadCategories() {
    setCatsLoading(true); setCatsError('');
    try {
      // The admin categories endpoint paginates at 5 per page, so walk pages
      // to build a complete selector (capped to avoid runaway loops).
      const all = [];
      let pageNo = 1;
      for (let i = 0; i < 20; i += 1) {
        const res = await adminCategoriesApi.list({ page: pageNo });
        const { data } = pickData(res);
        const { items, meta: m } = normalizeList(data, ['categories']);
        all.push(...items);
        if (!m || pageNo >= (m.last_page ?? 1)) break;
        pageNo += 1;
      }
      setCategories(all);
      if (!categoryId && all[0]) setSearchParams({ category: String(all[0].id) }, { replace: true });
    } catch (e) { setCatsError(getErrorMessage(e)); }
    finally { setCatsLoading(false); }
  }

  async function loadProducts(cid = categoryId, p = page, search = name) {
    if (!cid) return;
    setLoading(true); setError('');
    try {
      const res = await adminProductsApi.listInCategory(cid, { page: p, ...(search ? { name: search } : {}) });
      const { data } = pickData(res);
      const { items, meta: m } = normalizeList(data, ['products']);
      setProducts(items); setMeta(m); setPage(p);
    } catch (e) { setError(getErrorMessage(e)); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadCategories(); }, []);
  useEffect(() => { if (categoryId) loadProducts(categoryId, 1, ''); }, [categoryId]);

  const currentCategory = useMemo(() => categories.find(c => String(c.id) === String(categoryId)) || null, [categories, categoryId]);

  function resetForm() {
    setForm({ ...emptyForm, category_id: categoryId || '' });
    setImages([]); setEditing(null); setFormError(''); setFormMsg('');
  }

  async function onSubmit(e) {
    e.preventDefault();
    setFormError(''); setFormMsg(''); setSaving(true);
    try {
      if (editing) {
        const payload = {
          category_id: form.category_id || editing.category?.id || categoryId,
          name_en: form.name_en,
          name_ar: form.name_ar,
          description_en: form.description_en,
          description_ar: form.description_ar,
        };
        const res = await adminProductsApi.update(editing.id, payload);
        setFormMsg(pickData(res).message || 'Product updated.');
      } else {
        if (!form.category_id) throw new Error('Select a category first');
        const res = await adminProductsApi.create(form, images);
        setFormMsg(pickData(res).message || 'Product created.');
      }
      resetForm();
      if (categoryId) await loadProducts(categoryId, 1, name);
    } catch (e) { setFormError(getErrorMessage(e)); }
    finally { setSaving(false); }
  }

  function startEdit(product) {
    setEditing(product);
    setSelectedProduct(product);
    setForm({
      category_id: String(product.category?.id || categoryId || ''),
      name_en: product.name || '',
      name_ar: '',
      description_en: product.description || '',
      description_ar: '',
    });
    setFormError(''); setFormMsg('');
  }

  async function removeProduct(product) {
    if (!confirm(`Delete product #${product.id} "${product.name}"?`)) return;
    setError('');
    try {
      await adminProductsApi.remove(product.id);
      if (selectedProduct?.id === product.id) setSelectedProduct(null);
      await loadProducts(categoryId, page, name);
    } catch (e) { setError(getErrorMessage(e)); }
  }

  async function loadProductDetails(product) {
    setFormError(''); setFormMsg('');
    try {
      const res = await adminProductsApi.show(product.id);
      const { data } = pickData(res);
      setSelectedProduct(data?.data || data);
    } catch (e) { setFormError(getErrorMessage(e)); }
  }

  async function addImages(e) {
    e.preventDefault();
    if (!selectedProduct) return;
    if (!imageFiles.length) { setFormError('Choose at least one image'); return; }
    setImgBusy(true); setFormError(''); setFormMsg('');
    try {
      const res = await adminProductsApi.addImages(selectedProduct.id, imageFiles);
      setFormMsg(pickData(res).message || 'Images added.');
      setImageFiles([]);
      await loadProductDetails(selectedProduct);
      await loadProducts(categoryId, page, name);
    } catch (e) { setFormError(getErrorMessage(e)); }
    finally { setImgBusy(false); }
  }

  async function deleteImage(imageId) {
    if (!selectedProduct) return;
    if (!confirm(`Delete image #${imageId}?`)) return;
    setImgBusy(true); setFormError(''); setFormMsg('');
    try {
      await adminProductsApi.deleteImage(selectedProduct.id, imageId);
      setFormMsg('Image deleted.');
      await loadProductDetails(selectedProduct);
      await loadProducts(categoryId, page, name);
    } catch (e) { setFormError(getErrorMessage(e)); }
    finally { setImgBusy(false); }
  }

  return (
    <div className="grid" style={{ gap: 16 }}>
      <section className="card">
        <div className="page-header">
          <div>
            <h1>Admin Products</h1>
            <p className="muted">Products are managed per category in this API.</p>
          </div>
          <Link className="btn secondary" to="/admin/dashboard">Back to dashboard</Link>
        </div>
        <Alert kind="error">{catsError}</Alert>
        {catsLoading ? <Spinner label="Loading categories..." /> : (
          <div className="inline" style={{alignItems:'flex-end'}}>
            <Field label="Category" htmlFor="prod-category">
              <select id="prod-category" value={categoryId} onChange={(e)=>setSearchParams({ category: e.target.value })}>
                <option value="" disabled>Select category</option>
                {categories.map(c => <option key={c.id} value={c.id}>#{c.id} — {c.name}</option>)}
              </select>
            </Field>
            <Field label="Search product (English name)" htmlFor="prod-name">
              <input id="prod-name" value={name} onChange={e=>setName(e.target.value)} placeholder="Search products" />
            </Field>
            <div className="btn-row" style={{marginBottom:12}}>
              <button className="btn" onClick={()=>loadProducts(categoryId, 1, name)} disabled={!categoryId || loading}>Search</button>
              <button className="btn secondary" onClick={()=>{setName(''); loadProducts(categoryId,1,'');}} disabled={!categoryId || loading}>Reset</button>
            </div>
          </div>
        )}
        <Alert kind="error">{error}</Alert>
        {loading ? <Spinner /> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>ID</th><th>Name</th><th>Description</th><th>Images</th><th>Actions</th></tr></thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id}>
                    <td>{p.id}</td>
                    <td>{p.name}</td>
                    <td className="small">{(p.description || '').slice(0,100)}{(p.description||'').length>100?'…':''}</td>
                    <td>{Array.isArray(p.images) ? p.images.length : '-'}</td>
                    <td>
                      <div className="btn-row">
                        <button className="btn secondary" onClick={()=>loadProductDetails(p)}>View</button>
                        <button className="btn secondary" onClick={()=>startEdit(p)}>Edit</button>
                        <button className="btn danger" onClick={()=>removeProduct(p)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!products.length && <tr><td colSpan="5" className="muted">{categoryId ? 'No products in this category.' : 'Select a category.'}</td></tr>}
              </tbody>
            </table>
          </div>
        )}
        {meta && (
          <div className="btn-row" style={{marginTop:12}}>
            <button className="btn secondary" disabled={page<=1} onClick={()=>loadProducts(categoryId, page-1, name)}>Prev</button>
            <span className="small muted">Page {meta.current_page} / {meta.last_page} (total {meta.total})</span>
            <button className="btn secondary" disabled={meta.current_page>=meta.last_page} onClick={()=>loadProducts(categoryId, page+1, name)}>Next</button>
          </div>
        )}
      </section>

      <section className="card">
        <h2>{editing ? `Edit product #${editing.id}` : 'Create product'}{currentCategory ? ` in "${currentCategory.name}"` : ''}</h2>
        <Alert kind="error">{formError}</Alert>
        <Alert kind="success">{formMsg}</Alert>
        <form onSubmit={onSubmit}>
          <div className="grid grid-2">
            <Field label="Category ID" htmlFor="p-cat"><input id="p-cat" value={form.category_id} onChange={e=>setForm(f=>({...f,category_id:e.target.value}))} placeholder="e.g. 1" /></Field>
            <Field label="Name (English)" htmlFor="p-en"><input id="p-en" required value={form.name_en} onChange={e=>setForm(f=>({...f,name_en:e.target.value}))} /></Field>
            <Field label="Name (Arabic)" htmlFor="p-ar" help="Required by API."><input id="p-ar" required value={form.name_ar} onChange={e=>setForm(f=>({...f,name_ar:e.target.value}))} /></Field>
            <Field label="Description (Arabic)" htmlFor="p-dar" help="Required by API."><input id="p-dar" required value={form.description_ar} onChange={e=>setForm(f=>({...f,description_ar:e.target.value}))} /></Field>
          </div>
          <Field label="Description (English)" htmlFor="p-den"><textarea id="p-den" required value={form.description_en} onChange={e=>setForm(f=>({...f,description_en:e.target.value}))} /></Field>
          {!editing && (
            <Field label="Images (max 5, jpg/png/webp, up to 5MB each)" htmlFor="p-images">
              <input id="p-images" type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={e=>setImages(Array.from(e.target.files || []).slice(0,5))} />
            </Field>
          )}
          <div className="btn-row">
            <button className="btn" type="submit" disabled={saving}>{saving?'Saving...':(editing?'Update product':'Create product')}</button>
            {editing && <button className="btn secondary" type="button" onClick={resetForm}>Cancel</button>}
          </div>
        </form>
      </section>

      {selectedProduct && (
        <section className="card">
          <div className="page-header">
            <div>
              <h2>Product #{selectedProduct.id} details</h2>
              <p className="muted small">{selectedProduct.name}</p>
            </div>
            <button className="btn secondary" onClick={()=>setSelectedProduct(null)}>Close</button>
          </div>
          <div className="grid grid-2">
            <div>
              <div className="kv">
                <div className="muted">Category</div><div>{selectedProduct.category?.name || selectedProduct.category?.id || '-'}</div>
                <div className="muted">Description</div><div>{selectedProduct.description || '-'}</div>
              </div>
            </div>
            <div>
              <h3>Images</h3>
              {Array.isArray(selectedProduct.images) && selectedProduct.images.length ? (
                <div className="grid" style={{gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))'}}>
                  {selectedProduct.images.map(img => (
                    <div key={img.id || img.url} className="card" style={{padding:8}}>
                      <img src={img.url} alt={`Product ${selectedProduct.id}`} style={{width:'100%',height:110,objectFit:'cover',borderRadius:8}} />
                      <div className="btn-row" style={{marginTop:6}}>
                        <a className="btn ghost" href={img.url} target="_blank" rel="noreferrer">Open</a>
                        <button className="btn danger" type="button" disabled={imgBusy} onClick={()=>deleteImage(img.id)}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <p className="muted">No images.</p>}
              <form onSubmit={addImages} style={{marginTop:12}}>
                <Field label="Add images" htmlFor="add-images">
                  <input id="add-images" type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={e=>setImageFiles(Array.from(e.target.files || []).slice(0,5))} />
                </Field>
                <button className="btn" type="submit" disabled={imgBusy}>{imgBusy?'Uploading...':'Upload images'}</button>
              </form>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

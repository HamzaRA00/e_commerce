import { Link } from 'react-router-dom';

export default function AdminDashboardPage() {
  return (
    <div className="grid" style={{ gap: 16 }}>
      <section className="card">
        <h1>Admin Dashboard</h1>
        <p className="muted">Testing console for admin API endpoints. Choose an area below.</p>
        <div className="btn-row">
          <Link className="btn" to="/admin/categories">Manage Categories</Link>
          <Link className="btn" to="/admin/products">Manage Products</Link>
          <Link className="btn" to="/admin/orders">Manage Orders</Link>
        </div>
      </section>
      <section className="grid grid-3">
        <div className="card">
          <h3>Categories</h3>
          <p className="small muted">List with search/pagination, create, update, delete, and inspect details.</p>
        </div>
        <div className="card">
          <h3>Products</h3>
          <p className="small muted">List by category, create with images, update, delete, add/remove product images.</p>
        </div>
        <div className="card">
          <h3>Orders</h3>
          <p className="small muted">List and inspect orders, fetch available statuses, and update order status.</p>
        </div>
      </section>
    </div>
  );
}

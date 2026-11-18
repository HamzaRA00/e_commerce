import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';

export default function HomePage() {
  const { isAuthenticated, isAdmin, isUser } = useAuth();
  return (
    <div className="grid" style={{ gap: 20 }}>
      <section className="card">
        <div className="page-header">
          <div>
            <h1>E-commerce API Test Frontend</h1>
            <p className="muted">React + Vite + JavaScript client for the Postman collection flows (customer and admin).</p>
          </div>
        </div>
        <div className="btn-row">
          <Link className="btn" to="/catalog">Browse Catalog</Link>
          {!isAuthenticated && <Link className="btn secondary" to="/login">User Login</Link>}
          {!isAuthenticated && <Link className="btn secondary" to="/admin/login">Admin Login</Link>}
          {isUser && <Link className="btn" to="/orders">My Orders</Link>}
          {isAdmin && <Link className="btn" to="/admin/dashboard">Admin Dashboard</Link>}
        </div>
      </section>
      <section className="grid grid-3">
        <div className="card">
          <h3>Customer flows</h3>
          <ul className="list">
            <li>Register, login, email verify/resend</li>
            <li>Browse categories and products</li>
            <li>Create and view orders</li>
            <li>Session refresh/logout actions</li>
          </ul>
        </div>
        <div className="card">
          <h3>Admin flows</h3>
          <ul className="list">
            <li>Admin login and session actions</li>
            <li>Categories and products management</li>
            <li>Product images upload/delete</li>
            <li>Orders listing and status updates</li>
          </ul>
        </div>
        <div className="card">
          <h3>Testing notes</h3>
          <ul className="list">
            <li>Uses Axios with <span className="mono">/api/v1</span> base URL</li>
            <li>Sends <span className="mono">lang: en</span> and device headers</li>
            <li>Shows raw API messages/errors for debugging</li>
            <li>Designed for local Docker/backend testing</li>
          </ul>
        </div>
      </section>
    </div>
  );
}

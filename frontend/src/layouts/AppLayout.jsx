import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { mutualApi } from '../api/endpoints.js';

export default function AppLayout() {
  const { auth, isAuthenticated, isAdmin, isUser, logoutLocal } = useAuth();
  const navigate = useNavigate();

  async function handleLogout(mode = 'one') {
    try {
      if (mode === 'all') await mutualApi.logoutAll();
      else if (mode === 'others') await mutualApi.logoutOther();
      else await mutualApi.logout();
    } catch {
      // ignore server logout errors for testing; clear local anyway
    } finally {
      logoutLocal();
      navigate('/');
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="container topbar-inner">
          <NavLink to="/" className="brand">Ecom Test Frontend</NavLink>
          <nav className="nav" aria-label="Main">
            <NavLink to="/" end>Home</NavLink>
            <NavLink to="/catalog">Catalog</NavLink>
            {isUser && <NavLink to="/orders">My Orders</NavLink>}
            {isAdmin && <NavLink to="/admin/dashboard">Admin</NavLink>}
            {!isAuthenticated && <NavLink to="/login">User Login</NavLink>}
            {!isAuthenticated && <NavLink to="/register">Register</NavLink>}
            {!isAuthenticated && <NavLink to="/admin/login">Admin Login</NavLink>}
            {isAuthenticated && <span className="pill">{isAdmin ? 'admin' : 'user'}{auth?.email ? `: ${auth.email}` : ''}</span>}
            {isAuthenticated && <button className="linklike" onClick={() => handleLogout('one')}>Logout</button>}
            {isAuthenticated && <button className="linklike" onClick={() => handleLogout('others')}>Logout others</button>}
            {isAuthenticated && <button className="linklike" onClick={() => handleLogout('all')}>Logout all</button>}
          </nav>
        </div>
      </header>
      <main className="main">
        <div className="container">
          <Outlet />
        </div>
      </main>
      <footer className="footer">
        <div className="container">Testing frontend for Laravel e-commerce API (React + Vite + Axios).</div>
      </footer>
    </div>
  );
}

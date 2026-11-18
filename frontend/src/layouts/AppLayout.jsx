import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { mutualApi } from '../api/endpoints.js';
import { NotificationBell, RealtimeToaster } from '../components/notifications.jsx';
import { useCustomerRealtime } from '../realtime/CustomerRealtimeContext.jsx';
import {
  ChevronDownIcon,
  GridIcon,
  LogOutIcon,
  LogoIcon,
  ReceiptIcon,
  ShieldIcon,
  StoreIcon,
  UserIcon,
} from '../components/icons.jsx';

export default function AppLayout() {
  const { auth, isAuthenticated, isUser, logoutLocal } = useAuth();
  const { notifications, unreadCount, toasts, markAllRead, clearNotifications, dismissToast } = useCustomerRealtime();
  const navigate = useNavigate();

  async function handleLogout(mode = 'one', event) {
    event?.currentTarget.closest('details')?.removeAttribute('open');
    try {
      if (mode === 'all') await mutualApi.logoutAll();
      else if (mode === 'others') await mutualApi.logoutOther();
      else await mutualApi.logout();
    } catch {
      // Clear local state even if the server session is already gone.
    } finally {
      logoutLocal();
      navigate('/');
    }
  }

  const initial = (auth?.email || '?').trim().charAt(0).toUpperCase();

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="topbar">
        <div className="container topbar-inner">
          <NavLink to="/" className="brand" aria-label="Ecom Test home">
            <span className="brand-mark"><LogoIcon size={22} /></span>
            <span className="brand-text">
              <strong>ECOM<span>TEST</span></strong>
              <small>Storefront</small>
            </span>
          </NavLink>

          <nav className="nav" aria-label="Main">
            <NavLink to="/" end><StoreIcon size={16} /><span>Home</span></NavLink>
            <NavLink to="/catalog"><GridIcon size={16} /><span>Catalog</span></NavLink>
            {isUser && <NavLink to="/orders"><ReceiptIcon size={16} /><span>Orders</span></NavLink>}
          </nav>

          <div className="topbar-actions">
            {isUser && (
              <NotificationBell
                notifications={notifications}
                unreadCount={unreadCount}
                onOpen={markAllRead}
                onClear={clearNotifications}
              />
            )}
            {!isAuthenticated ? (
              <>
                <NavLink className="btn btn-secondary btn-sm" to="/login">Sign in</NavLink>
                <NavLink className="btn btn-sm" to="/register">Register</NavLink>
              </>
            ) : (
              <details className="user-menu">
                <summary aria-label="Account menu">
                  <span className="avatar">{initial}</span>
                  <span className="user-meta">
                    <strong>Customer</strong>
                    <small>{auth?.email}</small>
                  </span>
                  <ChevronDownIcon size={15} />
                </summary>
                <div className="menu-panel">
                  <div className="menu-head">
                    <span className="small muted">Signed in as</span>
                    <strong className="menu-email">{auth?.email}</strong>
                  </div>
                  {isUser && auth?.verified === false && (
                    <NavLink className="menu-item" to="/verify-email">
                      <ShieldIcon size={16} /> Verify email
                    </NavLink>
                  )}
                  <button type="button" className="menu-item" onClick={(e) => handleLogout('one', e)}>
                    <LogOutIcon size={16} /> Sign out this device
                  </button>
                  <button type="button" className="menu-item" onClick={(e) => handleLogout('others', e)}>
                    <UserIcon size={16} /> Sign out other devices
                  </button>
                  <button type="button" className="menu-item menu-item-danger" onClick={(e) => handleLogout('all', e)}>
                    <LogOutIcon size={16} /> Sign out everywhere
                  </button>
                </div>
              </details>
            )}
          </div>
        </div>
      </header>

      <main className="main" id="main">
        <div className="container">
          <Outlet />
        </div>
      </main>

      <footer className="footer">
        <div className="container footer-inner">
          <div>
            <strong>Ecom Test</strong>
            <span className="footer-copy">Customer storefront for the Laravel e-commerce API.</span>
          </div>
          <div className="footer-meta">
            <span>React + Vite</span>
            <span>Laravel API v1</span>
            <span>Reverb realtime</span>
          </div>
        </div>
      </footer>

      <RealtimeToaster toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

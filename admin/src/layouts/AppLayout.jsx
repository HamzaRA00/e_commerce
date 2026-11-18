import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { mutualApi } from '../api/endpoints.js';
import { NotificationBell, RealtimeToaster } from '../components/notifications.jsx';
import { useAdminRealtime } from '../realtime/AdminRealtimeContext.jsx';
import {
  ArrowUpRightIcon,
  ChevronDownIcon,
  ClipboardIcon,
  LayersIcon,
  LogOutIcon,
  LogoIcon,
  PackageIcon,
  RadioIcon,
  ShieldIcon,
} from '../components/icons.jsx';

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: ShieldIcon, end: true },
  { to: '/orders', label: 'Orders', icon: ClipboardIcon },
  { to: '/categories', label: 'Categories', icon: LayersIcon },
  { to: '/products', label: 'Products', icon: PackageIcon },
];

const connectionLabels = {
  connected: 'Live',
  connecting: 'Connecting',
  disconnected: 'Offline',
  unavailable: 'Realtime off',
  failed: 'Realtime failed',
};

export default function AppLayout() {
  const { auth, logoutLocal } = useAuth();
  const {
    connectionState,
    notifications,
    unreadCount,
    toasts,
    markAllRead,
    clearNotifications,
    dismissToast,
  } = useAdminRealtime();
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
      navigate('/login');
    }
  }

  const initial = (auth?.email || '?').trim().charAt(0).toUpperCase();
  const live = connectionState === 'connected';
  const storefrontUrl = import.meta.env.VITE_STOREFRONT_URL || 'http://localhost:5173';

  return (
    <div className="app-shell admin-shell">
      <a className="skip-link" href="#main">Skip to content</a>

      <header className="topbar">
        <div className="topbar-inner admin-topbar">
          <NavLink to="/dashboard" className="brand" aria-label="Ecom Admin dashboard">
            <span className="brand-mark"><LogoIcon size={22} /></span>
            <span className="brand-text">
              <strong>ECOM<span>ADMIN</span></strong>
              <small>Operations console</small>
            </span>
          </NavLink>

          <div className="topbar-actions">
            <span className={`connection-pill ${live ? 'is-live' : ''}`} title={`Realtime: ${connectionState}`}>
              <RadioIcon size={14} />
              {connectionLabels[connectionState] || connectionState}
            </span>
            <NotificationBell
              notifications={notifications}
              unreadCount={unreadCount}
              onOpen={markAllRead}
              onClear={clearNotifications}
            />
            <details className="user-menu">
              <summary aria-label="Admin account menu">
                <span className="avatar avatar-admin">{initial}</span>
                <span className="user-meta">
                  <strong>Administrator</strong>
                  <small>{auth?.email}</small>
                </span>
                <ChevronDownIcon size={15} />
              </summary>
              <div className="menu-panel">
                <div className="menu-head">
                  <span className="small muted">Signed in as</span>
                  <strong className="menu-email">{auth?.email}</strong>
                </div>
                <a className="menu-item" href={storefrontUrl} target="_blank" rel="noreferrer">
                  <ArrowUpRightIcon size={16} /> Open storefront
                </a>
                <button type="button" className="menu-item" onClick={(e) => handleLogout('one', e)}>
                  <LogOutIcon size={16} /> Sign out this device
                </button>
                <button type="button" className="menu-item" onClick={(e) => handleLogout('others', e)}>
                  <ShieldIcon size={16} /> Sign out other devices
                </button>
                <button type="button" className="menu-item menu-item-danger" onClick={(e) => handleLogout('all', e)}>
                  <LogOutIcon size={16} /> Sign out everywhere
                </button>
              </div>
            </details>
          </div>
        </div>
      </header>

      <div className="admin-body">
        <aside className="admin-sidebar">
          <span className="sidebar-label">Workspace</span>
          <nav className="side-nav" aria-label="Admin sections">
            {links.map(({ to, label, icon: IconComponent, end }) => (
              <NavLink key={to} to={to} end={end}>
                <IconComponent size={17} />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
          <div className="sidebar-foot">
            <div className="sidebar-note">
              <RadioIcon size={15} />
              <span>Orders stream over <span className="mono">admin.orders</span>.</span>
            </div>
            <a href={storefrontUrl} target="_blank" rel="noreferrer">
              <ArrowUpRightIcon size={15} /> Storefront
            </a>
          </div>
        </aside>

        <main className="admin-main" id="main">
          <div className="admin-content">
            <Outlet />
          </div>
        </main>
      </div>

      <RealtimeToaster toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

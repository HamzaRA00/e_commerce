import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import {
  ActivityIcon,
  ArrowRightIcon,
  ArrowUpRightIcon,
  CheckIcon,
  GridIcon,
  LayersIcon,
  RadioIcon,
  ReceiptIcon,
  ShieldIcon,
  SparklesIcon,
  TerminalIcon,
  UserIcon,
  ZapIcon,
} from '../components/icons.jsx';

const customerFeatures = [
  'Register and sign in without an email step',
  'Browse categories and product detail',
  'Create orders with live stock checks',
  'Refresh or revoke device sessions',
];

const adminFeatures = [
  'Manage bilingual categories',
  'Create products and upload images',
  'Review every order in one queue',
  'Update status and release stock',
];

const realtimeFeatures = [
  'Private per-customer channels',
  'Queued broadcasts through RabbitMQ',
  'In-app order update toasts',
  'Order status patches in place',
];

export default function HomePage() {
  const { isAuthenticated, isUser } = useAuth();
  const adminUrl = import.meta.env.VITE_ADMIN_URL || 'http://localhost:5174';

  return (
    <div className="home">
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow"><span className="pulse-dot" /> E-commerce API v1</span>
          <h1>A storefront built for live order tracking.</h1>
          <p className="hero-lead">
            Browse the catalog, create orders, and follow every status change in realtime.
            Admin operations run in a separate, dedicated console.
          </p>
          <div className="btn-row hero-actions">
            <Link className="btn" to="/catalog">
              Browse catalog <ArrowRightIcon size={17} />
            </Link>
            {isUser && <Link className="btn btn-secondary" to="/orders">View my orders</Link>}
            {!isAuthenticated && <Link className="btn btn-secondary" to="/login">Sign in</Link>}
            <a className="btn btn-secondary" href={adminUrl} target="_blank" rel="noreferrer">
              Admin app <ArrowUpRightIcon size={16} />
            </a>
          </div>
          <div className="hero-meta">
            <span><CheckIcon size={14} /> Sanctum tokens</span>
            <span><CheckIcon size={14} /> Device sessions</span>
            <span><CheckIcon size={14} /> Realtime events</span>
          </div>
        </div>

        <div className="hero-panel" aria-label="API console overview">
          <div className="panel-top">
            <span className="panel-dots" aria-hidden="true"><i /><i /><i /></span>
            <span className="mono">api-console</span>
            <span className="badge ok">v1</span>
          </div>
          <div className="terminal">
            <div><span className="terminal-prompt">$</span> GET /api/v1/categories</div>
            <div className="terminal-muted">200 OK · paginated catalog</div>
            <div><span className="terminal-prompt">$</span> listen order.status.updated</div>
            <div className="terminal-muted">private channel · live</div>
          </div>
          <div className="panel-stats">
            <div><strong>2</strong><span>apps</span></div>
            <div><strong>2</strong><span>live events</span></div>
            <div><strong>1</strong><span>customer feed</span></div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <span className="eyebrow"><SparklesIcon size={14} /> Workflows</span>
          <h2>Built for end-to-end testing</h2>
          <p className="muted">Cover the full path from first sign-in to a live order status update.</p>
        </div>
        <div className="feature-grid">
          <article className="card feature-card">
            <span className="icon-tile"><UserIcon size={20} /></span>
            <h3>Customer flows</h3>
            <ul className="feature-list">
              {customerFeatures.map((item) => <li key={item}><CheckIcon size={15} /> {item}</li>)}
            </ul>
            <Link className="text-link" to="/catalog">Open storefront <ArrowUpRightIcon size={15} /></Link>
          </article>
          <article className="card feature-card">
            <span className="icon-tile icon-tile-blue"><ShieldIcon size={20} /></span>
            <h3>Separate admin app</h3>
            <ul className="feature-list">
              {adminFeatures.map((item) => <li key={item}><CheckIcon size={15} /> {item}</li>)}
            </ul>
            <a className="text-link" href={adminUrl} target="_blank" rel="noreferrer">
              Enter admin <ArrowUpRightIcon size={15} />
            </a>
          </article>
          <article className="card feature-card">
            <span className="icon-tile icon-tile-amber"><RadioIcon size={20} /></span>
            <h3>Realtime layer</h3>
            <ul className="feature-list">
              {realtimeFeatures.map((item) => <li key={item}><CheckIcon size={15} /> {item}</li>)}
            </ul>
            <Link className="text-link" to={isUser ? '/orders' : '/login'}>
              Watch updates <ArrowUpRightIcon size={15} />
            </Link>
          </article>
        </div>
      </section>

      <section className="split-panel">
        <div className="card steps-card">
          <span className="eyebrow"><ZapIcon size={14} /> Quick start</span>
          <h2>Three steps to a live update</h2>
          <ol className="steps">
            <li>
              <span className="step-number">01</span>
              <div><strong>Sign in</strong><p>Use a seeded customer account or create a new one.</p></div>
            </li>
            <li>
              <span className="step-number">02</span>
              <div><strong>Place an order</strong><p>Add product IDs and let the warehouse reserve stock.</p></div>
            </li>
            <li>
              <span className="step-number">03</span>
              <div><strong>Change the status</strong><p>Switch to the admin app and watch this page update live.</p></div>
            </li>
          </ol>
        </div>

        <div className="card stack-card">
          <span className="eyebrow"><LayersIcon size={14} /> Stack</span>
          <h2>What is running</h2>
          <ul className="stack-list">
            <li><span className="stack-icon"><TerminalIcon size={17} /></span><div><strong>React + Vite</strong><span>Axios client with token refresh</span></div></li>
            <li><span className="stack-icon"><GridIcon size={17} /></span><div><strong>Laravel API</strong><span>Sanctum auth and versioned routes</span></div></li>
            <li><span className="stack-icon"><ReceiptIcon size={17} /></span><div><strong>Warehouse gRPC</strong><span>Stock reservations and release</span></div></li>
            <li><span className="stack-icon"><ActivityIcon size={17} /></span><div><strong>Reverb + RabbitMQ</strong><span>Queued private broadcasts</span></div></li>
          </ul>
        </div>
      </section>

      <section className="cta-band">
        <div>
          <h2>Start with a clean session.</h2>
          <p className="muted">The customer and admin apps use separate sessions, so both can stay signed in side by side.</p>
        </div>
        <div className="btn-row">
          {!isAuthenticated && <Link className="btn" to="/register">Create account <ArrowRightIcon size={17} /></Link>}
          <Link className="btn btn-secondary" to="/catalog">Explore catalog</Link>
          <a className="btn btn-secondary" href={adminUrl} target="_blank" rel="noreferrer">Open admin app</a>
        </div>
      </section>
    </div>
  );
}

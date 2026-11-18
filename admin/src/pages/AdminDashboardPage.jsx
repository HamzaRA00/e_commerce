import { Link } from 'react-router-dom';
import { Badge, PageHeader } from '../components/ui.jsx';
import {
  ArrowUpRightIcon,
  CheckIcon,
  ClipboardIcon,
  LayersIcon,
  PackageIcon,
  RadioIcon,
  ShieldIcon,
  ZapIcon,
} from '../components/icons.jsx';

const areas = [
  {
    to: '/categories',
    icon: LayersIcon,
    tone: 'icon-tile-blue',
    title: 'Categories',
    description: 'Search, create, edit, and delete the bilingual category tree.',
    meta: 'Catalog structure',
  },
  {
    to: '/products',
    icon: PackageIcon,
    tone: 'icon-tile-amber',
    title: 'Products',
    description: 'Manage products per category, including image uploads.',
    meta: 'Merchandising',
  },
  {
    to: '/orders',
    icon: ClipboardIcon,
    tone: '',
    title: 'Orders',
    description: 'Inspect orders, follow live updates, and change statuses.',
    meta: 'Fulfillment',
  },
];

export default function AdminDashboardPage() {
  return (
    <div className="dashboard">
      <PageHeader
        eyebrow="Admin workspace"
        title="Operations dashboard"
        description="Manage the catalog and fulfillment flow from one testing console."
        actions={<Badge kind="ok">Admin session</Badge>}
      />

      <div className="quick-grid">
        {areas.map(({ to, icon: IconComponent, tone, title, description, meta }) => (
          <Link className="card dash-card" to={to} key={to}>
            <span className={`icon-tile ${tone}`.trim()}><IconComponent size={20} /></span>
            <span className="dash-meta">{meta}</span>
            <h2>{title}</h2>
            <p className="muted">{description}</p>
            <span className="text-link">Open area <ArrowUpRightIcon size={15} /></span>
          </Link>
        ))}
      </div>

      <div className="grid grid-2">
        <section className="card">
          <span className="eyebrow"><RadioIcon size={14} /> Realtime</span>
          <h2>Order feed</h2>
          <p className="muted">
            The admin app subscribes to <span className="mono">admin.orders</span>.
            New orders and status changes stream into the notification feed and refresh the queue.
          </p>
          <ul className="feature-list">
            <li><CheckIcon size={15} /> New order events announce in the queue</li>
            <li><CheckIcon size={15} /> Status updates refresh the active detail view</li>
            <li><CheckIcon size={15} /> Keep Reverb and the queue worker running</li>
          </ul>
        </section>

        <section className="card">
          <span className="eyebrow"><ShieldIcon size={14} /> Checklist</span>
          <h2>Before testing</h2>
          <ol className="mini-steps">
            <li><span>1</span> Sign in as admin in this app.</li>
            <li><span>2</span> Sign in as a customer in the storefront app.</li>
            <li><span>3</span> Create an order, then update it here.</li>
          </ol>
          <div className="aside-note">
            <ZapIcon size={16} />
            <span>Use the orders area to confirm both sides update without a reload.</span>
          </div>
        </section>
      </div>
    </div>
  );
}

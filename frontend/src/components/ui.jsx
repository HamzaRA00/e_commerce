import {
  AlertTriangleIcon,
  CheckCircleIcon,
  InfoIcon,
  PackageIcon,
  XCircleIcon,
} from './icons.jsx';

const alertIcons = {
  info: InfoIcon,
  success: CheckCircleIcon,
  error: XCircleIcon,
  warn: AlertTriangleIcon,
};

export function Alert({ kind = 'info', children, title }) {
  if (!children) return null;
  const IconComponent = alertIcons[kind] || InfoIcon;
  return (
    <div
      className={`alert ${kind}`}
      role={kind === 'error' || kind === 'warn' ? 'alert' : 'status'}
      aria-live={kind === 'error' || kind === 'warn' ? 'assertive' : 'polite'}
    >
      <span className="alert-icon"><IconComponent size={18} /></span>
      <div className="alert-body">
        {title ? <strong className="alert-title">{title}</strong> : null}
        <div>{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, htmlFor, help, children }) {
  return (
    <div className="field">
      {label ? <label htmlFor={htmlFor}>{label}</label> : null}
      {children}
      {help ? <div className="help">{help}</div> : null}
    </div>
  );
}

export function Badge({ kind = '', children }) {
  return (
    <span className={`badge ${kind}`.trim()}>
      <span className="badge-dot" aria-hidden="true" />
      {children}
    </span>
  );
}

export function Spinner({ label = 'Loading...' }) {
  return (
    <div className="spinner" role="status" aria-live="polite">
      <span className="spinner-ring" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function EmptyState({ title = 'Nothing here yet', children, icon: IconComponent = PackageIcon }) {
  return (
    <div className="empty-state">
      <span className="empty-icon"><IconComponent size={22} /></span>
      <strong>{title}</strong>
      {children ? <p className="small muted">{children}</p> : null}
    </div>
  );
}

export function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <div className="page-header">
      <div>
        {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
        <h1>{title}</h1>
        {description ? <p className="muted">{description}</p> : null}
      </div>
      {actions ? <div className="page-actions">{actions}</div> : null}
    </div>
  );
}

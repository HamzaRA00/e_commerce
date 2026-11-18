export function Alert({ kind = 'info', children, title }) {
  if (!children) return null;
  return (
    <div className={`alert ${kind}`} role={kind === 'error' ? 'alert' : 'status'}>
      {title ? <strong>{title}: </strong> : null}
      {children}
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
  return <span className={`badge ${kind}`.trim()}>{children}</span>;
}

export function Spinner({ label = 'Loading...' }) {
  return <div className="muted small" aria-live="polite">{label}</div>;
}

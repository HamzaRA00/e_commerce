import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { BellIcon, CheckCircleIcon, ClockIcon, ReceiptIcon, XIcon } from './icons.jsx';

function relativeTime(timestamp) {
  const seconds = Math.max(1, Math.round((Date.now() - timestamp) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function NotificationBell({ notifications, unreadCount, onOpen, onClear }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    function onPointerDown(event) {
      if (!containerRef.current?.contains(event.target)) setOpen(false);
    }

    function onKeyDown(event) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  function toggle() {
    setOpen((current) => {
      const next = !current;
      if (next) onOpen?.();
      return next;
    });
  }

  return (
    <div className="notif" ref={containerRef}>
      <button
        type="button"
        className="icon-button notif-button"
        aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        aria-expanded={open}
        onClick={toggle}
      >
        <BellIcon size={18} />
        {unreadCount > 0 && <span className="notif-count">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>

      {open && (
        <div className="notif-panel" role="dialog" aria-label="Order notifications">
          <div className="notif-head">
            <div>
              <strong>Order updates</strong>
              <span>{notifications.length ? `${notifications.length} recent` : 'No activity yet'}</span>
            </div>
            {notifications.length ? (
              <button type="button" className="notif-clear" onClick={onClear}>Clear</button>
            ) : null}
          </div>

          <div className="notif-list">
            {notifications.length ? notifications.map((item) => {
              const content = (
                <>
                  <span className="notif-icon">
                    {item.kind === 'created' ? <ReceiptIcon size={16} /> : <CheckCircleIcon size={16} />}
                  </span>
                  <span className="notif-copy">
                    <strong>{item.title}</strong>
                    <span>{item.body}</span>
                    <small><ClockIcon size={12} /> {relativeTime(item.createdAt)}</small>
                  </span>
                </>
              );

              return item.orderId ? (
                <Link
                  className="notif-item"
                  key={item.id}
                  to={`/orders/${item.orderId}`}
                  onClick={() => setOpen(false)}
                >
                  {content}
                </Link>
              ) : (
                <div className="notif-item" key={item.id}>{content}</div>
              );
            }) : (
              <div className="notif-empty">
                <BellIcon size={20} />
                <strong>All quiet</strong>
                <span>Order updates will appear here.</span>
              </div>
            )}
          </div>

          <Link className="notif-footer" to="/orders" onClick={() => setOpen(false)}>
            View all orders
          </Link>
        </div>
      )}
    </div>
  );
}

export function RealtimeToaster({ toasts, onDismiss }) {
  if (!toasts.length) return null;

  return (
    <div className="toast-stack" aria-live="polite" aria-relevant="additions">
      {toasts.map((toast) => (
        <div className="toast" role="status" key={toast.id}>
          <span className="toast-icon">
            {toast.kind === 'created' ? <ReceiptIcon size={17} /> : <CheckCircleIcon size={17} />}
          </span>
          <div className="toast-copy">
            <strong>{toast.title}</strong>
            <span>{toast.body}</span>
          </div>
          <button
            type="button"
            className="toast-close"
            aria-label={`Dismiss ${toast.title}`}
            onClick={() => onDismiss(toast.id)}
          >
            <XIcon size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../auth/AuthContext.jsx';
import { usePrivateChannel, useRealtimeConnection } from './usePrivateChannel.js';

const AdminRealtimeContext = createContext(null);

function makeId() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function AdminRealtimeProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const connectionState = useRealtimeConnection();
  const [notifications, setNotifications] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [lastEvent, setLastEvent] = useState(null);
  const [revision, setRevision] = useState(0);
  const timers = useRef(new Map());

  const dismissToast = useCallback((id) => {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const pushEvent = useCallback((kind, event) => {
    const orderId = event?.order_id;
    const statusLabel = event?.status_label || event?.status || 'updated';
    const notification = {
      id: makeId(),
      kind,
      orderId,
      status: event?.status,
      title: kind === 'created' ? `New order #${orderId}` : `Order #${orderId} updated`,
      body: kind === 'created' ? 'A customer placed a new order.' : `Status changed to ${statusLabel}.`,
      createdAt: Date.now(),
      read: false,
    };

    setNotifications((current) => [notification, ...current].slice(0, 40));
    setToasts((current) => [notification, ...current].slice(0, 4));
    setLastEvent({ ...event, kind, receivedAt: Date.now() });
    setRevision((current) => current + 1);

    const timer = setTimeout(() => dismissToast(notification.id), 7000);
    timers.current.set(notification.id, timer);
  }, [dismissToast]);

  usePrivateChannel('admin.orders', {
    '.order.created': (event) => pushEvent('created', event),
    '.order.status.updated': (event) => pushEvent('status', event),
  }, isAuthenticated);

  useEffect(() => () => {
    timers.current.forEach((timer) => clearTimeout(timer));
    timers.current.clear();
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((current) => current.map((item) => ({ ...item, read: true })));
  }, []);

  const clearNotifications = useCallback(() => setNotifications([]), []);

  const value = useMemo(() => ({
    connectionState,
    notifications,
    toasts,
    unreadCount: notifications.filter((item) => !item.read).length,
    lastEvent,
    revision,
    markAllRead,
    clearNotifications,
    dismissToast,
  }), [connectionState, notifications, toasts, lastEvent, revision, markAllRead, clearNotifications, dismissToast]);

  return <AdminRealtimeContext.Provider value={value}>{children}</AdminRealtimeContext.Provider>;
}

export function useAdminRealtime() {
  const context = useContext(AdminRealtimeContext);
  if (!context) throw new Error('useAdminRealtime must be used within AdminRealtimeProvider');
  return context;
}

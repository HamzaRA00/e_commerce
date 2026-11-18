import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../auth/AuthContext.jsx';
import { usePrivateChannel, useRealtimeConnection } from './usePrivateChannel.js';

const CustomerRealtimeContext = createContext(null);

function makeId(prefix) {
  const random = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${random}`;
}

export function CustomerRealtimeProvider({ children }) {
  const { auth, isUser } = useAuth();
  const connectionState = useRealtimeConnection();
  const userId = auth?.userId;
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

  const pushEvent = useCallback((type, event) => {
    const orderId = event?.order_id;
    const statusLabel = event?.status_label || event?.status || 'updated';
    const isCreated = type === 'created';
    const notification = {
      id: makeId('order'),
      kind: type,
      orderId,
      status: event?.status,
      title: isCreated ? `New order #${orderId}` : `Order #${orderId} updated`,
      body: isCreated ? 'The order was created successfully.' : `Status is now ${statusLabel}.`,
      createdAt: Date.now(),
      read: false,
    };

    setNotifications((current) => [notification, ...current].slice(0, 25));
    setToasts((current) => [notification, ...current].slice(0, 4));
    setLastEvent({ ...event, kind: type, receivedAt: Date.now() });
    setRevision((current) => current + 1);

    const timer = setTimeout(() => dismissToast(notification.id), 6500);
    timers.current.set(notification.id, timer);
  }, [dismissToast]);

  usePrivateChannel(userId ? `user.${userId}` : null, {
    '.order.created': (event) => pushEvent('created', event),
    '.order.status.updated': (event) => pushEvent('status', event),
  }, isUser && !!userId);

  useEffect(() => {
    setNotifications([]);
    setToasts([]);
    setLastEvent(null);
    setRevision(0);
    timers.current.forEach((timer) => clearTimeout(timer));
    timers.current.clear();
  }, [userId]);

  useEffect(() => () => {
    timers.current.forEach((timer) => clearTimeout(timer));
    timers.current.clear();
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((current) => current.map((item) => ({ ...item, read: true })));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

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

  return (
    <CustomerRealtimeContext.Provider value={value}>
      {children}
    </CustomerRealtimeContext.Provider>
  );
}

export function useCustomerRealtime() {
  const context = useContext(CustomerRealtimeContext);
  if (!context) throw new Error('useCustomerRealtime must be used within CustomerRealtimeProvider');
  return context;
}

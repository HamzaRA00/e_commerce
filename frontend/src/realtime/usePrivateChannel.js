import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../auth/AuthContext.jsx';
import { getEcho } from './echo.js';

export function usePrivateChannel(channelName, listeners, enabled = true) {
  const { auth } = useAuth();
  const listenersRef = useRef(listeners);
  listenersRef.current = listeners;

  const accessToken = auth?.accessToken;
  const device = auth?.device;
  const role = auth?.role;

  useEffect(() => {
    if (!enabled || !channelName || !accessToken) return undefined;

    const echo = getEcho();
    if (!echo) return undefined;

    const channel = echo.private(channelName);
    const registered = Object.keys(listenersRef.current || {}).map((event) => {
      const handler = (payload) => listenersRef.current?.[event]?.(payload);
      channel.listen(event, handler);
      return [event, handler];
    });

    return () => {
      registered.forEach(([event, handler]) => channel.stopListening(event, handler));
      echo.leave(channelName);
    };
  }, [channelName, enabled, accessToken, device, role]);
}

export function useRealtimeConnection() {
  const { auth } = useAuth();
  const [state, setState] = useState('disconnected');

  useEffect(() => {
    if (!auth?.accessToken) {
      setState('disconnected');
      return undefined;
    }

    const connection = getEcho()?.connector?.pusher?.connection;
    if (!connection) {
      setState('unavailable');
      return undefined;
    }

    const update = () => setState(connection.state);
    update();
    connection.bind('state_change', update);

    return () => {
      connection.unbind('state_change', update);
    };
  }, [auth?.accessToken]);

  return state;
}

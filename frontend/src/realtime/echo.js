import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { getStoredAuth } from '../auth/storage.js';

let echo = null;

function broadcastAuthUrl() {
  return new URL('/api/broadcasting/auth', window.location.origin).toString();
}

function buildHeaders() {
  const auth = getStoredAuth();
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    lang: 'en',
  };

  if (auth?.device) headers.device = auth.device;
  if (auth?.accessToken) headers.Authorization = `Bearer ${auth.accessToken}`;

  return headers;
}

export function getEcho() {
  if (echo) return echo;

  const key = import.meta.env.VITE_REVERB_APP_KEY;
  if (!key) {
    console.warn('Realtime disabled: VITE_REVERB_APP_KEY is not configured.');
    return null;
  }

  window.Pusher = Pusher;

  echo = new Echo({
    broadcaster: 'reverb',
    key,
    wsHost: import.meta.env.VITE_REVERB_HOST || window.location.hostname,
    wsPort: Number(import.meta.env.VITE_REVERB_PORT || 80),
    wssPort: Number(import.meta.env.VITE_REVERB_PORT || 443),
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME || 'http') === 'https',
    enabledTransports: ['ws', 'wss'],
    disableStats: true,
    authorizer: (channel) => ({
      authorize: (socketId, callback) => {
        fetch(broadcastAuthUrl(), {
          method: 'POST',
          headers: buildHeaders(),
          body: JSON.stringify({
            socket_id: socketId,
            channel_name: channel.name,
          }),
        })
          .then(async (response) => {
            if (!response.ok) {
              throw new Error(`Broadcast auth failed with status ${response.status}`);
            }

            return response.json();
          })
          .then((data) => callback(null, data))
          .catch((error) => callback(error, null));
      },
    }),
  });

  return echo;
}

export function resetEcho() {
  if (!echo) return;

  try {
    echo.disconnect();
  } catch {
    // Ignore disconnect errors while clearing an old session.
  }

  echo = null;
}

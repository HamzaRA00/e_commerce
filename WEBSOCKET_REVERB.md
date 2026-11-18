# WebSocket and Reverb in the E-Commerce Project

This document explains:

- what WebSocket is;
- what Laravel Reverb is;
- what we implemented in this project;
- where the realtime system is wired in;
- how customer and admin sessions receive order updates;
- what the implementation helped us achieve;
- how to run, verify, secure, and troubleshoot it.

It complements the shorter operational note in `WEBSOCKET.md`.

The report was produced from the current codebase and the graphify knowledge graph in
`graphify-out/graph.json`.

---

## 1. Executive summary

The project uses **WebSocket** for realtime order updates and **Laravel Reverb** as the
WebSocket server.

The flow is:

```text
Laravel order event
  -> RabbitMQ job
  -> queue-worker
  -> Reverb
  -> customer SPA / admin SPA
```

The customer and admin React applications use **Laravel Echo** with **pusher-js** to
connect to Reverb. They subscribe to private channels, authenticate those subscriptions
through Laravel, and react to order events without polling.

The realtime feature covers:

- new order created;
- order status updated;
- customer notification bell and toast;
- customer order list refresh;
- customer order detail live status update;
- admin live order queue refresh;
- admin notification feed and toast;
- admin realtime connection indicator.

The admin and customer applications are separate SPAs with separate storage keys, but they
share the same Laravel API and the same Reverb server.

---

## 2. How graphify was used for this report

Graphify was queried against the updated graph:

```bash
$(cat graphify-out/.graphify_python) -m graphify query \
  "WebSocket Reverb realtime private channels Echo customer admin order notifications" \
  --budget 3000
```

The traversal started from:

- `Laravel Reverb WebSocket Broadcasting`;
- `reverb.php`;
- `channels.php`;
- `CustomerRealtimeContext.jsx`;
- `admin/src/realtime/echo.js`;
- `Private Channel admin.orders`;
- `OrderCreated Event`;
- `OrderStatusUpdated Event`;
- `RealtimeContractTest`.

It found **277 related nodes**. At the requested budget, graphify returned a 90-node slice
and noted that 187 nodes were cut. The important graph evidence was:

```text
CustomerRealtimeProvider() --calls--> usePrivateChannel()
CustomerRealtimeProvider() --calls--> useRealtimeConnection()
CustomerRealtimeProvider() --calls--> useAuth()
frontend/src/main.jsx --imports--> CustomerRealtimeProvider()
```

Graphify also found this bridge from the admin realtime code to the Reverb service:

```text
AdminRealtimeContext <--contains-- AdminRealtimeContext.jsx
AdminRealtimeContext.jsx --implements--> Private Channel admin.orders
Private Channel admin.orders <--references-- Laravel Reverb WebSocket Broadcasting
Laravel Reverb WebSocket Broadcasting <--implements-- Reverb WebSocket Service
```

This matches the actual implementation: the frontend providers own the subscriptions,
the backend defines and authorizes the private channels, and the Docker Compose Reverb
service runs the WebSocket server.

---

## 3. What WebSocket is

WebSocket is a communication protocol that provides a **persistent, full-duplex**
connection between a client and a server.

A normal HTTP request is short-lived:

```text
client sends request
server sends response
connection is done
```

A WebSocket connection starts with an HTTP request that asks to upgrade the connection.
After a successful handshake, the same TCP connection stays open and both sides can send
messages at any time:

```text
client <====== persistent connection ======> server
```

### 3.1 Core WebSocket characteristics

| Characteristic | Meaning |
|---|---|
| Persistent connection | The client and server keep the connection open instead of reconnecting for every message. |
| Full duplex | Both sides can send messages independently. |
| Low overhead | After the handshake, messages use a lightweight frame format rather than a full HTTP request and response. |
| Stateful | The server knows which connections are active. |
| Event-driven | The client can react immediately when the server pushes an event. |
| Browser-native | Browsers expose a `WebSocket` API; this project uses Echo and pusher-js rather than raw WebSocket code. |
| Works through HTTP upgrade | Proxies, load balancers, and firewalls must allow the `Upgrade` header. |
| Supports TLS | `wss://` is WebSocket over TLS and should be used in production. |

### 3.2 WebSocket compared with polling

Without WebSocket, a realtime UI usually polls:

```text
every N seconds:
  client -> GET /orders
  server -> full response
```

That creates unnecessary requests and still has a delay between the event and the next
poll.

With WebSocket:

```text
order changes
  server -> push event
  client updates immediately
```

The customer and admin applications still have manual refresh buttons. WebSocket is the
fast path; REST remains the source of truth and the fallback.

### 3.3 What WebSocket does not do

WebSocket is a transport, not a message queue and not a persistence layer.

- If a browser is offline, it does not receive an event.
- A WebSocket connection does not replay old messages.
- A WebSocket server does not automatically authorize private channels.
- A WebSocket server does not replace RabbitMQ or the database.

This project separates those concerns:

| Concern | Component |
|---|---|
| Durable background work | RabbitMQ |
| Connection and message push | Reverb |
| Browser client | Echo + pusher-js |
| Channel authorization | Laravel `/api/broadcasting/auth` and `routes/channels.php` |
| Source of truth | MySQL through the REST API |

### 3.4 Common WebSocket use cases

WebSocket is commonly used for:

- live notifications;
- chat and messaging;
- collaborative editing;
- live dashboards;
- multiplayer applications;
- financial or sports tickers;
- order and delivery tracking;
- presence systems;
- realtime operational consoles.

This project uses it for order notifications and the admin order queue.

---

## 4. What Laravel Reverb is

Laravel Reverb is Laravel's first-party WebSocket server.

It is a self-hosted alternative to hosted services such as Pusher or Ably. It speaks the
**Pusher protocol**, which is why the browser client uses `pusher-js` underneath Laravel
Echo.

### 4.1 The three pieces

| Piece | Role in this project |
|---|---|
| Reverb | The WebSocket server. It accepts connections and pushes messages to subscribed clients. |
| Laravel Echo | The client-side abstraction that connects to Reverb and manages channels and events. |
| pusher-js | The underlying JavaScript client used by Echo for the Pusher protocol. |

The backend broadcasts through Laravel's broadcasting system:

```php
BROADCAST_CONNECTION=reverb
```

The frontend connects through Echo:

```js
new Echo({
  broadcaster: 'reverb',
  // ...
});
```

### 4.2 Reverb application credentials

Reverb uses an application identity made of:

| Credential | Purpose | Where it lives |
|---|---|---|
| App ID | Identifies the Reverb application. | Backend environment. |
| App key | Public key used by the browser client. | Backend and Vite environment. |
| App secret | Private key used by the backend to sign broadcasts. | Backend only. |

The app key is intentionally visible to browser clients. The app secret must never be
shipped to the frontend.

### 4.3 Reverb channels

Reverb supports public, private, and presence channels. This project uses **private
channels only**.

A private channel subscription is not authorized just because the browser knows the
channel name. The client must ask Laravel for an authorization signature. Laravel checks
the Sanctum user, the device, and the channel callback, then returns the signature.

That is the purpose of:

```text
POST /api/broadcasting/auth
```

### 4.4 Reverb vs RabbitMQ

These are different layers and both are required for the full pipeline:

```text
Laravel event
  -> RabbitMQ
  -> queue-worker
  -> Reverb
  -> browser
```

RabbitMQ stores the background broadcast job. Reverb owns the WebSocket connection and
pushes the final event to subscribed browsers. See `RABBITMQ.md` for the queue side.

---

## 5. Architecture in this project

### 5.1 High-level architecture

```text
Customer SPA :5173 ── POST /api/broadcasting/auth ─┐
Admin SPA    :5174 ── POST /api/broadcasting/auth ─┤
                                                   ├── Laravel API :8000
                                                   └── Reverb :8081 host / :8080 container
                                                          ▲
                                           queue-worker ───┘
                                           RabbitMQ queue: default
```

The customer and admin apps are separate origins:

| App | URL | Session storage key |
|---|---|---|
| Customer storefront | `http://localhost:5173` | `ecom_test_auth_v1` |
| Admin console | `http://localhost:5174` | `ecom_admin_auth_v1` |

Separate origins and storage keys allow a customer and an admin to stay signed in at the
same time in the same browser.

### 5.2 Ports

| Port | Purpose |
|---|---|
| `5173` | Customer Vite app. |
| `5174` | Admin Vite app. |
| `8000` | Laravel API through nginx. |
| `8080` | Reverb inside the container. |
| `8081` | Reverb exposed to the host and browser. |
| `15672` | RabbitMQ management UI. |

The backend uses:

```dotenv
REVERB_HOST=reverb
REVERB_PORT=8080
```

The browser uses:

```dotenv
VITE_REVERB_HOST=localhost
VITE_REVERB_PORT=8081
```

Those two configurations are different on purpose. The backend talks to the Reverb
container over the Docker network on port `8080`; the browser talks to the host-mapped port
`8081`.

### 5.3 Backend-to-frontend flow

```text
1. Customer creates an order.
2. UserOrderController commits the order and dispatches OrderCreated.
3. OrderCreated is queued through RabbitMQ.
4. queue-worker consumes the broadcast job.
5. Laravel broadcasts to Reverb on:
     - private-user.{userId}
     - private-admin.orders
6. Reverb delivers to connected Echo clients.
7. Customer and admin providers update notifications, toasts, and page revisions.
```

Status changes follow the same path with `OrderStatusUpdated`, which also broadcasts on
`private-orders.{orderId}`.

---

## 6. What we implemented

The implementation has six layers.

### 6.1 Separate customer and admin applications

- Customer app: `frontend/`.
- Admin app: `admin/`.
- Separate Vite dev servers on `5173` and `5174`.
- Separate localStorage keys.
- Separate auth contexts.
- Shared Laravel API.
- Shared Reverb server.

The admin application is not a route inside the customer application. It is a separate
SPA with its own shell, auth provider, realtime provider, and pages.

### 6.2 Reverb server and environment

- Reverb container in `docker-compose.yml`.
- `php artisan reverb:start --host=0.0.0.0 --port=8080`.
- Host port mapping `8081:8080`.
- `BROADCAST_CONNECTION=reverb`.
- Reverb app ID, key, and secret in the Docker environment.
- Vite `VITE_REVERB_*` variables for the browser.

### 6.3 Backend channels and authorization

`routes/channels.php` defines:

| Channel | Who can subscribe | What it is used for |
|---|---|---|
| `orders.{orderId}` | A `user` role user who owns that order. | Order-specific customer updates. |
| `user.{userId}` | A `user` role user whose ID matches the channel. | Customer-wide notifications. |
| `admin.orders` | Any `admin` role user. | All order activity for the admin console. |

`bootstrap/app.php` registers broadcasting under the `api` prefix with:

```php
'auth:sanctum',
'check.device',
```

That means a channel authorization request must have a valid Sanctum access token and a
matching `device` header.

### 6.4 Broadcast events

`OrderCreated` implements:

```php
ShouldBroadcast
ShouldDispatchAfterCommit
```

It broadcasts on:

```text
private-user.{userId}
private-admin.orders
```

`OrderStatusUpdated` implements the same interfaces and broadcasts on:

```text
private-orders.{orderId}
private-user.{userId}
private-admin.orders
```

Both use `ShouldDispatchAfterCommit` so the event is not published before the database
transaction commits.

### 6.5 Frontend Echo client

`frontend/src/realtime/echo.js` and `admin/src/realtime/echo.js` contain the same client
pattern:

- create one Echo instance per app;
- use the `reverb` broadcaster;
- enable only `ws` and `wss` transports;
- disable Pusher stats;
- configure a custom authorizer;
- send the Sanctum Bearer token and device header to
  `/api/broadcasting/auth`;
- reset and disconnect the client on logout.

### 6.6 Realtime providers and UI

Customer:

- `CustomerRealtimeProvider` wraps the app at the root.
- It subscribes to `user.{userId}` only for authenticated customers.
- It maintains notifications, toasts, last event, and a revision counter.
- `AppLayout` renders the notification bell and toaster.
- `OrdersPage` refreshes after a debounced revision change.
- `OrderDetailPage` patches the open order from the last status event.

Admin:

- `AdminRealtimeProvider` wraps the protected admin shell.
- It subscribes to `admin.orders` for authenticated admins.
- It maintains notifications, toasts, last event, and a revision counter.
- `AppLayout` renders a Live/Connecting/Offline connection pill.
- `AdminOrdersPage` refreshes the queue and open detail after a debounced revision change.

---

## 7. Where WebSocket and Reverb are used

At a glance:

| Area | File | What it does |
|---|---|---|
| Reverb package | `composer.json:13` | Adds Laravel Reverb. |
| Echo package | `frontend/package.json:13` | Adds `laravel-echo`. |
| Pusher client | `frontend/package.json:14` | Adds `pusher-js`. |
| Admin Echo package | `admin/package.json:13` | Adds `laravel-echo`. |
| Admin Pusher client | `admin/package.json:14` | Adds `pusher-js`. |
| Broadcasting config | `config/broadcasting.php:33` | Defines the `reverb` broadcast connection. |
| Reverb config | `config/reverb.php:31` | Defines the Reverb server. |
| Reverb app | `config/reverb.php:70` | Defines app credentials and limits. |
| Reverb service | `docker-compose.yml:134` | Runs the Reverb server. |
| Reverb port | `docker-compose.yml:140` | Maps host `8081` to container `8080`. |
| Backend broadcast env | `.env.docker:27` | Sets `BROADCAST_CONNECTION=reverb`. |
| Reverb server env | `.env.docker:29` | Sets app ID, key, secret, host, port, scheme. |
| Frontend Reverb env | `.env.docker:43` | Sets `VITE_REVERB_*` for the browser. |
| Broadcasting registration | `bootstrap/app.php:34` | Registers `/api/broadcasting/auth` with Sanctum and device middleware. |
| Channel authorization | `routes/channels.php:14` | Authorizes `orders.{orderId}`. |
| Customer channel | `routes/channels.php:31` | Authorizes `user.{userId}`. |
| Admin channel | `routes/channels.php:45` | Authorizes `admin.orders`. |
| Order created event | `app/Events/OrderCreated.php:11` | Broadcasts new-order events. |
| Order status event | `app/Events/OrderStatusUpdated.php:12` | Broadcasts status-change events. |
| Customer Echo client | `frontend/src/realtime/echo.js:25` | Creates the customer Echo instance. |
| Customer channel hook | `frontend/src/realtime/usePrivateChannel.js:5` | Subscribes and cleans up private channels. |
| Customer provider | `frontend/src/realtime/CustomerRealtimeContext.jsx:12` | Owns customer realtime state. |
| Customer mount | `frontend/src/main.jsx` | Wraps the customer app in the provider. |
| Customer orders list | `frontend/src/pages/OrdersPage.jsx:33` | Debounced refresh after events. |
| Customer order detail | `frontend/src/pages/OrderDetailPage.jsx:30` | Live status patch. |
| Admin Echo client | `admin/src/realtime/echo.js:25` | Creates the admin Echo instance. |
| Admin channel hook | `admin/src/realtime/usePrivateChannel.js:5` | Subscribes and cleans up the admin channel. |
| Admin provider | `admin/src/realtime/AdminRealtimeContext.jsx:11` | Owns admin realtime state. |
| Admin protected shell | `admin/src/App.jsx` | Wraps protected routes in the provider. |
| Admin orders page | `admin/src/pages/AdminOrdersPage.jsx:76` | Debounced queue and detail refresh. |
| Admin connection pill | `admin/src/layouts/AppLayout.jsx:79` | Displays Live/Connecting/Offline. |
| Channel test | `tests/Unit/RealtimeContractTest.php:11` | Verifies channel names and broadcast names. |
| Existing docs | `WEBSOCKET.md` | Operational realtime documentation. |

---

## 8. Channels and event contract

### 8.1 Channel map

| Channel | Protocol name at Reverb | Authorized by | Subscribed by |
|---|---|---|---|
| `user.{userId}` | `private-user.{userId}` | User role and matching user ID | Customer provider |
| `admin.orders` | `private-admin.orders` | Admin role | Admin provider |
| `orders.{orderId}` | `private-orders.{orderId}` | User role and order ownership | No current frontend subscription |

The `orders.{orderId}` channel is still part of the backend contract and is covered by the
realtime test. The customer UI currently listens on `user.{userId}` for all customer
notifications, which avoids opening a separate connection subscription for every open
order.

### 8.2 Event contract

| Event | `broadcastAs()` | Channels | Payload |
|---|---|---|---|
| `OrderCreated` | `order.created` | `user.{userId}`, `admin.orders` | `order_id`, `user_id`, `status` |
| `OrderStatusUpdated` | `order.status.updated` | `orders.{orderId}`, `user.{userId}`, `admin.orders` | `order_id`, `user_id`, `status`, `status_label` |

The frontend listens with a leading dot:

```js
channel.listen('.order.created', handler);
channel.listen('.order.status.updated', handler);
```

The leading dot tells Echo that this is a custom broadcast name, not an event class name.

### 8.3 Authorization behavior

`orders.{orderId}`:

```php
$user->hasRole(RoleEnum::USER->value)
    && Order::query()
        ->whereKey($orderId)
        ->where('user_id', $user->id)
        ->exists();
```

`user.{userId}`:

```php
$user->hasRole(RoleEnum::USER->value)
    && (int) $user->id === $userId;
```

`admin.orders`:

```php
$user->hasRole(RoleEnum::ADMIN->value);
```

This prevents a customer from subscribing to another customer's private user channel and
prevents a non-admin from subscribing to the admin order feed.

### 8.4 Device binding

The broadcast auth route includes `check.device`.

The middleware verifies that:

- the current access token is a device token;
- the token has a `device_id`;
- the `device` request header matches the stored device identifier.

The frontend Echo authorizer sends:

```http
Authorization: Bearer <access-token>
device: <device-id>
```

If either is missing or stale, the channel authorization fails.

---

## 9. Connection lifecycle

### 9.1 Login and subscription

```text
Customer or admin signs in
  -> API returns access token, refresh token, device, and user_id
  -> AuthContext stores the session
  -> Realtime provider mounts
  -> Customer provider requires role user and a non-null user_id
  -> Admin provider requires admin authentication
  -> getEcho() creates the Echo singleton
  -> pusher-js opens the WebSocket connection to Reverb
  -> echo.private(channelName) requests authorization
  -> POST /api/broadcasting/auth with Bearer token and device header
  -> Laravel verifies user, device, and channel callback
  -> Reverb accepts the subscription
  -> events can now arrive
```

The customer provider subscribes to:

```js
user.{userId}
```

The admin provider subscribes to:

```js
admin.orders
```

### 9.2 Why `user_id` matters

The customer channel name is derived from `auth.userId`:

```js
usePrivateChannel(userId ? `user.${userId}` : null, ...)
```

If the login or refresh response does not include `user_id`, the customer cannot build the
channel name and will not subscribe. Older sessions created before `user_id` was added need
a fresh login or refresh.

### 9.3 Logout and cleanup

`AuthContext` calls `resetEcho()` when the session is cleared:

```js
resetEcho();
setStoredAuth(null);
setAuthState(null);
```

`resetEcho()` disconnects the Echo client and clears the module-level singleton. A new
login creates a fresh client with the new token and device.

`usePrivateChannel` also cleans up when its dependencies change:

```js
registered.forEach(([event, handler]) => {
  channel.stopListening(event, handler);
});

echo.leave(channelName);
```

This prevents duplicate listeners when the token, device, or user changes.

### 9.4 Connection state

`useRealtimeConnection()` reads the underlying Pusher connection:

```js
const connection = getEcho()?.connector?.pusher?.connection;
```

It subscribes to `state_change` and exposes states such as:

- `connecting`;
- `connected`;
- `disconnected`;
- `failed`;
- `unavailable` when Echo or the app key is missing.

The admin top bar maps these to user-facing labels:

| State | Label |
|---|---|
| `connected` | Live |
| `connecting` | Connecting |
| `disconnected` | Offline |
| `unavailable` | Realtime off |
| `failed` | Realtime failed |

The customer orders page shows a Live / state badge as well.

---

## 10. What happens on each event

### 10.1 Customer receives `order.created`

The customer provider is subscribed to `user.{userId}`.

`pushEvent('created', event)`:

1. Creates a notification with title `New order #<id>`.
2. Adds it to the notification list.
3. Adds it to the toast stack.
4. Stores it as `lastEvent`.
5. Increments `revision`.
6. Auto-dismisses the toast after 6.5 seconds.

`OrdersPage` watches `revision`, waits 250 ms, then reloads the order list. The debounce
prevents a burst of events from causing a burst of API calls.

`OrderDetailPage` listens to `lastEvent`. If the event is a status event for the current
order, it patches the local order object immediately without a full reload.

### 10.2 Admin receives `order.created`

The admin provider is subscribed to `admin.orders`.

`pushEvent('created', event)`:

1. Creates a notification with title `New order #<id>`.
2. Adds it to the list and toast stack.
3. Stores `lastEvent`.
4. Increments `revision`.
5. Auto-dismisses the toast after 7 seconds.

`AdminOrdersPage` watches `revision`, waits 250 ms, then reloads the order queue. If a
detail panel is open, it reloads that order as well.

### 10.3 Status update fan-out

`OrderStatusUpdated` broadcasts to:

```text
orders.{orderId}
user.{userId}
admin.orders
```

The customer provider listens on `user.{userId}` and updates notifications and the open
detail page.

The admin provider listens on `admin.orders` and refreshes the queue and open detail.

The order-specific channel is available for future consumers that want to subscribe to one
order only.

### 10.4 UI state limits

| Provider | Notifications kept | Toasts kept | Toast duration |
|---|---|---|---|
| Customer | 25 | 4 | 6.5 seconds |
| Admin | 40 | 4 | 7 seconds |

Notifications are client-side state only. They are not stored in the database and are lost
on a full page reload.

---

## 11. What it helped with

WebSocket and Reverb helped this project in the following concrete ways.

### 11.1 Immediate updates instead of polling

The customer sees a new-order or status notification immediately after the event is
processed. The admin sees a new order without refreshing the order queue manually.

### 11.2 One shared realtime pipeline for both applications

Customer and admin both use the same Laravel events, the same Reverb server, and the same
Echo pattern. This avoids two separate realtime implementations.

### 11.3 Separate admin and customer sessions

The admin app has its own origin and localStorage key. A browser can be signed in as a
customer on `5173` and as an admin on `5174` at the same time.

### 11.4 Fewer duplicate subscriptions

Each app has one realtime provider:

- customer provider around the whole app;
- admin provider around the protected shell.

Pages consume shared state through `useCustomerRealtime()` or `useAdminRealtime()` instead
of each page opening its own channel subscription.

### 11.5 Better user feedback

The notification bell, unread count, toasts, last-event text, and connection pill make the
realtime system visible to users. They can see whether the app is Live, Connecting, or
Offline.

### 11.6 Graceful fallback

The REST API remains the source of truth. If Reverb or the queue worker is unavailable,
the pages still load and the manual Refresh buttons still work. Realtime is an enhancement,
not the only data path.

### 11.7 Queue-backed delivery

Order events are queued through RabbitMQ, so the HTTP request does not wait for Reverb.
The queue worker publishes to Reverb when it processes the broadcast job. This means the
order request can still succeed if Reverb is temporarily unavailable.

### 11.8 What it did not do

There are no measured latency or throughput numbers in the repository. The benefits above
are architectural and user-experience benefits, not benchmark results.

WebSocket also does not guarantee delivery to an offline browser. The REST refresh path
remains necessary.

---

## 12. Frontend implementation details

### 12.1 Echo configuration

Both apps use the same configuration in `echo.js`:

```js
new Echo({
  broadcaster: 'reverb',
  key: import.meta.env.VITE_REVERB_APP_KEY,
  wsHost: import.meta.env.VITE_REVERB_HOST || window.location.hostname,
  wsPort: Number(import.meta.env.VITE_REVERB_PORT || 80),
  wssPort: Number(import.meta.env.VITE_REVERB_PORT || 443),
  forceTLS: (import.meta.env.VITE_REVERB_SCHEME || 'http') === 'https',
  enabledTransports: ['ws', 'wss'],
  disableStats: true,
  authorizer: ...
});
```

Key behavior:

- Only `ws` and `wss` are enabled; there is no long-polling fallback.
- If `VITE_REVERB_APP_KEY` is missing, `getEcho()` logs a warning and returns `null`.
  Realtime is disabled, but the REST UI still works.
- The Echo instance is a module-level singleton, so a page does not create a new socket on
  every render.

### 12.2 Broadcast auth request

The custom authorizer:

1. Reads the current stored auth.
2. Builds headers with `Accept`, `Content-Type`, `lang`, `device`, and
   `Authorization`.
3. POSTs to `/api/broadcasting/auth`.
4. Sends:

```json
{
  "socket_id": "<socket-id>",
  "channel_name": "private-user.7"
}
```

5. Rejects the subscription if the HTTP response is not OK.
6. Passes the auth response to Echo.

This is necessary because a browser cannot attach a custom Authorization header to a raw
WebSocket handshake. The signed authorization happens over a normal authenticated HTTP
request instead.

### 12.3 Relative auth URL

The auth URL is:

```js
new URL('/api/broadcasting/auth', window.location.origin)
```

That relies on the current origin routing `/api` to Laravel.

In development, both Vite configs proxy `/api`:

```js
proxy: {
  '/api': {
    target: process.env.VITE_PROXY_TARGET || 'http://localhost:8000',
    changeOrigin: true,
  },
}
```

In production, the web server must route `/api` from the app origin to Laravel. If the API
is on a different origin, the auth URL and CORS setup need to be adjusted explicitly.

### 12.4 `usePrivateChannel`

The hook:

- waits for an enabled channel, an access token, and a channel name;
- gets the Echo singleton;
- subscribes with `echo.private(channelName)`;
- registers listeners from a ref so handler updates do not resubscribe the channel;
- stops each listener and leaves the channel on cleanup.

The effect depends on:

- channel name;
- enabled flag;
- access token;
- device;
- role.

A token, device, or role change tears down the old subscription and creates a new one.

### 12.5 Customer provider

`CustomerRealtimeProvider`:

- reads `auth`, `isUser`, and `userId`;
- reads connection state;
- keeps notifications, toasts, `lastEvent`, and `revision`;
- subscribes to `user.{userId}` only when `isUser && !!userId`;
- clears notifications and timers when `userId` changes;
- clears timers on unmount;
- exposes `markAllRead`, `clearNotifications`, and `dismissToast`.

### 12.6 Admin provider

`AdminRealtimeProvider`:

- reads `isAuthenticated` from the admin auth context;
- subscribes to `admin.orders` while authenticated;
- keeps notifications, toasts, `lastEvent`, and `revision`;
- clears timers on unmount;
- exposes the same shared notification API.

The provider is mounted inside the protected admin route, so it does not subscribe before
admin authentication.

### 12.7 Customer pages

`OrdersPage`:

```js
useEffect(() => {
  if (!revision) return undefined;
  const timer = setTimeout(() => load(), 250);
  return () => clearTimeout(timer);
}, [revision]);
```

It also displays a connection badge and keeps a manual Refresh button.

`OrderDetailPage`:

```js
useEffect(() => {
  if (lastEvent?.kind !== 'status') return;
  if (String(lastEvent.order_id) !== String(id)) return;

  setOrder((prev) => ({
    ...prev,
    status: lastEvent.status,
    status_label: lastEvent.status_label ?? prev.status_label,
  }));
}, [lastEvent, id]);
```

The open order updates immediately; a full API reload is not required.

### 12.8 Admin orders page

`AdminOrdersPage`:

- debounces `revision` changes by 250 ms;
- reloads the order list with the current page size;
- reloads the selected order detail if a panel is open;
- displays the last live event;
- shows a connection badge and maintains a manual Refresh button.

### 12.9 Notification UI

The customer and admin notification components are separate copies with similar behavior:

- bell button with unread count;
- notification panel;
- click to open the related order;
- clear action;
- relative timestamps;
- toast stack with dismiss buttons;
- accessible `aria-live` toast region.

Customer notifications link to `/orders/{id}`. Customer routes include
`/orders/:id`, so those links work.

Admin notifications also link to `/orders/{id}`, but the admin route table currently
defines `/orders` without an `/orders/:id` route. Unknown admin routes fall through to the
wildcard redirect to `/dashboard`. See the limitations section.

---

## 13. Backend implementation details

### 13.1 Broadcasting connection

`config/broadcasting.php` defines the `reverb` connection:

```php
'reverb' => [
    'driver' => 'reverb',
    'key' => env('REVERB_APP_KEY'),
    'secret' => env('REVERB_APP_SECRET'),
    'app_id' => env('REVERB_APP_ID'),
    // host, port, scheme, TLS
],
```

`.env.docker` selects it:

```dotenv
BROADCAST_CONNECTION=reverb
```

### 13.2 Broadcasting auth route

`bootstrap/app.php` calls `withBroadcasting()` with:

- prefix: `api`;
- middleware: `api`, `auth:sanctum`, `check.device`;
- channel file: `routes/channels.php`.

This produces the protected endpoint used by the browser:

```text
POST /api/broadcasting/auth
```

It is not a public endpoint. The user must be authenticated and the device must match.

### 13.3 Reverb server configuration

`config/reverb.php` defines:

- server host, port, path, and hostname;
- max request size;
- optional scaling settings;
- the Reverb application;
- app key, secret, and ID;
- allowed origins;
- ping interval;
- activity timeout;
- connection, message, and channel limits;
- client event policy;
- rate limiting settings.

Current local behavior:

| Setting | Current value/behavior |
|---|---|
| Reverb server | `0.0.0.0:8080` inside the container |
| Host mapping | `8081:8080` |
| Broadcast connection | `reverb` |
| Allowed origins | `*` |
| Scaling | Disabled by default |
| Rate limiting | Disabled by default |
| Client events | Accepted from `members` by default |
| Ping interval | 60 seconds |
| Activity timeout | 30 seconds |
| Max channels per connection | 1000 |
| Max message size | 10,000 bytes |

The app does not use client-to-server events, presence channels, or Reverb scaling in the
current implementation.

### 13.4 Event contract tests

`tests/Unit/RealtimeContractTest.php` verifies:

- `OrderCreated` channels are exactly `private-user.7` and `private-admin.orders`;
- `OrderCreated` broadcasts as `order.created`;
- `OrderCreated` payload matches the expected fields;
- `OrderStatusUpdated` channels are exactly `private-orders.12`, `private-user.7`, and
  `private-admin.orders`;
- `OrderStatusUpdated` broadcasts as `order.status.updated`.

These tests protect the channel contract which the frontend depends on.

---

## 14. Operational runbook

### 14.1 Start the realtime stack

```bash
docker compose up -d --build app queue-worker reverb web frontend admin
```

### 14.2 Check service status

```bash
docker compose ps
```

### 14.3 Watch Reverb logs

```bash
docker compose logs -f reverb
```

### 14.4 Watch queue worker logs

```bash
docker compose logs -f queue-worker
```

### 14.5 Open the applications

| Service | URL |
|---|---|
| Customer | `http://localhost:5173` |
| Admin | `http://localhost:5174` |
| API | `http://localhost:8000` |
| Reverb WebSocket | `ws://localhost:8081` |
| RabbitMQ management | `http://localhost:15672` |

### 14.6 Verify channel traffic

In the browser developer tools:

1. Open **Network**.
2. Filter by **WS**.
3. Reload the app.
4. Confirm a WebSocket connection to the Reverb host on port `8081`.
5. Inspect frames or the console for channel subscriptions.

Expected private channel names:

```text
private-user.{userId}
private-admin.orders
```

`private-orders.{orderId}` is also a valid backend channel, but the current customer UI
does not subscribe to it.

### 14.7 Test the full realtime flow

1. Start `app`, `queue-worker`, `reverb`, `web`, `frontend`, and `admin`.
2. Sign in as a customer on `:5173`.
3. Sign in as an admin on `:5174`.
4. Create an order as the customer.
5. Confirm:
   - the customer receives an order-created notification;
   - the admin receives a new-order notification;
   - the admin order queue refreshes.
6. Change the order status as the admin.
7. Confirm:
   - the customer receives a status notification;
   - the customer order detail updates in place;
   - the admin queue and open detail refresh.

### 14.8 Check the backend contract

```bash
php artisan test --filter=RealtimeContractTest
```

### 14.9 Check production builds

```bash
cd frontend && npm run build
cd admin && npm run build
```

### 14.10 Run Reverb locally without Docker

```bash
php artisan reverb:start
```

The local browser still needs the matching `VITE_REVERB_*` values and a reachable API.

---

## 15. Troubleshooting

| Symptom | Likely cause | What to check |
|---|---|---|
| Admin pill says Offline | Reverb is down or unreachable | `docker compose ps`; `docker compose logs -f reverb`; confirm port `8081`. |
| Admin pill says Realtime off | `VITE_REVERB_APP_KEY` is missing or the Echo client was not created | Check the frontend build-time environment and restart Vite. |
| Customer never subscribes | Missing `user_id`, expired token, or non-user role | Sign out and back in; inspect the auth response and channel name. |
| Admin channel returns 403 | The account is not an admin | Confirm the role and `routes/channels.php`. |
| Broadcast auth returns 401 | Access token expired, missing, or device mismatch | Sign in again; confirm the `device` header and `check.device` middleware. |
| Broadcast auth returns 500 | Backend error or missing Reverb config | Check Laravel logs and Reverb environment values. |
| WebSocket connection succeeds but no events arrive | Queue worker is stopped or RabbitMQ is down | Check `queue-worker` logs and the RabbitMQ `default` queue. |
| Events arrive but pages do not update | Provider is not mounted or event names do not match | Confirm provider placement and the `.order.created` / `.order.status.updated` listeners. |
| WebSocket fails after login | Token or device changed and the old connection is stale | Sign out and back in; `resetEcho()` should clear the old client. |
| Mixed-content error in production | The page is HTTPS but Reverb is using `ws://` | Use `wss://`, set `VITE_REVERB_SCHEME=https`, and enable TLS. |
| Vite cannot resolve `laravel-echo` in Docker | Frontend container dependencies are missing | Run `docker compose exec frontend npm install --no-audit --no-fund` or recreate the container. |
| Admin notification opens the wrong page | Admin routes lack `/orders/:id` | Link to `/orders` or add a dedicated admin order-detail route. |
| Works in dev, fails behind a proxy | Proxy does not forward WebSocket upgrades | Configure the load balancer or nginx to forward `Upgrade` and `Connection` headers. |

---

## 16. Security and production hardening

### 16.1 Private channels are necessary, but not sufficient

Private channels prevent unauthorized browser subscriptions, but the application still
needs:

- strong token handling;
- device verification;
- role checks;
- HTTPS/WSS;
- restricted origins;
- rate limiting;
- monitoring.

### 16.2 Credentials

- `REVERB_APP_SECRET` must remain on the backend only.
- `REVERB_APP_KEY` is public and is intentionally included in the frontend bundle.
- Do not reuse local development credentials in production.
- Rotate the app secret if it is exposed.

### 16.3 TLS

Use `https://` and `wss://` in production.

Set:

```dotenv
REVERB_SCHEME=https
VITE_REVERB_SCHEME=https
```

Ensure the reverse proxy or load balancer terminates TLS correctly and forwards WebSocket
upgrade headers.

### 16.4 Allowed origins

`config/reverb.php` currently allows:

```php
'allowed_origins' => ['*'],
```

That is convenient for local development with two origins on different ports. In
production, restrict it to the actual customer and admin origins.

### 16.5 Rate limiting

Reverb rate limiting is disabled by default in the current configuration. Consider
enabling it for production:

```dotenv
REVERB_APP_RATE_LIMITING_ENABLED=true
```

Tune the attempts and decay window for expected traffic.

### 16.6 Token lifetime

The Echo authorizer reads the stored access token when it authorizes a channel. There is
no dedicated Echo token-refresh callback in this code. If a token expires while a socket
remains connected, new private-channel authorization requests can fail until the app
refreshes the session or reconnects.

Make token lifetime and reconnect behavior explicit in production.

### 16.7 Scaling

Reverb scaling is disabled by default. If running multiple Reverb nodes, enable Reverb
scaling with Redis and configure a shared pub/sub backend. A single-node deployment is
sufficient for local development and small production setups.

### 16.8 Monitoring

Monitor:

- WebSocket connection count;
- connection churn and reconnect rate;
- authorization failures;
- broadcast failures;
- queue depth for broadcast jobs;
- Reverb memory and CPU;
- TLS certificate expiry;
- proxy WebSocket upgrade errors.

---

## 17. Current limitations and observations

These are important to keep the report honest.

1. **Realtime is not persisted.**  
   Notifications live in React state. A page reload clears them. There is no notification
   table or replay buffer.

2. **Offline clients miss events.**  
   WebSocket delivery is live-only. The REST API and manual refresh remain the fallback.

3. **The customer UI subscribes to `user.{userId}` only.**  
   `orders.{orderId}` is still broadcast and tested, but the current customer UI does not
   subscribe to it.

4. **The admin notification deep link has no matching route.**  
   Admin notifications link to `/orders/{id}`, while the admin route table defines
   `/orders` and the wildcard redirects unknown paths to `/dashboard`. This should be
   fixed or the link should point to `/orders`.

5. **The app relies on same-origin `/api` routing.**  
   The Echo authorizer uses `/api/broadcasting/auth` relative to the current origin.
   Development uses the Vite proxy. Production must provide an equivalent reverse-proxy
   route.

6. **Realtime has no health check in Compose.**  
   The Reverb container has `restart: unless-stopped`, but there is no dedicated health
   check equivalent to the RabbitMQ or MySQL health checks.

7. **`allowed_origins` is wildcarded.**  
   This is acceptable for local development with separate ports but should be restricted
   in production.

8. **Reverb scaling is disabled.**  
   The current deployment assumes one Reverb node. Multi-node deployments need Redis
   scaling and a load-balancing strategy.

9. **Rate limiting is disabled.**  
   Reverb's application rate limiting is off by default.

10. **No presence or client events.**  
    The app uses private channels only. There is no presence channel, no typing indicator,
    and no client-to-client event flow.

11. **Broadcast delivery depends on the queue worker.**  
    The order request can succeed while Reverb delivery is delayed or fails. The
    `queue-worker` and RabbitMQ must be running for events to arrive.

12. **There is no measured latency result.**  
    The repository does not contain before/after benchmarks. The claim is architectural:
    updates are pushed instead of polled, and the request path does not wait for Reverb.

---

## 18. Configuration reference

### 18.1 Backend environment

| Variable | Purpose |
|---|---|
| `BROADCAST_CONNECTION` | Selects the `reverb` broadcast driver. |
| `REVERB_APP_ID` | Reverb application ID. |
| `REVERB_APP_KEY` | Public application key. |
| `REVERB_APP_SECRET` | Private signing secret; never expose to the browser. |
| `REVERB_SERVER_HOST` | Reverb server bind address; `0.0.0.0` in the container. |
| `REVERB_SERVER_PORT` | Reverb container port; `8080`. |
| `REVERB_HOST` | Host used by the backend to reach Reverb; `reverb` in Docker. |
| `REVERB_PORT` | Port used by the backend; `8080` in Docker. |
| `REVERB_SCHEME` | `http` locally; use `https` in production. |
| `REVERB_SCALING_ENABLED` | Enables multi-node Redis scaling. |
| `REVERB_APP_RATE_LIMITING_ENABLED` | Enables Reverb application rate limiting. |
| `REVERB_APP_PING_INTERVAL` | Keepalive ping interval. |
| `REVERB_APP_ACTIVITY_TIMEOUT` | Inactivity timeout. |

### 18.2 Frontend environment

| Variable | Purpose |
|---|---|
| `VITE_REVERB_APP_KEY` | Public Reverb app key. |
| `VITE_REVERB_HOST` | Host the browser connects to; `localhost` locally. |
| `VITE_REVERB_PORT` | Host-mapped Reverb port; `8081` locally. |
| `VITE_REVERB_SCHEME` | `http` locally; `https` in production. |
| `VITE_PROXY_TARGET` | Vite dev proxy target for `/api`. |
| `VITE_ADMIN_URL` | Customer app link to the admin app. |
| `VITE_STOREFRONT_URL` | Admin app link to the customer app. |

### 18.3 Docker Compose services

| Service | Role |
|---|---|
| `app` | Laravel PHP-FPM application. |
| `web` | nginx in front of the API. |
| `queue-worker` | Consumes RabbitMQ jobs and publishes broadcasts. |
| `reverb` | Reverb WebSocket server. |
| `frontend` | Customer Vite app. |
| `admin` | Admin Vite app. |

---

## 19. File index

| File | Relevance |
|---|---|
| `composer.json` | Adds Laravel Reverb. |
| `frontend/package.json` | Adds `laravel-echo` and `pusher-js`. |
| `admin/package.json` | Adds `laravel-echo` and `pusher-js`. |
| `config/broadcasting.php` | Defines the `reverb` broadcast connection. |
| `config/reverb.php` | Reverb server, app, and limit configuration. |
| `bootstrap/app.php` | Registers broadcasting auth under `/api` with Sanctum and device middleware. |
| `routes/channels.php` | Defines and authorizes the private channels. |
| `app/Events/OrderCreated.php` | New-order broadcast event. |
| `app/Events/OrderStatusUpdated.php` | Status-change broadcast event. |
| `docker-compose.yml` | Reverb service and host port mapping. |
| `.env.docker` | Backend and frontend Reverb environment. |
| `frontend/vite.config.js` | `/api` dev proxy. |
| `admin/vite.config.js` | `/api` dev proxy. |
| `frontend/src/realtime/echo.js` | Customer Echo client and authorizer. |
| `frontend/src/realtime/usePrivateChannel.js` | Private-channel subscription lifecycle. |
| `frontend/src/realtime/CustomerRealtimeContext.jsx` | Customer realtime provider. |
| `admin/src/realtime/echo.js` | Admin Echo client and authorizer. |
| `admin/src/realtime/usePrivateChannel.js` | Admin private-channel lifecycle. |
| `admin/src/realtime/AdminRealtimeContext.jsx` | Admin realtime provider. |
| `frontend/src/auth/AuthContext.jsx` | Customer auth state and Echo reset. |
| `admin/src/auth/AuthContext.jsx` | Admin auth state and Echo reset. |
| `frontend/src/main.jsx` | Mounts the customer realtime provider. |
| `admin/src/App.jsx` | Mounts the admin realtime provider inside the protected shell. |
| `frontend/src/layouts/AppLayout.jsx` | Customer notification bell and toaster. |
| `admin/src/layouts/AppLayout.jsx` | Admin connection pill, bell, and toaster. |
| `frontend/src/pages/OrdersPage.jsx` | Customer list refresh on realtime revision. |
| `frontend/src/pages/OrderDetailPage.jsx` | Live status patch. |
| `admin/src/pages/AdminOrdersPage.jsx` | Admin queue and detail refresh. |
| `frontend/src/components/notifications.jsx` | Customer notification UI. |
| `admin/src/components/notifications.jsx` | Admin notification UI. |
| `tests/Unit/RealtimeContractTest.php` | Channel and event contract tests. |
| `WEBSOCKET.md` | Existing operational realtime documentation. |
| `RABBITMQ.md` | Queue side of the same delivery pipeline. |

---

## 20. Glossary

| Term | Definition |
|---|---|
| Broadcast | Sending an event to WebSocket subscribers. |
| Channel | A named subscription group in Reverb. |
| Echo | Laravel's JavaScript client for WebSocket broadcasting. |
| Handshake | The HTTP upgrade request that starts a WebSocket connection. |
| Private channel | A channel that requires server-side authorization before subscription. |
| Pusher protocol | The protocol used by pusher-js and supported by Reverb. |
| Reverb | Laravel's first-party WebSocket server. |
| Revision | A client-side counter incremented on each realtime event to trigger debounced reloads. |
| Subscription | A client joining a channel to receive its events. |
| WebSocket | A persistent, full-duplex client-server protocol. |
| WSS | WebSocket over TLS. |

---

## 21. Bottom line

WebSocket makes the customer and admin interfaces feel live.

Reverb is the server that holds those connections. Echo and pusher-js are the browser
clients. Laravel authorization and private channels ensure that a customer only receives
their own updates and only admins receive the global order feed.

The complete delivery path is:

```text
Order event
  -> RabbitMQ
  -> queue-worker
  -> Reverb
  -> private channel
  -> Echo client
  -> notification, toast, and page refresh
```

The most important operational rule is:

> If the UI says Offline or events do not arrive, check `reverb`, `queue-worker`, the
> RabbitMQ `default` queue, and the browser Network -> WS frames before debugging the
> React components.

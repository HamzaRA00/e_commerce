# Realtime Order Updates (WebSocket / Laravel Reverb)

This document describes the realtime WebSocket implementation added to the React
frontend and Laravel backend, including the configuration changes, event flow,
authentication, and how to run and test it.

Scope: **order events only** — new orders and order status changes.

---

## 1. High-level flow

```
Browser (React + Laravel Echo)
   │  1. WebSocket connect (Reverb, ws://localhost:8081)
   ▼
Reverb server
   │  2. Client subscribes to a private channel
   ▼
Laravel Broadcasting Auth  POST /api/broadcasting/auth
   │  3. Validates Bearer token + device header + channel policy
   ▼
Private channel authorized
   ▲
   │  5. Broadcast event delivered to subscribed clients
   │
Reverb server ◀── 4. Laravel publishes event
   ▲
   │
RabbitMQ (BroadcastEvent job) ──▶ queue-worker (`php artisan rabbitmq:consume`)
   ▲
   │
Laravel event dispatch:
   • OrderCreated        (user creates an order)
   • OrderStatusUpdated  (admin changes order status)
```

Because both events implement `ShouldBroadcast` (not `ShouldBroadcastNow`), Laravel
queues a `BroadcastEvent` job on RabbitMQ. The `queue-worker` service consumes the job
and publishes it to Reverb, which pushes it to connected clients.

**Consequence:** Realtime only works while both the `reverb` and `queue-worker`
containers are running.

---

## 2. Channels and events

| Channel | Who may subscribe | Channel authorization |
|---|---|---|
| `admin.orders` | Users with the admin role | `routes/channels.php` → `$user->hasRole(RoleEnum::ADMIN)` |
| `orders.{orderId}` | The user who owns the order | `routes/channels.php` → user role **and** `orders.user_id = $user->id` |

| Event | `broadcastAs` | Broadcast channels | Payload |
|---|---|---|---|
| `App\Events\OrderCreated` | `order.created` | `admin.orders` | `order_id`, `user_id`, `status` |
| `App\Events\OrderStatusUpdated` | `order.status.updated` | `orders.{orderId}`, `admin.orders` | `order_id`, `user_id`, `status`, `status_label` |

Frontend subscriptions:

| Page | Channel | Listens to | Reaction |
|---|---|---|---|
| `AdminOrdersPage` | `admin.orders` | `.order.created`, `.order.status.updated` | Debounced refetch (250 ms); refreshes the open detail panel; shows “New order #N received.” |
| `OrderDetailPage` | `orders.{id}` | `.order.status.updated` | Updates `status` / `status_label` in place |

The React app shows a Live/Offline badge driven by the Pusher connection state
(`connecting`, `connected`, `unavailable`, etc.).

---

## 3. Backend changes

### 3.1 New event: `app/Events/OrderStatusUpdated.php`

Previously this file existed but was **empty**, while `AdminOrderController` already
called `OrderStatusUpdated::dispatch(...)`. This caused a fatal error after the order
status was written to the database.

Implemented:

- `implements ShouldBroadcast, ShouldDispatchAfterCommit`
- `broadcastOn()` → `orders.{orderId}` and `admin.orders`
- `broadcastAs()` → `order.status.updated`
- `broadcastWith()` → order id, user id, status value, translated status label
- Added `use App\Events\OrderStatusUpdated;` to `AdminOrderController`
- Dispatch is wrapped in try/catch (a broker failure must not fail the API response)

### 3.2 Order creation broadcasts

`UserOrderController::store` now dispatches the existing `OrderCreated` event after
the DB transaction commits:

```php
OrderCreated::dispatch($order->id, $order->user_id, $order->status->value);
```

The event already implements `ShouldBroadcast` and `ShouldDispatchAfterCommit`.
Dispatch is wrapped in try/catch with a warning log.

### 3.3 Order confirmation email

`app/Notifications/OrderCreatedNotification.php` was previously empty and unimported,
which made order creation fail with a 500 **after** committing the order. It is now:

- `implements ShouldQueue` (sent asynchronously through RabbitMQ)
- Constructor: `(int $orderId, string $status)`
- Sends a `MailMessage` with the order id and current status
- Imported in `UserOrderController`
- Queue failures are caught and logged without affecting the 201 response

### 3.4 Registration without email verification

Requested change: registration no longer sends a verification code.

- `UserAuthenticationService::register` now sets `email_verified_at = now()` and does
  not call `SendEmailVerificationCodeAction`.
- Registration response message changed to `User registered successfully`.
- Frontend `RegisterPage` stores `verified: true` and redirects to `/catalog`.
- Login still sends a verification code for **legacy unverified accounts**; the
  verify-email page remains available for those users.

### 3.5 Broadcasting auth

Registered in `bootstrap/app.php` with API prefix and middleware:

```
POST /api/broadcasting/auth
middleware: api, auth:sanctum, check.device
```

Both the Bearer token **and** the session `device` header are required.
The channel callbacks in `routes/channels.php` enforce ownership/role.

---

## 4. Configuration changes

### 4.1 Problems fixed

1. **App key mismatch** — server used `REVERB_APP_KEY=your-public-key`, browser was
   configured with `VITE_REVERB_APP_KEY=luffy`, so clients could not connect.
2. **Wrong publish port** — server-side broadcasting used `REVERB_PORT=8081`, but
   inside Compose Reverb listens on **8080** (`8081` is only the host mapping).
3. **Missing frontend env** — the `frontend` service did not receive any
   `VITE_REVERB_*` variables.

### 4.2 Final values

`.env.docker`:

```ini
BROADCAST_CONNECTION=reverb

REVERB_APP_ID=ecommerce
REVERB_APP_KEY=luffy
REVERB_APP_SECRET=luffy

REVERB_SERVER_HOST=0.0.0.0
REVERB_SERVER_PORT=8080

# Server -> Reverb (internal container port)
REVERB_HOST=reverb
REVERB_PORT=8080
REVERB_SCHEME=http

# Browser -> Reverb (host-mapped port)
VITE_REVERB_APP_KEY=luffy
VITE_REVERB_HOST=localhost
VITE_REVERB_PORT=8081
VITE_REVERB_SCHEME=http
```

`docker-compose.yml` → `frontend.environment`:

```yaml
VITE_PROXY_TARGET: http://web:80
VITE_REVERB_APP_KEY: luffy
VITE_REVERB_HOST: localhost
VITE_REVERB_PORT: 8081
VITE_REVERB_SCHEME: http
```

`frontend/.env.example` contains the same `VITE_REVERB_*` variables for local dev.
The app key must match the backend `REVERB_APP_KEY`.

Ports:

| Purpose | Address |
|---|---|
| Browser WebSocket | `ws://localhost:8081` |
| Server-side publish (inside network) | `reverb:8080` |
| Reverb container mapping | `8081:8080` |

---

## 5. Frontend implementation

### 5.1 Dependencies

Added to `frontend/package.json`:

- `laravel-echo` `^2.6.3`
- `pusher-js` `^8.6.0`

### 5.2 `src/realtime/echo.js`

- Creates a singleton Laravel Echo client with `broadcaster: 'reverb'`.
- Uses `VITE_REVERB_APP_KEY`, `VITE_REVERB_HOST`, `VITE_REVERB_PORT`,
  `VITE_REVERB_SCHEME`.
- `forceTLS` is enabled only when the scheme is `https`.
- Custom authorizer POSTs to an **absolute** URL
  `new URL('/api/broadcasting/auth', window.location.origin)`.
  (The normal axios client uses `baseURL=/api/v1`; reusing it would produce
  `/api/v1/api/broadcasting/auth`.)
- Auth request headers:
  - `Accept: application/json`
  - `Content-Type: application/json`
  - `lang: en`
  - `device: <stored device id>`
  - `Authorization: Bearer <stored access token>`
- Body: `{ "socket_id": "...", "channel_name": "private-admin.orders" }`
- Returns the Laravel response (`{ auth: "..." }`) to Echo.
- `resetEcho()` disconnects and clears the singleton.

### 5.3 `src/realtime/usePrivateChannel.js`

- `usePrivateChannel(channelName, listeners, enabled)`:
  - Subscribes with `echo.private(...)`.
  - Registers `.event` listeners from the supplied map.
  - Cleans up with `stopListening` + `echo.leave(channelName)`.
  - Resubscribes when the access token, device, or role changes.
  - Uses a ref for listeners, so re-renders do not churn subscriptions.
  - StrictMode-safe (mount → cleanup → mount).
- `useRealtimeConnection()`:
  - Reads `echo.connector.pusher.connection` and binds `state_change`.
  - Powers the Live/Offline badge.

### 5.4 Page wiring

- `AdminOrdersPage`
  - `usePrivateChannel('admin.orders', ...)` when `isAdmin`.
  - New order → sets a notice and schedules a debounced reload.
  - Status update → schedules a reload; refreshes the open detail panel.
  - Live/Offline badge added to the header.
- `OrderDetailPage`
  - `usePrivateChannel(\`orders.${id}\`, ...)` when `isUser`.
  - `.order.status.updated` patches the order’s status and label.
  - Live/Offline badge added to the header.
- `AuthContext`
  - Calls `resetEcho()` on logout and on session-clear (failed refresh).

The old Blade `resources/views/orders/show.blade.php` / `order-details.js` demo was not
changed; realtime is implemented in the React app only.

---

## 6. Files changed

### Backend
```
app/Events/OrderStatusUpdated.php                 (new implementation)
app/Notifications/OrderCreatedNotification.php    (new implementation)
app/Http/Controllers/V1/User/UserOrderController.php
app/Http/Controllers/V1/Admin/AdminOrderController.php
app/Services/V1/User/UserAuthenticationService.php
app/Http/Controllers/V1/User/UserAuthenticationController.php
```

### Configuration
```
.env.docker
docker-compose.yml                                (frontend env)
frontend/.env.example
```

### Frontend
```
frontend/package.json
frontend/package-lock.json
frontend/src/realtime/echo.js                     (new)
frontend/src/realtime/usePrivateChannel.js        (new)
frontend/src/pages/admin/AdminOrdersPage.jsx
frontend/src/pages/OrderDetailPage.jsx
frontend/src/auth/AuthContext.jsx
frontend/src/pages/RegisterPage.jsx
frontend/src/pages/LoginPage.jsx
```

---

## 7. Running it

Because `package.json` changed, the frontend container’s anonymous `node_modules`
volume must be brought up to date. The dev image now runs `npm install` on start, so
rebuilding/recreating the container is enough. Backend env changes require recreating
the containers.

```bash
# from the repo root
docker compose up -d --build --force-recreate app queue-worker reverb web frontend
```

If you cannot restart the whole stack, patch the running container first:

```bash
docker compose exec frontend npm install --no-audit --no-fund
docker compose restart frontend
```

If the stack is not initialized yet:

```bash
docker compose up -d --build
docker compose exec app php artisan migrate --seed
docker compose exec warehouse_db mysql -uroot -proot warehouse \
  -e "INSERT INTO stock (productId, quantity) VALUES (1,10),(2,5),(3,1) ON DUPLICATE KEY UPDATE quantity=VALUES(quantity);"
```

Local frontend development (backend in Docker):

```bash
cd frontend
cp .env.example .env     # adjust VITE_REVERB_* if needed
npm install
npm run dev              # http://localhost:5173
```

URLs:

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| API | http://localhost:8000/api/v1 |
| Reverb WebSocket | ws://localhost:8081 |
| RabbitMQ management | http://localhost:15672 |

Seeded accounts:

- User: `user@ecommerce.com` / `password`
- Admin: `admin@ecommerce.com` / `password`

Use **two separate browser profiles/incognito windows**; the session is stored in
`localStorage`, so one browser cannot hold a user and an admin session simultaneously.

---

## 8. Manual test plan

1. Start `app`, `queue-worker`, `reverb`, and `frontend`.
2. Check container logs:
   ```bash
   docker compose logs -f reverb queue-worker
   ```
3. Log in as the user in browser A and the admin in browser B.
4. Confirm the admin orders page shows **Live** (not Offline/connecting).
5. User creates an order for product 3:
   - Admin orders table updates without a manual refresh.
   - A “New order #N received.” notice appears.
   - RabbitMQ activity and a `BroadcastEvent` job appear in `queue-worker` logs.
6. Admin cancels that order:
   - User’s order detail badge changes to `cancelled` without refresh.
   - Admin list refreshes as well.
   - Warehouse stock is restored.
7. Browser DevTools → Network → WS:
   - Connection to `ws://localhost:8081/app/<key>?...`.
   - Frames show `private-admin.orders` / `private-orders.{id}` subscriptions and
     event payloads.
8. Register a new user:
   - No verification email is sent.
   - The account is immediately verified and can open `/orders`.
9. Order confirmation email still arrives through the queue (check Mailtrap or
   `queue-worker` logs).

### Broadcasting auth smoke test

```bash
curl -X POST http://localhost:8000/api/broadcasting/auth \
  -H 'Accept: application/json' \
  -H 'Content-Type: application/json' \
  -H 'device: <device-from-login-response>' \
  -H 'Authorization: Bearer <access-token>' \
  -d '{"socket_id":"123456789.987654321","channel_name":"private-admin.orders"}'
```

Expected: HTTP 200 with `{ "auth": "<key>:<signature>" }`.

Negative checks:

- A normal user requesting `private-admin.orders` → 403.
- A user requesting `private-orders.{someone-else-order}` → 403.
- Missing/incorrect `device` header → 401/403.

---

## 9. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Badge stays `unavailable`, no WS connection | `VITE_REVERB_APP_KEY` missing or mismatched | Ensure frontend env key equals backend `REVERB_APP_KEY`; restart Vite (env is read at startup) |
| WS connects but channels never authorize | Auth request missing `device`/Bearer header, or token expired | Check `/api/broadcasting/auth` response; re-login |
| Events update only after refresh | `queue-worker` not running or RabbitMQ down | `docker compose ps`, `docker compose logs queue-worker` |
| `queue-worker` logs publish errors to `reverb:8081` | `REVERB_PORT` still 8081 | Set `REVERB_PORT=8080` (internal), keep `VITE_REVERB_PORT=8081` (browser) |
| Vite fails to resolve `laravel-echo` in Docker | Stale anonymous `node_modules` volume | Immediate: `docker compose exec frontend npm install --no-audit --no-fund` then `docker compose restart frontend`. Permanent: recreate the container (see section 7). The dev image now runs `npm install` on start. |
| `502 Bad Gateway` on `http://localhost:8000/api/...` | nginx cached the old `app` container IP after `app` was recreated | `docker compose restart web`. The nginx config now re-resolves `app` every 10s. |
| Admin sees their own status change twice | Local update + broadcast refetch | Harmless; debounce (250 ms) limits duplicate requests |
| Events work locally but not in production build | `VITE_REVERB_*` not provided at `npm run build` time | Pass them as Docker build args / `.env.production` values |

---

## 10. Verification performed

- `php artisan test` — 2/2 tests pass.
- `vendor/bin/pint` — formatting applied to changed PHP files.
- `docker compose config -q` — valid Compose configuration.
- `npm run build` — success (126 modules; Echo included).
- Event introspection confirmed:
  - Channels: `private-orders.5`, `private-admin.orders`
  - `broadcastAs`: `order.status.updated`
  - Payload includes `order_id`, `user_id`, `status`, `status_label`

Docker runtime E2E could not be executed in this environment because the Docker socket
was not accessible; the steps in section 8 are the intended runtime verification.

---

## 11. Design decisions / limitations

- Realtime is implemented in the React app only; the Blade demo is untouched.
- Events are queued (`ShouldBroadcast`) to exercise RabbitMQ. Switching to
  `ShouldBroadcastNow` would remove the `queue-worker` dependency but add latency to
  the HTTP request.
- Admin clients receive order status events too, so multiple admins stay in sync.
- The UI refetches after events instead of doing optimistic list updates; this keeps
  labels, item counts, and pagination accurate.
- Private-channel authorization is checked server-side; the browser never receives
  data from channels it is not allowed to join.
- Existing WebSocket authorization is validated per channel subscription. If a token
  expires while a socket is connected, the existing subscription stays until reconnect;
  a new subscription will be rejected until re-login.
- Production frontend builds need `VITE_REVERB_*` values at build time (the Docker
  `build` stage does not currently accept them as build args).

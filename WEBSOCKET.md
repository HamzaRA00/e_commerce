# Realtime Order Updates (Reverb)

This document describes the WebSocket setup between the Laravel backend, the customer
storefront (`frontend/`, port `5173`), and the separate admin app (`admin/`, port `5174`).

## 1. Why two apps

The admin UI used to live inside the customer SPA. Both sessions used the same
`localStorage` key, so one browser could not stay signed in as a customer and an admin at
the same time.

The admin workspace now runs as a separate Vite app on a different origin:

| App | URL | Session key |
|-----|-----|-------------|
| Customer | `http://localhost:5173` | `ecom_test_auth_v1` |
| Admin | `http://localhost:5174` | `ecom_admin_auth_v1` |

Separate origins and storage keys allow both sessions in the same browser. The apps share
the Laravel API and the same Reverb server.

## 2. Architecture

```
Customer SPA :5173 ── POST /api/broadcasting/auth ─┐
Admin SPA    :5174 ── POST /api/broadcasting/auth ─┤
                                                   ├── Laravel API :8000
                                                   └── Reverb :8081 (host) / :8080 (container)
                                                          ▲
                                           queue-worker ───┘
                                           RabbitMQ queue: default
```

- `OrderCreated` and `OrderStatusUpdated` are queued (`ShouldBroadcast` +
  `ShouldDispatchAfterCommit`).
- The `queue-worker` consumes the `default` RabbitMQ queue and publishes to Reverb.
- Both apps authenticate private channels with the Sanctum Bearer token plus the
  `device` header.

## 3. Channels

`routes/channels.php` defines:

| Channel | Authorization |
|---------|---------------|
| `orders.{orderId}` | `user` role and the order belongs to the user |
| `user.{userId}` | `user` role and the id matches the authenticated user |
| `admin.orders` | `admin` role |

## 4. Events

| Event | Broadcast name | Channels | Payload |
|-------|----------------|----------|---------|
| `App\Events\OrderCreated` | `order.created` | `user.{userId}`, `admin.orders` | `order_id`, `user_id`, `status` |
| `App\Events\OrderStatusUpdated` | `order.status.updated` | `orders.{orderId}`, `user.{userId}`, `admin.orders` | `order_id`, `user_id`, `status`, `status_label` |

`OrderCreatedNotification` is also queued and sends the order confirmation email.

## 5. Frontend behavior

### Customer app

`frontend/src/realtime/CustomerRealtimeContext.jsx` subscribes once to
`user.{userId}` while a customer is signed in.

| Event | Behavior |
|-------|----------|
| `.order.created` | Notification bell + toast; increments the order revision. |
| `.order.status.updated` | Notification bell + toast; patches the open `/orders/:id` page; debounces a refresh on `/orders`. |

`AppLayout` renders `NotificationBell` and `RealtimeToaster`. The connection state is
shown on the orders page and the notification panel is available from the top bar.

The auth response includes `user_id` so the channel can be authorized immediately after
login/register. Refresh responses also include it. Sessions created before this change
need a fresh login or refresh.

### Admin app

`admin/src/realtime/AdminRealtimeContext.jsx` subscribes once to `admin.orders` around
the protected admin shell.

| Event | Behavior |
|-------|----------|
| `.order.created` | Toast + notification; refreshes the order queue. |
| `.order.status.updated` | Toast + notification; refreshes the queue and open detail panel. |

The top bar shows a Live/Connecting/Offline connection pill. `AdminOrdersPage` consumes
the shared context instead of opening its own subscription.

## 6. Environment

Backend (`.env` / `.env.docker`):

```dotenv
BROADCAST_CONNECTION=reverb
QUEUE_CONNECTION=rabbitmq

REVERB_APP_ID=your-app-id
REVERB_APP_KEY=luffy
REVERB_APP_SECRET=your-app-secret
REVERB_HOST=localhost
REVERB_PORT=8080
REVERB_SCHEME=http
REVERB_SERVER_HOST=0.0.0.0
REVERB_SERVER_PORT=8080
```

Customer app (`frontend/.env`):

```dotenv
VITE_REVERB_APP_KEY=luffy
VITE_REVERB_HOST=localhost
VITE_REVERB_PORT=8081
VITE_REVERB_SCHEME=http
VITE_ADMIN_URL=http://localhost:5174
```

Admin app (`admin/.env`):

```dotenv
VITE_REVERB_APP_KEY=luffy
VITE_REVERB_HOST=localhost
VITE_REVERB_PORT=8081
VITE_REVERB_SCHEME=http
VITE_STOREFRONT_URL=http://localhost:5173
```

Vite reads `VITE_*` variables at startup. Restart the dev server after changing them.
Production builds need the values at build time.

## 7. Running

```bash
# from the repo root
docker compose up -d --build app queue-worker reverb web frontend admin
```

| Service | URL |
|---------|-----|
| Customer | http://localhost:5173 |
| Admin | http://localhost:5174 |
| API | http://localhost:8000 |
| Reverb | ws://localhost:8081 |
| phpMyAdmin | http://localhost:8080 |
| RabbitMQ management | http://localhost:15672 |

Local dev (backend in Docker):

```bash
cd frontend && npm install && npm run dev   # 5173
cd admin && npm install && npm run dev      # 5174
```

## 8. Testing realtime

1. Start `app`, `queue-worker`, `reverb`, `web`, `frontend`, and `admin`.
2. Sign in to the customer app at `:5173`.
3. Sign in to the admin app at `:5174` in the same browser (separate session).
4. Create an order in the customer app.
   - Admin receives the toast/notification and the order queue refreshes.
   - Customer receives the "new order" notification.
5. Change the order status in the admin app.
   - Customer receives a toast; `/orders` refreshes and `/orders/:id` patches in place.
   - Admin queue and open detail refresh.

Check the browser Network → WS frames for:

- `private-user.{userId}`
- `private-admin.orders`
- `private-orders.{orderId}` (server publishes to this channel; the customer UI now
  primarily uses `user.{userId}`)

## 9. Troubleshooting

| Symptom | Fix |
|---------|-----|
| Connection pill stays Offline | Confirm `reverb` is running and `VITE_REVERB_APP_KEY` matches `REVERB_APP_KEY`. Restart Vite after env changes. |
| Customer channel never subscribes | Ensure the auth response contains `user_id`. Sign out and back in if the session predates the field. |
| Admin channel returns 403 | Use an admin account; verify `routes/channels.php`. |
| Broadcast auth returns 401 | The access token expired and refresh failed; sign in again. |
| Events never arrive | `queue-worker` must be running (broadcasts are queued), and Reverb must be reachable on `8081` from the browser. |
| Vite cannot resolve `laravel-echo` in Docker | Run `docker compose exec frontend npm install --no-audit --no-fund` or recreate the container. The dev image now installs dependencies on start. |
| Admin app cannot reach the API | Confirm the `admin` service proxies `/api` to `web`, or set `VITE_API_BASE_URL` to the backend URL. |

## 10. Verification

- `php artisan test` — 6 tests cover the DTO payload and event/channel contracts.
- `npm run build` in `frontend/` — succeeds.
- `npm run build` in `admin/` — succeeds.
- `docker compose config -q` — valid with both SPA services.

# Ecom Test Frontend (Customer App)

A React + Vite + JavaScript single-page customer storefront for exercising the Laravel
e-commerce API. Admin operations live in a completely separate app at
[`../admin`](../admin) on port `5174`.

- UI language: **English only** (all requests send `lang: en`)
- Styling: plain CSS with dark design tokens derived from the `ui-ux-pro-max`
  design-system output (`frontend/design-system/ecom-test-frontend/MASTER.md`)
- Purpose: **testing/QA tool**, not a production storefront

---

## 1. Customer flows

| Area | Pages | API endpoints |
|------|-------|---------------|
| Register | `/register` | `POST /api/v1/user/register` |
| Login | `/login` | `POST /api/v1/user/login` |
| Email verification | `/verify-email` | `POST /verify-email`, `POST /resend-verification-code` |
| Catalog | `/catalog`, `/products/:id` | `GET /user/categories`, `GET /user/categories/:category/products`, `GET /user/products/:product` |
| Orders | `/orders`, `/orders/:id` | `GET/POST /user/orders`, `GET /user/orders/:order` |
| Session | header actions | `POST /refresh`, `POST /logout`, `POST /logout-other-devices`, `POST /logout-all-devices` |

Every page surfaces the API's `message` on success and validation/HTTP errors inline,
so the responses can be checked while testing.

---

## 2. Project structure

```
frontend/
├── Dockerfile                # multi-stage: deps / dev / build / prod (nginx)
├── nginx.conf                # SPA fallback + /api proxy for the prod image
├── .env.example              # API, admin URL, and Reverb settings
├── index.html
├── package.json
├── vite.config.js            # React plugin + /api dev proxy
├── design-system/
│   └── ecom-test-frontend/MASTER.md   # ui-ux-pro-max design tokens
└── src/
    ├── main.jsx              # bootstrap + Router + auth + realtime providers
    ├── App.jsx               # customer route table
    ├── api/
    │   ├── client.js         # Axios instance, headers, 401 refresh retry
    │   └── endpoints.js      # customer API wrappers
    ├── auth/
    │   ├── AuthContext.jsx   # session state + handlers for the client
    │   ├── storage.js        # customer localStorage session + device id
    │   └── RouteGuards.jsx   # GuestRoute / ProtectedRoute
    ├── components/
    │   ├── icons.jsx         # inline SVG icon set
    │   ├── notifications.jsx # notification bell + realtime toaster
    │   └── ui.jsx            # Alert / Field / Badge / Spinner / EmptyState
    ├── layouts/AppLayout.jsx # top bar, notification bell, session menu
    ├── pages/                # customer pages
    ├── realtime/
    │   ├── echo.js           # single Laravel Echo client for Reverb
    │   ├── usePrivateChannel.js
    │   └── CustomerRealtimeContext.jsx # user.{id} subscription + toasts
    ├── styles/global.css
    └── utils/helpers.js
```

---

## 3. Auth & session design

- Login/register responses are stored in `localStorage` under `ecom_test_auth_v1`:
  `{ role, accessToken, refreshToken, device, email, verified, userId }`.
- **`device`** comes from the API and is sent on every request as the `device` header
  (required by `check.device` and the refresh/logout endpoints).
- **`userId`** is returned by the API and is used to authorize the private
  `user.{userId}` realtime channel.
- Axios attaches `Accept: application/json`, `lang: en`, `device`, and
  `Authorization: Bearer <access_token>` on every request.
- On a **401** the client calls `POST /refresh` once (single-flight), stores the rotated
  tokens and `user_id`, and retries the original request. If refresh fails the local
  session is cleared.
- Logout buttons call the corresponding mutual endpoints and always clear local state.
- The customer app only accepts the `user` role. Any stale admin session in this
  origin is discarded.
- Admin sessions are stored separately under `ecom_admin_auth_v1` by the admin app, so
  both apps can be signed in at the same time in the same browser.

### Realtime order updates (Reverb)

- `src/realtime/echo.js` creates a single Laravel Echo client for the Reverb
  broadcaster (`laravel-echo` + `pusher-js`). It authenticates private channels
  through `POST /api/broadcasting/auth` using the stored Bearer token and `device`
  header.
- `CustomerRealtimeProvider` subscribes once to private `user.{userId}` after login:
  - `.order.created` → notification + toast, increments the order revision.
  - `.order.status.updated` → notification + toast, patches the open detail page,
    and debounces a refresh on `/orders`.
- `AppLayout` renders the notification bell and the global toast stack.
- Broadcasts are queued (`ShouldBroadcast` → RabbitMQ), so the backend
  `queue-worker` container must be running. Server-side publishing uses
  `REVERB_PORT=8080` (container port); browsers connect to
  `VITE_REVERB_PORT=8081` (host mapping).
- Existing sessions created before `user_id` was returned need a fresh login or
  token refresh before the customer channel can subscribe.

---

## 4. UI/UX approach

- Fira Sans for body text, Fira Code for headings/labels and monospace API data.
- Dark glass surface palette (`#0f172a` background, green `#22c55e` accent) with
  status badges (green/amber/red) so API state is easy to scan.
- Accessible forms: visible labels, `onSubmit` feedback, inline errors with
  `role="alert"`, skip link, visible focus rings, `prefers-reduced-motion` support.
- Responsive layouts at 375/768/1024/1440 px; tables are wrapped in horizontal scroll
  containers; cards stack on small screens.
- No emoji-as-icons; icons are inline SVG components with no runtime icon dependency.

---

## 5. Running the customer app

### Option A — Docker Compose (recommended)

The root `docker-compose.yml` defines `frontend` (port `5173`) and `admin` (port
`5174`). Each proxies `/api` to the backend `web` container.

```bash
# from the repo root
docker compose up -d --build frontend admin
# customer: http://localhost:5173
# admin:    http://localhost:5174
# backend:  http://localhost:8000
```

The dev containers mount their app directories and use anonymous volumes for
`node_modules`, so edits hot-reload.

### Option B — Local dev

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173, proxies /api -> http://localhost:8000
npm run build        # production build into dist/
npm run preview      # preview the build
```

Environment:

```bash
VITE_API_BASE_URL=/api/v1
VITE_PROXY_TARGET=http://localhost:8000
VITE_ADMIN_URL=http://localhost:5174       # link to the separate admin app
VITE_REVERB_APP_KEY=luffy                  # must match backend REVERB_APP_KEY
VITE_REVERB_HOST=localhost
VITE_REVERB_PORT=8081                      # host-mapped Reverb port (Docker)
VITE_REVERB_SCHEME=http
```

If the frontend is served from a different host than the API, set
`VITE_API_BASE_URL=http://localhost:8000/api/v1` and allow CORS on the backend.

---

## 6. Testing notes / known limitations

- This app is intentionally a **testing console**: it exposes raw JSON for products/orders
  and prefers explicit submit buttons over heavily optimized UX.
- The API requires **Arabic fields** (`name_ar`, `description_ar`) on category/product
  create/update even though the UI is English; the admin app includes those fields.
- The admin categories endpoint paginates at 5 per page; the admin product page walks
  pages to build the category selector.
- Registration auto-verifies the account server-side (no verification email is sent);
  the legacy verify-email screen remains for older unverified accounts.
- Realtime relies on both the `reverb` and `queue-worker` containers. If either is down,
  pages still work via their manual Refresh buttons.

---

## 7. Verification performed

- `npm install` — succeeds, including `laravel-echo` and `pusher-js`.
- `npm run build` — production build succeeds (Vite 7, 124 modules).
- `php artisan test` — 6/6 tests pass.
- `docker compose config -q` — compose file is valid with both frontend services.

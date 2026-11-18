# Ecom Test Frontend

A React + Vite + JavaScript single-page app for exercising the Laravel e-commerce API
(the Postman collection in the repo root). It covers both **customer** and **admin**
flows in one app, uses **Axios** for all HTTP calls, and is wired for **Docker**.

- UI language: **English only** (all requests send `lang: en`)
- Styling: plain CSS with design tokens derived from the `ui-ux-pro-max` design-system output
  (`frontend/design-system/ecom-test-frontend/MASTER.md`)
- Purpose: **testing/QA tool**, not a production storefront UI

---

## 1. What was built

### Customer flows
| Area | Pages | API endpoints |
|------|-------|---------------|
| Register | `/register` | `POST /api/v1/user/register` |
| Login | `/login` | `POST /api/v1/user/login` |
| Email verification | `/verify-email` | `POST /verify-email`, `POST /resend-verification-code` |
| Catalog | `/catalog`, `/products/:id` | `GET /user/categories`, `GET /user/categories/:category/products`, `GET /user/products/:product` |
| Orders | `/orders`, `/orders/:id` | `GET/POST /user/orders`, `GET /user/orders/:order` |
| Session | header actions | `POST /refresh`, `POST /logout`, `POST /logout-other-devices`, `POST /logout-all-devices` |

### Admin flows
| Area | Page | API endpoints |
|------|------|---------------|
| Admin login | `/admin/login` | `POST /api/v1/admin/login` |
| Dashboard | `/admin/dashboard` | navigation hub |
| Categories | `/admin/categories` | `GET/POST /admin/categories`, `GET/PUT/DELETE /admin/categories/:id` |
| Products | `/admin/products` | `GET /admin/categories/:category/products`, `POST/PUT/DELETE /admin/products`, `/products/:id/images` |
| Orders | `/admin/orders` | `GET /admin/orders`, `GET /admin/orders/statuses`, `GET /admin/orders/:id`, `PATCH /admin/orders/:id/status` |

Every page surfaces the API's `message` on success and validation/HTTP errors inline,
so the responses can be checked while testing.

---

## 2. Project structure

```
frontend/
├── Dockerfile                # multi-stage: deps / dev / build / prod (nginx)
├── nginx.conf                # SPA fallback + /api proxy for the prod image
├── .env.example              # VITE_API_BASE_URL, VITE_PROXY_TARGET
├── index.html
├── package.json
├── vite.config.js            # React plugin + /api dev proxy
├── design-system/
│   └── ecom-test-frontend/MASTER.md   # ui-ux-pro-max design tokens
└── src/
    ├── main.jsx              # React bootstrap + Router + AuthProvider
    ├── App.jsx               # route table (public / user / admin)
    ├── api/
    │   ├── client.js         # Axios instance, headers, 401 refresh retry
    │   └── endpoints.js      # typed API wrappers per collection folder
    ├── auth/
    │   ├── AuthContext.jsx   # session state + handlers for the client
    │   ├── storage.js        # localStorage session + device id helpers
    │   └── RouteGuards.jsx   # GuestRoute / ProtectedRoute / AdminRoute
    ├── components/ui.jsx     # Alert / Field / Badge / Spinner
    ├── layouts/AppLayout.jsx # top bar, logout actions, footer
    ├── pages/                # customer pages
    │   ├── HomePage.jsx
    │   ├── LoginPage.jsx
    │   ├── RegisterPage.jsx
    │   ├── VerifyEmailPage.jsx
    │   ├── CatalogPage.jsx
    │   ├── ProductPage.jsx
    │   ├── OrdersPage.jsx
    │   ├── OrderDetailPage.jsx
    │   └── admin/
    │       ├── AdminLoginPage.jsx
    │       ├── AdminDashboardPage.jsx
    │       ├── AdminCategoriesPage.jsx
    │       ├── AdminProductsPage.jsx
    │       └── AdminOrdersPage.jsx
    ├── styles/global.css     # design tokens + component styles
    └── utils/helpers.js      # response normalization, date formatting
```

---

## 3. Auth & session design

- Login/register responses are stored in `localStorage` under `ecom_test_auth_v1`:
  `{ role, accessToken, refreshToken, device, email, verified }`.
- **`device`** comes from the API and is sent on every request as the `device` header
  (required by `check.device` and the refresh/logout endpoints).
- Axios attaches `Accept: application/json`, `lang: en`, `device`, and
  `Authorization: Bearer <access_token>` on every request.
- On a **401** the client calls `POST /refresh` once (single-flight), stores the rotated
  tokens, and retries the original request. If refresh fails the local session is cleared.
- Logout buttons call the corresponding mutual endpoints and always clear local state.
- Admin and user sessions share the same store but the `role` field gates routes
  (`AdminRoute` vs `ProtectedRoute role="user"`).

### Realtime order updates (Reverb)

- `src/realtime/echo.js` creates a single Laravel Echo client for the Reverb
  broadcaster (`laravel-echo` + `pusher-js`). It authenticates private channels
  through `POST /api/broadcasting/auth` using the stored Bearer token and `device`
  header.
- `src/realtime/usePrivateChannel.js` subscribes/unsubscribes on mount and on
  session changes, exposing `useRealtimeConnection()` for the Live/Offline badge.
- Subscriptions:
  - `AdminOrdersPage` → private `admin.orders`: `.order.created` and
    `.order.status.updated` trigger a debounced refetch (and refresh the open
    detail panel).
  - `OrderDetailPage` → private `orders.{id}`: `.order.status.updated` patches the
    status/label in place.
- Broadcasts are queued (`ShouldBroadcast` → RabbitMQ), so the backend
  `queue-worker` container must be running. Server-side publishing uses
  `REVERB_PORT=8080` (container port); browsers connect to
  `VITE_REVERB_PORT=8081` (host mapping).
- `OrderCreatedNotification` is also queued and sends the order confirmation email.

---

## 4. UI/UX approach (ui-ux-pro-max)

The `ui-ux-pro-max` skill was used to generate a design system before coding
(`frontend/design-system/ecom-test-frontend/MASTER.md`). The app applies:

- Fira Sans for body text, Fira Code for headings/labels and monospace API data.
- A light, high-contrast surface palette with teal primary and status badges
  (green/amber/red) so API state is easy to scan.
- Accessible forms: visible labels, `onSubmit` feedback, inline errors with `role="alert"`,
  visible focus rings, `prefers-reduced-motion` support.
- Responsive layouts at 375/768/1024/1440 px; tables are wrapped in horizontal scroll
  containers; cards stack on small screens.
- No emoji-as-icons; no icon dependency is required for this test console.

Focused UX checks that informed the build:
- submit feedback (loading → success/error) on every form;
- focusable error/alert regions;
- table overflow handling on mobile;
- debounce-friendly search fields (manual submit to keep API calls explicit).

---

## 5. Running the frontend

### Option A — Docker Compose (recommended for backend + frontend together)

A `frontend` service was added to the root `docker-compose.yml` (dev target, port `5173`).
It proxies `/api` to the backend `web` container.

```bash
# from the repo root
docker compose up -d --build frontend
# app: http://localhost:5173
# backend API: http://localhost:8000
```

The dev container mounts `./frontend` and uses an anonymous volume for `node_modules`,
so edits hot-reload. To run the production image instead:

```bash
docker build --target prod -t ecommerce-frontend:prod ./frontend
docker run --rm -p 5173:80 ecommerce-frontend:prod
```

> The prod nginx config proxies `/api/` to `http://web:80`, so run it on the same
> Compose network (or adjust `frontend/nginx.conf` for another backend host).

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
VITE_API_BASE_URL=/api/v1                  # Axios base path (default)
VITE_PROXY_TARGET=http://localhost:8000    # Vite dev proxy target
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
  create/update even though the UI is English; the forms include those fields.
- The admin categories endpoint paginates at 5 per page, so the product page walks pages
  to build the category selector.
- Registration now auto-verifies the account server-side (no verification email is sent);
  the legacy verify-email screen remains for older unverified accounts.
- Realtime relies on both the `reverb` and `queue-worker` containers. If either is down,
  pages still work via their manual Refresh buttons.
- No new automated tests were added for the frontend; verification was `npm run build`
  plus the backend test suite (`php artisan test`).

---

## 7. Verification performed

- `npm install` — succeeds, including `laravel-echo` and `pusher-js`.
- `npm run build` — production build succeeds (Vite 7, 126 modules).
- `npm run dev` — dev server responds `HTTP 200` at `http://localhost:5173/`.
- `php artisan test` — 2/2 tests pass.
- `docker compose config -q` — compose file remains valid after adding the `frontend` service.

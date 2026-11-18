# تحليل مشروع التجارة الإلكترونية (E-Commerce Project)

> ملف تحليل شامل للمعمارية، البنية، التدفقات، والتقنيات المستخدمة في المشروع.

---

## 1. نظرة عامة

المشروع عبارة عن **نظام تجارة إلكترونية / إدارة مخزون** مبني على **Laravel 13 (PHP 8.3)** كخدمة رئيسية (API فقط)،
يتكامل مع **خدمة مستودع (Warehouse Service)** مستقلة مبنية على **NestJS + gRPC** وتُدار عبر **TypeORM** مع **MySQL**.

الهدف الأساسي للمشروع (بناءً على `README.md` وسكربتات الاختبار) هو **إثبات دقة التعامل مع المخزون** في السيناريوهات الحرجة:

1. حجز الكميات عند إنشاء الطلب (Reservation).
2. إعادة الكميات عند إلغاء الطلب (Release).
3. التعامل مع توقف خدمة المستودع (Failure handling).
4. منع **Race Condition** عند الطلبات المتزامنة.
5. رفض الطلب بالكامل إذا كان أي منتج غير متوفر (All-or-nothing).
6. الحفاظ على سلامة المخزون ومنع الكميات السالبة (never negative).

المشروع يوفّر واجهتين منفصلتين: **واجهة المستخدم العادي (User)** و**واجهة المسؤول (Admin)**.

---

## 2. التقنيات المستخدمة

### الخدمة الرئيسية (Laravel)

| التقنية | الإصدار | الدور |
| --- | --- | --- |
| PHP | `^8.3` | لغة التشغيل |
| laravel/framework | `^13.17` | إطار العمل الأساسي |
| laravel/sanctum | `^4.0` | إدارة التوكنات (Access Tokens) |
| spatie/laravel-permission | `^8.3` | الأدوار والصلاحيات (Roles/Permissions) |
| grpc/grpc | `^1.85` | (موجود) لكن الاتصال الفعلي بالمستودع يتم عبر cURL/HTTP2 يدويًا |
| laravel/tinker | `^3.0` | بيئة تنفيذ تفاعلية |
| laravel/pint | `^1.27` | منسّق الكود |
| phpunit/phpunit | `^12.5` | اختبارات |
| yasin_tgh/laravel-postman | `^1.5` | توليد مجموعات Postman |

### الواجهة الأمامية (Frontend tooling)

| التقنية | الإصدار | الدور |
| --- | --- | --- |
| Vite | `^8.0` | أداة البناء |
| Tailwind CSS | `^4.0` | التنسيق (مع `@tailwindcss/vite`) |
| laravel-vite-plugin | `^3.1` | ربط Vite بـ Laravel |

> ملاحظة: الواجهة الأمامية بسيطة جدًا (Blade: `welcome`, `email/verify-email`). المشروع موجّه أساسًا كـ API.

### خدمة المستودع (Warehouse Service)

| التقنية | الدور |
| --- | --- |
| NestJS (microservices) | إطار العمل (gRPC microservice) |
| gRPC (`@GrpcMethod`) | بروتوكول الاتصال، يعمل على `0.0.0.0:50051` |
| TypeORM | ORM مع `synchronize: true` |
| MySQL 8.0 | قاعدة بيانات المخزون |
| Vitest | اختبارات الوحدة/e2e |

---

## 3. المعمارية العامة

النظام مبني على **نمط الخدمات المنفصلة (Microservices-lite)**:

```
                    ┌──────────────────────────────┐
                    │        العميل (Postman/App)   │
                    └───────────────┬──────────────┘
                                    │ HTTP (JSON)
                                    ▼
                    ┌──────────────────────────────┐
                    │   Nginx (web) :80 → :8000     │
                    └───────────────┬──────────────┘
                                    ▼
        ┌───────────────────────────────────────────────────┐
        │        Laravel (app)  –  REST API  /api/v1/*       │
        │  Controllers → Services → Models → MySQL (db)      │
        │  Sanctum (Tokens) + Spatie (Roles)                 │
        │  Rate Limiting + Cache (Redis) + Policies          │
        └───────────────┬───────────────────────┬───────────┘
                        │                       │
              MySQL (ecommerce)          gRPC/HTTP2 (cURL)
                        │                       │
              ┌─────────▼─────────┐   ┌─────────▼──────────────┐
              │ db (MySQL 8.4)     │   │ Warehouse (NestJS)      │
              │ db_replica (RO)    │   │  :50051 gRPC            │
              │ phpMyAdmin :8080   │   │  TypeORM → warehouse_db │
              └────────────────────┘   └────────────────────────┘
                        │
                 Redis :6379 (Cache / Rate limit)
```

**الخصائص المعمارية المهمة:**

- فصل كامل بين بيانات **الكتالوج/الطلبات** (Laravel DB) وبيانات **المخزون** (Warehouse DB).
- الاتصال بين الخدمتين عبر **gRPC**، لكن Laravel لا يستخدم مكتبة gRPC الرسمية بل يبني رسائل **Protocol Buffers يدويًا** ويرسلها عبر **cURL بـ HTTP/2**.
- وجود **نسخة قراءة (replica)** لقاعدة البيانات (`db_replica`) — قراءة فقط.

---

## 4. بنية المجلدات (Laravel)

```
app/
├── Actions/                  # SendEmailVerificationCodeAction
├── DTOs/V1/                  # كائنات نقل البيانات (AuthInfo, Refresh, User/Admin)
├── Enums/                    # OrderStatus, RoleEnum, TokenNameEnum
├── Http/
│   ├── Controllers/V1/
│   │   ├── Admin/            # تحكم المسؤول
│   │   ├── User/             # تحكم المستخدم
│   │   └── Mutual/           # مشترك (refresh/logout)
│   ├── Middleware/           # 7 وسائط مخصصة
│   ├── RateLimiters/         # محدّدات معدل الطلبات
│   ├── Requests/V1/          # التحقق من المدخلات (Form Requests)
│   └── Resources/V1/         # تحويل المخرجات (API Resources)
├── Models/                   # Category, Device, Order, OrderItem, Product, ProductImage, User
├── Notifications/            # VerifiyEmailNotification
├── Policies/                 # Category, Order, ProductImage, Product
├── Providers/                # AppServiceProvider, RateLimitingServiceProvider
├── Services/
│   ├── Mutual/               # المصادقة المشتركة + إدارة الأجهزة/التوكنات
│   ├── V1/Admin/             # خدمات المصادقة/الصور للمسؤول
│   ├── V1/User/              # خدمة مصادقة المستخدم
│   └── Warehouse/            # عميل المستودع (gRPC/Protobuf)
└── Traits/                   # JsonResponseTrait

routes/
├── api.php                   # نقطة الدخول، prefix: v1
└── v1/{user_v1.php, admin_v1.php}

warehouse_service/            # خدمة NestJS + gRPC
├── proto/warehouse.proto
└── src/{main.ts, app.module.ts, warehouse.controller.ts, warehouse.service.ts, stock.entity.ts}
```

---

## 5. نموذج قاعدة البيانات (Laravel)

| الجدول | الحقول الأساسية | ملاحظات |
| --- | --- | --- |
| `users` | id, name, email (unique), email_verified_at, password | يستخدم Sanctum + Spatie |
| `devices` | user_id, identifier (unique,60), refresh_token(64), salt(32), fcm_token, token_expires_at | **نواة نظام الجلسات بالأجهزة** |
| `personal_access_tokens` | + `device_id` (FK→devices, cascade) | ربط التوكن بجهاز |
| `categories` | name_en (unique), name_ar (unique) | تعدد اللغات |
| `products` | category_id (FK), name_en/ar (unique), description_en/ar | تعدد اللغات |
| `product_images` | product_id (FK cascade), path | حد أقصى 5 صور للمنتج |
| `orders` | user_id (FK cascade), status (enum), reservation_id (uuid, unique, nullable) | `reservation_id` يربط الطلب بالحجز في المستودع |
| `order_items` | order_id (FK cascade), product_id (FK **restrict**) | لا يمكن حذف منتج مرتبط بطلب |
| جداول Spatie | roles / permissions / pivots | guard = `api` |

**الفهارس (Indexes):** أُضيفت فهارس أداء في `2026_11_11_125709_add_performance_indexes_to_products_and_orders_tables.php` على `products` و `orders`.

**حالات الطلب (`OrderStatus`):**
`pending → confirmed → processing → shipped → delivered`، وأيضًا `cancelled`.

---

## 6. تدفق المصادقة (Authentication Flow)

يعتمد النظام على **نموذج Access Token + Refresh Token مرتبط بالجهاز (Device-bound)**، وهو أبرز ما يميّز المشروع.

### 6.1 تسجيل / دخول (User & Admin)

```
register/login
   └─> TokenDeviceManagementService::issueTokenPair()
         ├─ توليد refresh_token عشوائي (64) + salt (32)
         ├─ إنشاء سجل Device (identifier عشوائي 60)
         │     refresh_token المخزّن = sha256(refresh + salt)
         ├─ إنشاء Access Token عبر Sanctum (personal_access_tokens)
         └─ ربط التوكن بالجهاز: token.accessToken.device_id = device.id
```

- الـ `identifier` (معرّف الجهاز) يُعاد للعميل ويجب إرساله في **هيدر `device`** مع كل طلب محمي.
- التوكنات الصادرة: ما لا يمكن استخدامه إلا إذا تطابق الجهاز.

### 6.2 التجديد (Refresh)

- المسار: `POST /api/v1/refresh` → وسيط `can.refresh`.
- الوسيط يتحقق أن المستخدم **غير مصادق حاليًا**، وأن الجهاز موجود وأن `token_expires_at` لم ينتهِ.
- الخدمة تتحقق: `hash_equals(device.refresh_token, sha256(refresh+salt))` — عند الفشل أو الانتهاء **يُحذف الجهاز وتوكناته**. عند النجاح تُولّد `refresh_token` جديد (Rotation).

### 6.3 تسجيل الخروج

- `logout`: يحذف جهاز المستخدم الحالي.
- `logout-other-devices`: يحذف كل الأجهزة ما عدا الحالي.
- `logout-all-devices`: يحذف كل الأجهزة (محمي بـ `verified`).

### 6.4 التحقق من البريد الإلكتروني

- `SendEmailVerificationCodeAction`: يولّد كود OTP (6 أحرف) يخزّنه في **Cache لمدة 10 دقائق** (`verification_code_{user_id}`) ويرسل إشعارًا بالبريد (مع دعم اللغة).
- `verify_email`: يقارن الكود مع القيمة المخزّنة، وعند النجاح يضبط `email_verified_at` ويحذف الكود.

---

## 7. تدفق الطلبات والمخزون (الأهم في المشروع)

### 7.1 إنشاء طلب — `POST /api/v1/user/orders`

في `UserOrderController::store`:

1. تفويض عبر `OrderPolicy::create` (المستخدم العادي فقط).
2. حساب `quantities = array_count_values(product_ids)` (كمية كل منتج).
3. توليد `reservation_id` (UUID).
4. **حجز المخزون أولًا** في خدمة المستودع عبر `WarehouseClient::reserve`:
   - نجاح → 201.
   - فشل حجز (عدم توفر كمية) → **409** مع رسالة عدم الكفاية.
   - تعذّر الوصول للخدمة → **503** (السجل يُكتب في `Log`).
5. **إنشاء الطلب داخل معاملة (DB::transaction)** مع `order_items`.
6. في حال فشل معاملة قاعدة البيانات → **تحرير الحجز** (`release`) كخطوة تعويضية (compensation)، ورمي الاستثناء.

> المبدأ: **الحجز في المستودع أولًا، ثم التسجيل في قاعدة بيانات الطلبات**، مع تعويض عكسي عند فشل الخطوة الثانية.

### 7.2 إلغاء الطلب — `PATCH /api/v1/admin/orders/{order}/status`

في `AdminOrderController::updateStatus`:

- لا يُسمح بإلغاء طلب `delivered`.
- لا يُسمح بإعادة فتح طلب `cancelled`.
- عند التحويل إلى `cancelled`: يُستدعى `warehouse->release(reservation_id)`، وإذا فشل → 409، وتعذّر الوصول → 503.

### 7.3 عرض المنتجات مع كمية المخزون — `GET /api/v1/user/categories/{category}/products`

في `UserProductController::index`:

- استعلام المنتجات مُخزّن مؤقتًا في **Cache tags `products`** لمدة 10 دقائق (المفتاح يشمل: category, locale, name hash, page).
- لكل منتج يُستدعى `warehouse->getQuantity`.
- إذا تعذّر الوصول للمستودع → تتوقف محاولات الجلب ويُعاد `stock_message` ("Stock information is temporarily unavailable") مع `available_quantity = null`.
- `show` يستخدم **ETag** (`setEtag` + `isNotModified`) لدعم التخزين المؤقت من طرف العميل.

---

## 8. خدمة المستودع (Warehouse Service — NestJS + gRPC)

### 8.1 العقد (Proto)

```proto
service Warehouse {
  rpc GetQuantity (GetQuantityRequest) returns (GetQuantityResponse);
  rpc Reserve (ReserveRequest) returns (ReserveResponse);
  rpc Release (ReleaseRequest) returns (ReleaseResponse);
}
message Item { int32 product_id = 1; int32 quantity = 2; }
message ReserveRequest  { string reservation_id = 1; repeated Item items = 2; }
message ReserveResponse { bool success = 1; string message = 2; }
message ReleaseResponse { bool success = 1; }
```

### 8.2 الكيانات (TypeORM)

- `stock`: `productId` (PrimaryKey), `quantity`.
- `reservations`: `reservationId` (PrimaryKey), `items` (JSON), `status` (`RESERVED`/`RELEASED`).

### 8.3 منطق الحجز — `reserve`

كل شيء داخل **معاملة**:

1. Idempotency: إذا كان `reservationId` موجودًا مسبقًا → تجاهل (return) — يمنع التكرار.
2. ترتيب المنتجات تصاعديًا حسب `productId` — **يمنع الجمود (Deadlock)** بين المعاملات المتزامنة.
3. لكل منتج:
   ```sql
   UPDATE stock SET quantity = quantity - ?
   WHERE productId = ? AND quantity >= ?
   ```
   إذا كان `affectedRows !== 1` → رمي `OutOfStock` → **تراجع المعاملة بالكامل** (لا حجز جزئي).
4. إدراج سجل `Reservation` بحالة `RESERVED`.

**هذا التصميم هو جوهر الحل لمشكلة Race Condition:** شرط `quantity >= ?` داخل جملة `UPDATE` الذرية يمنع البيع الزائد والكميات السالبة.

### 8.4 منطق التحرير — `release`

- قفل متفائل/تشاؤمي (`pessimistic_write`) على سجل الحجز.
- إذا كان `status !== 'RESERVED'` → إرجاع `false` (يمنع التحرير المزدوج).
- إعادة الكميات لكل منتج (`quantity + ?`)، ثم تحويل الحالة إلى `RELEASED`.

### 8.5 عميل Laravel (`WarehouseClient`)

- يبني رسائل Protobuf يدويًا (انظر `Protobuf.php`: `varint`, `intField`, `stringField`, `messageField`, `decode`).
- يرسل عبر cURL بـ `CURL_HTTP_VERSION_2_PRIOR_KNOWLEDGE` إلى `http://{host}/warehouse.Warehouse/{method}`.
- يتحقق من هيدر `grpc-status`؛ أي خطأ أو تعذّر وصول → `WarehouseUnavailableException`.
- المهلة (timeout) افتراضيًا **3000ms** (قابلة للضبط بـ `WAREHOUSE_TIMEOUT_MS`).

---

## 9. الوسائط (Middleware)

| الاسم (Alias) | الصنف | الوظيفة |
| --- | --- | --- |
| `auth.user` | CheckUserMiddleware | يجب أن يمتلك المستخدم دور `user` |
| `auth.admin` | CheckAdminMiddleware | يجب أن يمتلك المستخدم دور `admin` |
| `check.device` | CheckAccessTokenDeviceMiddleware | تطابق هيدر `device` مع جهاز التوكن، وإلا يُحذف الجهاز |
| `can.refresh` | CheckCanRefreshMiddleware | للتجديد: مستخدم غير مصادق + جهاز صالح غير منتهٍ |
| `verified` | EnsureEmailIsVerified | البريد مُوثّق |
| `not_verified` | CheckEmailIsNotVerifiedMiddleware | البريد **غير** مُوثّق |
| `check_language` | CheckLanguageMiddleware | يقرأ هيدر `lang` (افتراضي `ar`)، يضبط اللغة، ويخزّنها لكل مستخدم 30 يومًا |

`CheckLanguageMiddleware` مُضاف **عالميًا** (append) في `bootstrap/app.php`.

---

## 10. الأمان والصلاحيات

### 10.1 تحديد معدل الطلبات (Rate Limiting)

مُسجّلة ديناميكيًا عبر `RateLimitingServiceProvider` من `config/rate_limiters.php`:

- **UserLoginRateLimiter**, **AdminLoginRateLimiter**, **EmailVerificationRateLimiter**.
- مثال `AdminLoginRateLimiter` (دفاع متعدد الطبقات):
  - 8 محاولات / 5 دقائق (IP + البريد).
  - 20 محاولة / 1440 دقيقة (البريد).
  - 60 محاولة / 1440 دقيقة (IP).

### 10.2 السياسات (Policies)

مسجّلة في `AppServiceProvider`:

| السياسة | القاعدة البارزة |
| --- | --- |
| `OrderPolicy` | `view`: admin أو صاحب الطلب — `create`: `user` فقط — `update`: admin فقط |
| `ProductPolicy` | الإنشاء/التعديل/الحذف لـ admin، العرض للجميع |
| `CategoryPolicy` / `ProductImagePolicy` | (على نمط مشابه) |

### 10.3 معالجة الاستثناءات

في `bootstrap/app.php` تُعاد جميع أخطاء الـ API بصيغة JSON موحّدة مع ترجمة الرسائل:
`401` مصادقة، `403` صلاحيات، `404` غير موجود، `422` تحقق، `429` تحديد المعدل،
واستثناء عام غير متوقع يُعاد بالكود **`222`** مع تسجيل كامل للتفاصيل.

> ملاحظة: استخدام كود **222** للأخطاء غير المتوقعة غير قياسي ويجب الانتباه له عند التكامل مع الواجهة.

---

## 11. واجهات الـ API (نقاط النهاية)

البادئة العامة: **`/api/v1`**

### User

| Method | Route | الحماية |
| --- | --- | --- |
| GET | `/user/categories` | عام |
| GET | `/user/categories/{category}/products` | عام |
| GET | `/user/products/{product}` | عام |
| POST | `/user/register` | عام |
| POST | `/user/login` | `throttle:user_login` |
| POST | `/user/verify-email` | auth + device + not_verified + throttle |
| POST | `/user/resend-verification-code` | auth + device + not_verified + throttle |
| GET/POST/SHOW | `/user/orders` | auth + user + device + verified |

### Admin

| Method | Route | الحماية |
| --- | --- | --- |
| POST | `/admin/login` | `throttle:admin_login` |
| apiResource | `/admin/categories` | auth + admin + device |
| GET | `/admin/categories/{category}/products` | محمي |
| POST/GET/PUT/PATCH/DELETE | `/admin/products...` | محمي |
| POST | `/admin/products/{product}/images` | محمي |
| DELETE | `/admin/products/{product}/images/{productImage}` | محمي |
| GET | `/admin/orders`, `/admin/orders/statuses`, `/admin/orders/{order}` | محمي |
| PATCH | `/admin/orders/{order}/status` | محمي |

### Mutual (مشترك)

| Method | Route | الحماية |
| --- | --- | --- |
| POST | `/refresh` | `can.refresh` |
| POST | `/logout` | auth:sanctum |
| POST | `/logout-other-devices` | auth + verified |
| POST | `/logout-all-devices` | auth + verified |

---

## 12. البنية التحتية (Docker)

`docker-compose.yml` يشغّل 8 خدمات:

| الخدمة | الصورة | المنفذ/الدور |
| --- | --- | --- |
| `app` | مبنية من `Dockerfile` (PHP-FPM 8.3) | تشغيل Laravel |
| `web` | nginx:1.27-alpine | `8000:80` |
| `phpmyadmin` | phpmyadmin:5-apache | `8080:80` |
| `db` | mysql:8.4 | مع binlog (ROW) لدعم النسخ المتماثل |
| `db_replica` | mysql:8.4 | نسخة قراءة فقط (`read-only`) |
| `redis` | redis:7-alpine | Cache / Rate limit (256MB, allkeys-lru) |
| `warehouse_db` | mysql:8.0-debian | قاعدة بيانات المستودع |
| `warehouse` | node:22-bookworm-slim | تشغيل `dist/main.js` (gRPC :50051) |

**Dockerfile** متعدد المراحل (Multi-stage): `frontend` (بناء Vite) → `dependencies` (Composer) → `application` (PHP-FPM + إضافات: bcmath, intl, mbstring, opcache, pdo_mysql, pdo_sqlite, redis).

---

## 13. بيانات الاختبار (Seeders)

`DatabaseSeeder` يستدعي: `RoleSeeder`, `AdminUserSeeder`, `UserSeeder`, `DemoProductsSeeder`.

| الحساب | البريد | كلمة المرور | الدور |
| --- | --- | --- | --- |
| Admin | `admin@ecommerce.com` | `password` | admin |
| User | `user@ecommerce.com` | `password` | user |

- الأدوار المُنشأة: `admin`, `organizer`, `user` (guard = `api`).
- يوجد أيضًا `CatalogSeeder` و `PerformanceTestSeeder` (لاختبار الأداء) و `DemoProductsSeeder`.

---

## 14. ملاحظات وتقييم تقني

### نقاط قوة
- **فصل واضح للطبقات**: Controllers → Services → Models، مع DTOs و Resources و Policies.
- **تصميم مخزون ذرّي عالي الدقة**: `UPDATE ... WHERE quantity >= ?` + ترتيب المنتجات + Idempotency + معاملات.
- **تعويض عكسي (Compensation)**: تحرير الحجز إذا فشلت معاملة إنشاء الطلب.
- **أمان جلسات قوي**: ربط التوكن بالجهاز + تدوير Refresh Token + Hash مع Salt.
- **دفاع متعدد الطبقات**: Rate limiting، Policies، توثيق البريد، معالجة أخطاء موحّدة ومترجمة.
- **أداء**: Cache tags، ETag، فهارس قاعدة البيانات، Redis.

### نقاط تحتاج انتباهًا
- **عميل gRPC يدوي بـ cURL**: لا يستخدم `grpc/grpc` المُثبّت، مما يجعل الإنشاء/التحليل الهشّ (hand-rolled) عرضة للأخطاء؛ يمكن استبداله ببروتوكول gRPC الرسمي أو عميل محمول مُولّد.
- **كود الاستثناء العام `222`** غير قياسي.
- **`synchronize: true`** في TypeORM (المستودع) خطر في الإنتاج.
- **`RefreshDTO`/`AuthInfoDTO`** بعض المعالجات (مثل تعيين `fcm_token` في الدخول) غير مكتملة التدفق.
- **الاختبارات شبه فارغة**: `tests/` تحتوي على `ExampleTest` فقط بينما ملفات `race_*.php` و `load-test.js` تُستخدم يدويًا.
- **توثيق مختلط اللغات**: ترجمات `ar` يشمل `validation` بينما `ar.json`/`en.json` للرسائل.

### سكربتات الاختبار اليدوية (في الجذر)
- `race_all.php`, `race_orders.php`, `race_test.php`: محاكاة طلبات متزامنة (Race Condition).
- `load-test.js`: اختبار حمل.

---

## 15. طريقة التشغيل (مختصر)

```bash
# 1) توليد مفتاح التطبيق ووضعه في .env
docker run --rm -v "${PWD}:/app" -w /app php:8.3-cli php artisan key:generate --show

# 2) بناء خدمة المستودع
docker run --rm -v "${PWD}/warehouse_service:/app" -w /app node:22-bookworm-slim sh -c "npm install && npm run build"

# 3) بناء وتشغيل الحاويات
docker compose up -d --build

# 4) الهجرات والـ Seeders
docker compose exec app php artisan migrate --seed

# 5) إدخال المخزون الابتدائي لمنتجات المستودع (productId, quantity)
docker compose exec warehouse_db mysql -uroot -proot warehouse -e \
  "INSERT INTO stock (productId, quantity) VALUES (1,10),(2,5),(3,1) ON DUPLICATE KEY UPDATE quantity = VALUES(quantity);"
```

- التطبيق: `http://localhost:8000`
- phpMyAdmin: `http://localhost:8080`

---

## 16. الإصلاحات المطبَّقة لتشغيل المشروع (Docker / MySQL Replica)

عند محاولة التشغيل كان التطبيق يفشل لأن نظام **فصل القراءة/الكتابة** يوجّه كل القراءات إلى `db_replica`، وهذه الأخيرة كانت غير قابلة للاستخدام:

```
SQLSTATE[HY000] [1130] Host '172.18.0.2' is not allowed to connect to this MySQL server
(Connection: mysql, Host: db_replica, Port: 3306, Database: ecommerce)
```

**السبب الجذري:**

- المستخدم `ecommerce` على `db_replica` غير مهيّأ للاتصال عن بُعد → خطأ `1130`.
- لا يوجد أي إعداد للنسخ المتماثل (replication) في `docker-compose.yml`.
- الخياران `--read-only=ON --super-read-only=ON` في أمر `db_replica` كانا **يمنعان الحاوية من تهيئة نفسها** (إنشاء القاعدة/المستخدم).

### 16.1 الملفات المعدّلة/المضافة

| الملف | التغيير |
| --- | --- |
| `docker-compose.yml` | حذف `--read-only=ON --super-read-only=ON` من أمر `db_replica`؛ ربط سكربت التهيئة `docker/mysql/replica-init.sh` إلى `db_replica`؛ إضافة `depends_on: db (service_healthy)`؛ ربط `docker/mysql/primary-init.sql` إلى خدمة `db`. |
| `docker/mysql/replica-init.sh` **(جديد)** | سكربت تهيئة النسخة: ينتظر جهوزية الأساسية → يأخذ `mysqldump` مع موضع binlog → يحمّله في النسخة → يضبط `CHANGE REPLICATION SOURCE TO` ويشغّل `START REPLICA` → يفعّل القراءة فقط بشكل دائم عبر `SET PERSIST`. |
| `docker/mysql/primary-init.sql` **(جديد)** | إنشاء مستخدم النسخ `repl@%` بصلاحيتي `REPLICATION SLAVE` و`REPLICATION CLIENT` عند أول تهيئة للأساسية. |

### 16.2 عمليات وقت التشغيل (على العيّنة الحالية)

- إنشاء المستخدم `repl@%` على `db`.
- حذف وإعادة إنشاء الحجم `db_replica_data` لتشغيل سكربت التهيئة من جديد.
- إعادة تشغيل حاويتي `app` و`web`.

### 16.3 نتائج التحقق

- `Replica_IO_Running = Yes` · `Replica_SQL_Running = Yes` · `Seconds_Behind_Source = 0`.
- الاتصال عن بُعد بالمستخدم `ecommerce` بالنسخة يعيد **21 جدولًا** (اختفى خطأ `1130`).
- `GET /api/v1/user/categories` → **HTTP 200**، والهجرات مرّت بنجاح.
- الإصلاح **قابل لإعادة الإنتاج**: `docker compose down -v && docker compose up -d` يعيد بناء النسخة تلقائيًا.

> **ملاحظتان مهمّتان:**
> 1. بعد إعادة إنشاء حاوية `app` يتغيّر عنوان IP الخاص بها بينما يخزّن nginx العنوان القديم (يحلّ اسم الخادم عند الإقلاع فقط)، ما يسبّب **502**؛ الحل: `docker compose restart web`.
> 2. هذه الإصلاحات لم تمسّ كود Laravel ولا NestJS ولا ملفات `.env`، بل اقتصرت على طبقة Docker/MySQL.

---

## 17. الخلاصة

مشروع **تجارة إلكترونية REST API** ناضج نسبيًا، يتميّز بأفضل من غيره في **سلامة المخزون** بفصله لخدمة مستودع مستقلة تتعامل مع **الحجز/التحرير الذرّي**، وبنظام **مصادقة مرتبط بالجهاز** مع تدوير التوكنات. المعمارية طبقية نظيفة، والأمان متعدد الطبقات. أبرز ما يحتاج تحسينًا: استبدال عميل gRPC اليدوي، تعزيز الاختبارات الآلية، وإصلاح الإعدادات غير الملائمة للإنتاج (`synchronize`, كود 222).

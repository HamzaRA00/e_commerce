# Graph Report - e-commerce  (2026-11-19)

## Corpus Check
- 71 files · ~610,837 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1286 nodes · 2308 edges · 104 communities (86 shown, 18 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 59 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Admin UI Icons
- Composer Dependencies
- Customer UI Icons
- Database Migrations
- Warehouse Node Dependencies
- Auth and Notification Services
- HTTP Middleware
- API Resources
- Two-App Realtime Docs
- Customer Pages and Helpers
- Warehouse NestJS Tooling
- Admin API and Pages
- API Form Requests
- Admin Auth and Realtime
- Warehouse gRPC Service
- Composer Scripts
- Admin Catalog Pages
- Database Seeders
- Warehouse TypeScript Config
- Customer Auth and Realtime
- Order Broadcast Events
- Admin Product Controllers
- User Catalog Controllers
- Order Models and Factories
- Product Policy and User
- Admin Authentication Service
- Category Admin Endpoints
- Laravel Best-Practice Docs
- Admin Order Status
- Customer UI Feedback
- Warehouse gRPC Client
- Customer Routing and Layout
- OpenCode MCP Config
- Token Device Management
- Refresh Token Flow
- User Order Requests
- Testing Best-Practice Docs
- Auth DTO Unit Tests
- Rate Limiters
- Warehouse Build Config
- Frontend Package Dependencies
- Catalog Model Factories
- Category Policy and Model
- Order Policy and Model
- Product Image Policy
- Root Build Dependencies
- Root Package Manifest
- Admin Package Manifest
- Realtime Client Dependencies
- Vite Build Dependencies
- Service Providers
- Customer Package Manifest
- User Factory and Requests
- Model Relationships
- Roles and Permissions
- Warehouse Lint Config
- Feature Test Scaffolding
- NestJS CLI Config
- Admin Brand Favicon
- Cache and Database Config
- Logging Config
- Sanctum Config
- Pusher Dependency Group
- Customer Brand Favicon
- Console Routes
- Laravel Boost MCP
- Deploy-to-Cloud Skill
- Infer-Conventions Skill
- Laravel Skill Rules
- RabbitMQ Config
- Docker Entrypoint
- Replica Initialization
- Load Test Script
- Warehouse Service Docs
- Tailwind Skill Docs
- Project Analysis Doc
- Robots Policy

## God Nodes (most connected - your core abstractions)
1. `User` - 56 edges
2. `UnifiedApiRequest` - 33 edges
3. `Product` - 30 edges
4. `Category` - 29 edges
5. `compilerOptions` - 20 edges
6. `getErrorMessage()` - 20 edges
7. `getErrorMessage()` - 19 edges
8. `useAuth()` - 19 edges
9. `ProductImage` - 17 edges
10. `Laravel Best Practices Skill` - 17 edges

## Surprising Connections (you probably didn't know these)
- `Laravel Boost Guidelines (AGENTS.md)` --semantically_similar_to--> `Laravel Boost Guidelines (CLAUDE.md)`  [INFERRED] [semantically similar]
  AGENTS.md → CLAUDE.md
- `Reverb WebSocket Service` --implements--> `Laravel Reverb WebSocket Broadcasting`  [INFERRED]
  docker-compose.yml → WEBSOCKET.md
- `Laravel Boost Guidelines (AGENTS.md)` --references--> `Testing Best Practices Skill`  [EXTRACTED]
  AGENTS.md → .agents/skills/testing-best-practices/SKILL.md
- `Laravel Boost Guidelines (CLAUDE.md)` --references--> `Testing Best Practices Skill`  [EXTRACTED]
  CLAUDE.md → .agents/skills/testing-best-practices/SKILL.md
- `Warehouse Service Failure Handling` --conceptually_related_to--> `Warehouse Node Service`  [INFERRED]
  README.md → docker-compose.yml

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Laravel Best Practices Rule Set** — _agents_skills_laravel_best_practices_skill_laravel_best_practices, _agents_skills_laravel_best_practices_rules_advanced_queries_advanced_queries, _agents_skills_laravel_best_practices_rules_architecture_architecture, _agents_skills_laravel_best_practices_rules_blade_views_blade_views, _agents_skills_laravel_best_practices_rules_caching_caching, _agents_skills_laravel_best_practices_rules_collections_collections, _agents_skills_laravel_best_practices_rules_config_config, _agents_skills_laravel_best_practices_rules_db_performance_db_performance, _agents_skills_laravel_best_practices_rules_eloquent_eloquent, _agents_skills_laravel_best_practices_rules_error_handling_error_handling, _agents_skills_laravel_best_practices_rules_events_notifications_events_notifications, _agents_skills_laravel_best_practices_rules_http_client_http_client, _agents_skills_laravel_best_practices_rules_mail_mail, _agents_skills_laravel_best_practices_rules_migrations_migrations, _agents_skills_laravel_best_practices_rules_queue_jobs_queue_jobs, _agents_skills_laravel_best_practices_rules_routing_routing, _agents_skills_laravel_best_practices_rules_scheduling_scheduling, _agents_skills_laravel_best_practices_rules_security_security [EXTRACTED 1.00]
- **Testing Best Practices Rule Set** — agents_skills_testing_best_practices_skill_testing_best_practices, agents_skills_testing_best_practices_rules_assertions_assertions, agents_skills_testing_best_practices_rules_endpoint_tests_endpoint_tests, agents_skills_testing_best_practices_rules_finding_features_finding_test_framework_features, agents_skills_testing_best_practices_rules_isolation_fakes_mocks_and_determinism, agents_skills_testing_best_practices_rules_naming_naming_and_structure, agents_skills_testing_best_practices_rules_performance_test_suite_performance, agents_skills_testing_best_practices_rules_review_reviewing_tests, agents_skills_testing_best_practices_rules_security_security_tests, agents_skills_testing_best_practices_rules_test_data_factories_and_test_data [EXTRACTED 1.00]
- **E-Commerce Project Documentation and Infrastructure** — project_analysis_md_ecommerce_project_analysis [INFERRED 0.85]
- **Inventory Stock Lifecycle (Reserve, Restore, Guard)** — readme_inventory_reservation, readme_stock_restoration, readme_all_or_nothing_order, readme_race_condition_test [EXTRACTED 1.00]
- **Realtime Order Broadcast Flow** — websocket_order_created_event, websocket_order_status_updated_event, websocket_queued_broadcasts, websocket_reverb_broadcasting, docker_compose_queue_worker, docker_compose_reverb_service [INFERRED 0.85]
- **Dual SPA Session Isolation Group** — websocket_dual_app_architecture, frontend_readme_auth_session_design, admin_index_spa_entry, frontend_index_spa_entry [INFERRED 0.75]
- **Favicon Brand Composition (mark, background, palette)** — admin_public_favicon_cuboid_stack_mark, admin_public_favicon_dark_rounded_background, admin_public_favicon_emerald_stroke_palette [EXTRACTED 0.95]
- **Favicon Mark Composition (container + glyph + palette)** — frontend_public_favicon_brand_mark, frontend_public_favicon_stacked_layers_glyph, frontend_public_favicon_rounded_square_container, frontend_public_favicon_dark_green_palette [INFERRED 0.85]

## Communities (104 total, 18 thin omitted)

### Community 0 - "Admin UI Icons"
Cohesion: 0.05
Nodes (29): adminAuthApi, mutualApi, ArrowRightIcon(), ArrowUpRightIcon(), BellIcon(), CheckCircleIcon(), CheckIcon(), ChevronDownIcon() (+21 more)

### Community 1 - "Composer Dependencies"
Cohesion: 0.04
Nodes (47): pestphp/pest-plugin, php-http/discovery, autoload, autoload-dev, psr-4, psr-4, config, allow-plugins (+39 more)

### Community 2 - "Customer UI Icons"
Cohesion: 0.07
Nodes (25): mutualApi, ActivityIcon(), ArrowUpRightIcon(), BellIcon(), CheckCircleIcon(), ChevronDownIcon(), ClockIcon(), GridIcon() (+17 more)

### Community 3 - "Database Migrations"
Cohesion: 0.07
Nodes (3): Illuminate\Database\Migrations\Migration, Illuminate\Database\Schema\Blueprint, Illuminate\Support\Facades\Schema

### Community 4 - "Warehouse Node Dependencies"
Cohesion: 0.04
Nodes (44): @grpc/grpc-js, @grpc/proto-loader, mysql2, @nestjs/common, @nestjs/core, @nestjs/microservices, @nestjs/platform-express, @nestjs/typeorm (+36 more)

### Community 5 - "Auth and Notification Services"
Cohesion: 0.07
Nodes (17): SendEmailVerificationCodeAction, self, UserNormalAuthInfoDTO, UserAuthenticationController, UserVerifyEmailRequest, OrderCreatedNotification, VerifiyEmailNotification, User (+9 more)

### Community 6 - "HTTP Middleware"
Cohesion: 0.09
Nodes (23): BaseMiddleware, CheckAccessTokenDeviceMiddleware, CheckAdminMiddleware, CheckCanRefreshMiddleware, CheckEmailIsNotVerifiedMiddleware, CheckLanguageMiddleware, CheckUserMiddleware, EnsureEmailIsVerified (+15 more)

### Community 7 - "API Resources"
Cohesion: 0.11
Nodes (13): AdminOrderItemResource, AdminOrderResource, AdminOrderStatusResource, AdminProductImageResource, UserAuthInfoResource, UserAuthResource, UserCategoryResource, UserOrderItemResource (+5 more)

### Community 8 - "Two-App Realtime Docs"
Cohesion: 0.09
Nodes (34): Admin SPA HTML Entrypoint, Admin main.jsx Bootstrap, MySQL Primary/Replica Binlog Replication, Queue Worker Service, RabbitMQ Queue Broker, Reverb WebSocket Service, Docker Compose Service Stack, Warehouse Node Service (+26 more)

### Community 9 - "Customer Pages and Helpers"
Cohesion: 0.17
Nodes (24): getErrorMessage(), userCatalogApi, userOrdersApi, Alert(), Badge(), Field(), Spinner(), CatalogPage() (+16 more)

### Community 10 - "Warehouse NestJS Tooling"
Cohesion: 0.06
Nodes (33): @nestjs/cli, @nestjs/mau, @nestjs/schematics, @nestjs/testing, oxlint, oxlint-tsgolint, prettier, source-map-support (+25 more)

### Community 11 - "Admin API and Pages"
Cohesion: 0.10
Nodes (17): api, handlers, adminCategoriesApi, adminOrdersApi, adminProductsApi, AlertTriangleIcon(), InfoIcon(), PackageIcon() (+9 more)

### Community 12 - "API Form Requests"
Cohesion: 0.08
Nodes (13): UnifiedApiRequest, StoreProductImagesRequest, UpdateProductRequest, StoreOrderRequest, UserLoginRequest, UserRegisterRequest, failed(), succeed() (+5 more)

### Community 13 - "Admin Auth and Realtime"
Cohesion: 0.15
Nodes (23): registerAuthHandlers(), App(), AuthContext, AuthProvider(), useAuth(), AdminRoute(), GuestRoute(), ensureDeviceId() (+15 more)

### Community 14 - "Warehouse gRPC Service"
Cohesion: 0.12
Nodes (13): Column, Entity, GrpcMethod, Injectable, InjectDataSource, Module, PrimaryColumn, AppModule (+5 more)

### Community 15 - "Composer Scripts"
Cohesion: 0.08
Nodes (26): scripts, dev, post-autoload-dump, post-create-project-cmd, post-root-package-install, post-update-cmd, pre-package-uninstall, setup (+18 more)

### Community 16 - "Admin Catalog Pages"
Cohesion: 0.21
Nodes (22): getErrorMessage(), AdminCategoriesPage(), load(), onDelete(), onSubmit(), resetForm(), onSubmit(), AdminOrdersPage() (+14 more)

### Community 17 - "Database Seeders"
Cohesion: 0.12
Nodes (9): AdminUserSeeder, CatalogSeeder, DatabaseSeeder, DemoProductsSeeder, PerformanceTestSeeder, UserSeeder, Illuminate\Database\Seeder, Illuminate\Support\Facades\Broadcast (+1 more)

### Community 18 - "Warehouse TypeScript Config"
Cohesion: 0.09
Nodes (22): node, vitest/globals, compilerOptions, allowSyntheticDefaultImports, declaration, emitDecoratorMetadata, esModuleInterop, experimentalDecorators (+14 more)

### Community 19 - "Customer Auth and Realtime"
Cohesion: 0.16
Nodes (14): api, handlers, registerAuthHandlers(), AuthContext, AuthProvider(), ensureDeviceId(), getStoredAuth(), makeAuthState() (+6 more)

### Community 20 - "Order Broadcast Events"
Cohesion: 0.17
Nodes (8): OrderCreated, OrderStatusUpdated, Illuminate\Broadcasting\InteractsWithSockets, Illuminate\Broadcasting\PrivateChannel, Illuminate\Contracts\Broadcasting\ShouldBroadcast, Illuminate\Contracts\Events\ShouldDispatchAfterCommit, Illuminate\Foundation\Events\Dispatchable, RealtimeContractTest

### Community 21 - "Admin Product Controllers"
Cohesion: 0.24
Nodes (7): AdminProductController, StoreProductRequest, AdminProductResource, Product, ProductImageService, Illuminate\Http\JsonResponse, Illuminate\Http\UploadedFile

### Community 22 - "User Catalog Controllers"
Cohesion: 0.13
Nodes (7): Controller, MutualAuthenticationController, UserCategoryController, UserProductController, UserProductResource, Illuminate\Support\Facades\Cache, Illuminate\Support\Facades\Route

### Community 23 - "Order Models and Factories"
Cohesion: 0.17
Nodes (7): OrderItem, OrderFactory, OrderItemFactory, Illuminate\Database\Eloquent\Attributes\Fillable, Illuminate\Database\Eloquent\Factories\HasFactory, Illuminate\Database\Eloquent\Model, Illuminate\Database\Eloquent\Relations\BelongsTo

### Community 24 - "Product Policy and User"
Cohesion: 0.15
Nodes (7): User, ProductPolicy, Illuminate\Database\Eloquent\Attributes\Hidden, Illuminate\Foundation\Auth\User, Illuminate\Notifications\Notifiable, Laravel\Sanctum\HasApiTokens, Spatie\Permission\Traits\HasRoles

### Community 25 - "Admin Authentication Service"
Cohesion: 0.15
Nodes (6): AdminNormalAuthInfoDTO, self, AdminAuthenticationController, AdminLoginRequest, TokenDeviceManagementService, AdminAuthenticationService

### Community 26 - "Category Admin Endpoints"
Cohesion: 0.14
Nodes (5): AdminCategoryController, StoreCategoryRequest, UpdateCategoryRequest, AdminCategoryResource, Illuminate\Support\Facades\Gate

### Community 27 - "Laravel Best-Practice Docs"
Cohesion: 0.16
Nodes (18): Advanced Query Best Practices, Architecture Best Practices, Blade and View Best Practices, Caching Best Practices, Collection Best Practices, Configuration Best Practices, Database Performance Best Practices, Eloquent Best Practices (+10 more)

### Community 28 - "Admin Order Status"
Cohesion: 0.14
Nodes (5): AdminOrderController, Order, Order, UpdateOrderStatusRequest, Illuminate\Validation\Rules\Enum

### Community 29 - "Customer UI Feedback"
Cohesion: 0.14
Nodes (13): userAuthApi, AlertTriangleIcon(), ArrowRightIcon(), CheckIcon(), InfoIcon(), LockIcon(), PackageIcon(), ShoppingBagIcon() (+5 more)

### Community 30 - "Warehouse gRPC Client"
Cohesion: 0.18
Nodes (4): Protobuf, WarehouseClient, WarehouseUnavailableException, RuntimeException

### Community 31 - "Customer Routing and Layout"
Cohesion: 0.25
Nodes (11): App(), useAuth(), GuestRoute(), ProtectedRoute(), AppLayout(), HomePage(), CustomerRealtimeContext, CustomerRealtimeProvider() (+3 more)

### Community 32 - "OpenCode MCP Config"
Cohesion: 0.12
Nodes (16): ../Rehlati/**, command, enabled, type, mcp, laravel-boost, description, path (+8 more)

### Community 33 - "Token Device Management"
Cohesion: 0.17
Nodes (5): NewRefreshDTO, DateTimeInterface, Device, NewRefreshDTO, TokenNameEnum

### Community 34 - "Refresh Token Flow"
Cohesion: 0.15
Nodes (4): self, RefreshDTO, RefreshTokenRequest, MutualAuthenticationService

### Community 35 - "User Order Requests"
Cohesion: 0.19
Nodes (4): UserOrderController, IndexOrderRequest, ShowOrderRequest, Throwable

### Community 36 - "Testing Best-Practice Docs"
Cohesion: 0.21
Nodes (12): Laravel Boost Guidelines (AGENTS.md), Assertions, Endpoint Tests, How to Find Test Framework Features, Fakes, Mocks, and Determinism, Naming and Structure, Test Suite Performance, Reviewing Tests (+4 more)

### Community 37 - "Auth DTO Unit Tests"
Cohesion: 0.23
Nodes (4): AuthInfoDTO, PHPUnit\Framework\TestCase, AuthInfoDTOTest, ExampleTest

### Community 38 - "Rate Limiters"
Cohesion: 0.23
Nodes (5): AdminLoginRateLimiter, EmailVerificationRateLimiter, UserLoginRateLimiter, Illuminate\Cache\RateLimiting\Limit, Illuminate\Support\Facades\RateLimiter

### Community 39 - "Warehouse Build Config"
Cohesion: 0.17
Nodes (11): dist, node_modules, **/*spec.ts, src, test, ./tsconfig.json, compilerOptions, rootDir (+3 more)

### Community 40 - "Frontend Package Dependencies"
Cohesion: 0.18
Nodes (11): react-dom, react-router-dom, react-dom, react-router-dom, dependencies, axios, react, react-dom (+3 more)

### Community 41 - "Catalog Model Factories"
Cohesion: 0.24
Nodes (4): CategoryFactory, ProductFactory, ProductImageFactory, Illuminate\Database\Eloquent\Factories\Factory

### Community 45 - "Root Build Dependencies"
Cohesion: 0.18
Nodes (11): concurrently, laravel-vite-plugin, devDependencies, concurrently, laravel-vite-plugin, tailwindcss, @tailwindcss/vite, vite (+3 more)

### Community 46 - "Root Package Manifest"
Cohesion: 0.20
Nodes (9): @laravel/multiplex, optionalDependencies, @laravel/multiplex, private, $schema, scripts, build, dev (+1 more)

### Community 47 - "Admin Package Manifest"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, preview, type, version

### Community 48 - "Realtime Client Dependencies"
Cohesion: 0.22
Nodes (9): dependencies, axios, laravel-echo, react, axios, react, laravel-echo, laravel-echo (+1 more)

### Community 49 - "Vite Build Dependencies"
Cohesion: 0.22
Nodes (9): devDependencies, vite, @vitejs/plugin-react, vite, @vitejs/plugin-react, devDependencies, vite, @vitejs/plugin-react (+1 more)

### Community 50 - "Service Providers"
Cohesion: 0.31
Nodes (3): AppServiceProvider, RateLimitingServiceProvider, Illuminate\Support\ServiceProvider

### Community 51 - "Customer Package Manifest"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, preview, type, version

### Community 52 - "User Factory and Requests"
Cohesion: 0.33
Nodes (3): UserFactory, Illuminate\Support\Facades\Hash, static

### Community 54 - "Roles and Permissions"
Cohesion: 0.29
Nodes (4): RoleSeeder, Spatie\Permission\DefaultTeamResolver, Spatie\Permission\Models\Permission, Spatie\Permission\Models\Role

### Community 55 - "Warehouse Lint Config"
Cohesion: 0.29
Nodes (6): env, node, rules, typescript/no-explicit-any, typescript/no-floating-promises, $schema

### Community 56 - "Feature Test Scaffolding"
Cohesion: 0.40
Nodes (3): Illuminate\Foundation\Testing\TestCase, ExampleTest, TestCase

### Community 57 - "NestJS CLI Config"
Cohesion: 0.33
Nodes (5): collection, compilerOptions, deleteOutDir, $schema, sourceRoot

### Community 58 - "Admin Brand Favicon"
Cohesion: 0.70
Nodes (5): Admin Favicon (SVG), Cuboid Stack Logo Mark, Dark Rounded-Square Background, Emerald Stroke Palette (#22c55e on #0f172a), Layered Box Icon for E-commerce Admin Branding

### Community 60 - "Logging Config"
Cohesion: 0.40
Nodes (4): Monolog\Handler\NullHandler, Monolog\Handler\StreamHandler, Monolog\Handler\SyslogUdpHandler, Monolog\Processor\PsrLogMessageProcessor

### Community 61 - "Sanctum Config"
Cohesion: 0.40
Nodes (4): Illuminate\Cookie\Middleware\EncryptCookies, Illuminate\Foundation\Http\Middleware\ValidateCsrfToken, Laravel\Sanctum\Http\Middleware\AuthenticateSession, Laravel\Sanctum\Sanctum

### Community 62 - "Pusher Dependency Group"
Cohesion: 0.50
Nodes (4): pusher-js, pusher-js, pusher-js, pusher-js

### Community 63 - "Customer Brand Favicon"
Cohesion: 0.50
Nodes (4): Favicon Brand Mark (layered stack glyph), Dark Slate + Green Favicon Palette, Rounded Square Icon Container, Stacked Layers Glyph

## Knowledge Gaps
- **228 isolated node(s):** `private`, `$schema`, `build`, `dev`, `type` (+223 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **18 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `User` connect `Product Policy and User` to `Auth and Notification Services`, `Category Policy and Model`, `Order Policy and Model`, `API Form Requests`, `Product Image Policy`, `Database Seeders`, `User Factory and Requests`, `Model Relationships`, `Order Models and Factories`, `Admin Authentication Service`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Why does `UnifiedApiRequest` connect `API Form Requests` to `Refresh Token Flow`, `User Order Requests`, `Auth and Notification Services`, `User Factory and Requests`, `Admin Product Controllers`, `Admin Authentication Service`, `Category Admin Endpoints`, `Admin Order Status`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Why does `Category` connect `Category Policy and Model` to `API Resources`, `Catalog Model Factories`, `Database Seeders`, `Order Models and Factories`, `Admin Product Controllers`, `User Catalog Controllers`, `Model Relationships`, `Category Admin Endpoints`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **What connects `private`, `$schema`, `build` to the rest of the system?**
  _228 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Admin UI Icons` be split into smaller, more focused modules?**
  _Cohesion score 0.05388471177944862 - nodes in this community are weakly interconnected._
- **Should `Composer Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.041666666666666664 - nodes in this community are weakly interconnected._
- **Should `Customer UI Icons` be split into smaller, more focused modules?**
  _Cohesion score 0.06560283687943262 - nodes in this community are weakly interconnected._
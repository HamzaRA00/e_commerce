# Graph Report - e-commerce  (2026-11-18)

## Corpus Check
- Large corpus: 225 files · ~583,128 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder.

## Summary
- 890 nodes · 1472 edges · 88 communities (63 shown, 25 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 26 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- HTTP Middleware
- API Controllers
- Composer Config
- Database Migrations
- Warehouse Node Deps
- Warehouse gRPC Client
- Warehouse Dev Tooling
- Warehouse NestJS Core
- Composer Scripts
- Token Refresh & Logout
- Frontend/Vite Deps
- Warehouse TS Config
- Core Domain Models
- Policies & Access Control
- Laravel Practice Docs
- Auth Tokens & DTOs
- User Auth Endpoints
- Project Tooling Config
- Model Factories
- Testing Guidance Docs
- Email Verification Notify
- Login Rate Limiting
- Category Domain Model
- Order Status/Policy Logic
- NestJS Build Config
- Auth Controllers (Admin/User)
- Broadcasting & Events
- Unified API Requests
- Product Image Policy
- Rate Limiting Provider
- Token Device Management
- Order Status Requests
- Warehouse Lint/Test Config
- Email Verification Action
- Auth DTO Variants
- Laravel Facades & DB Tx
- Example Tests
- NestJS Decorators/Module
- Validation & Password Rules
- Logging Config
- Middleware Helpers
- Category Requests
- Product Image Requests
- Product Requests
- Update Category Requests
- Update Product Requests
- Order Listing Requests
- Order Store Requests
- Basic Test Cases
- Docker Compose Infra
- Console/Kernel Scaffolding
- Laravel Boost Config
- Deploy-to-Cloud Skill
- Infer-Conventions Skill
- Best-Practices Skill Meta
- RabbitMQ Integration Config
- Docker Entrypoint
- DB Replica Init
- Load Test Config
- Warehouse Observability/Guards
- Tailwind Skill Docs

## God Nodes (most connected - your core abstractions)
1. `User` - 65 edges
2. `UnifiedApiRequest` - 33 edges
3. `Product` - 30 edges
4. `Category` - 29 edges
5. `Order` - 25 edges
6. `Controller` - 20 edges
7. `compilerOptions` - 20 edges
8. `ProductImage` - 17 edges
9. `Laravel Best Practices Skill` - 17 edges
10. `scripts` - 14 edges

## Surprising Connections (you probably didn't know these)
- `Laravel Boost Guidelines (AGENTS.md)` --semantically_similar_to--> `Laravel Boost Guidelines (CLAUDE.md)`  [INFERRED] [semantically similar]
  AGENTS.md → CLAUDE.md
- `Laravel Boost Guidelines (AGENTS.md)` --references--> `Testing Best Practices Skill`  [EXTRACTED]
  AGENTS.md → .agents/skills/testing-best-practices/SKILL.md
- `Laravel Boost Guidelines (CLAUDE.md)` --references--> `Testing Best Practices Skill`  [EXTRACTED]
  CLAUDE.md → .agents/skills/testing-best-practices/SKILL.md
- `E-Commerce Setup and Testing Guide` --references--> `Docker Compose Infrastructure`  [INFERRED]
  README.md → docker-compose.yml
- `Eloquent Best Practices` --conceptually_related_to--> `Database Performance Best Practices`  [INFERRED]
  .agents/skills/laravel-best-practices/rules/eloquent.md → .agents/skills/laravel-best-practices/rules/db-performance.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Laravel Best Practices Rule Set** — _agents_skills_laravel_best_practices_skill_laravel_best_practices, _agents_skills_laravel_best_practices_rules_advanced_queries_advanced_queries, _agents_skills_laravel_best_practices_rules_architecture_architecture, _agents_skills_laravel_best_practices_rules_blade_views_blade_views, _agents_skills_laravel_best_practices_rules_caching_caching, _agents_skills_laravel_best_practices_rules_collections_collections, _agents_skills_laravel_best_practices_rules_config_config, _agents_skills_laravel_best_practices_rules_db_performance_db_performance, _agents_skills_laravel_best_practices_rules_eloquent_eloquent, _agents_skills_laravel_best_practices_rules_error_handling_error_handling, _agents_skills_laravel_best_practices_rules_events_notifications_events_notifications, _agents_skills_laravel_best_practices_rules_http_client_http_client, _agents_skills_laravel_best_practices_rules_mail_mail, _agents_skills_laravel_best_practices_rules_migrations_migrations, _agents_skills_laravel_best_practices_rules_queue_jobs_queue_jobs, _agents_skills_laravel_best_practices_rules_routing_routing, _agents_skills_laravel_best_practices_rules_scheduling_scheduling, _agents_skills_laravel_best_practices_rules_security_security [EXTRACTED 1.00]
- **Testing Best Practices Rule Set** — agents_skills_testing_best_practices_skill_testing_best_practices, agents_skills_testing_best_practices_rules_assertions_assertions, agents_skills_testing_best_practices_rules_endpoint_tests_endpoint_tests, agents_skills_testing_best_practices_rules_finding_features_finding_test_framework_features, agents_skills_testing_best_practices_rules_isolation_fakes_mocks_and_determinism, agents_skills_testing_best_practices_rules_naming_naming_and_structure, agents_skills_testing_best_practices_rules_performance_test_suite_performance, agents_skills_testing_best_practices_rules_review_reviewing_tests, agents_skills_testing_best_practices_rules_security_security_tests, agents_skills_testing_best_practices_rules_test_data_factories_and_test_data [EXTRACTED 1.00]
- **E-Commerce Project Documentation and Infrastructure** — project_analysis_md_ecommerce_project_analysis, readme_md_ecommerce_setup_and_testing_guide, docker_compose_yml_docker_compose_infrastructure [INFERRED 0.85]

## Communities (88 total, 25 thin omitted)

### Community 0 - "HTTP Middleware"
Cohesion: 0.05
Nodes (35): BaseMiddleware, CheckAccessTokenDeviceMiddleware, CheckAdminMiddleware, CheckCanRefreshMiddleware, CheckEmailIsNotVerifiedMiddleware, CheckLanguageMiddleware, CheckUserMiddleware, EnsureEmailIsVerified (+27 more)

### Community 1 - "API Controllers"
Cohesion: 0.06
Nodes (27): Controller, AdminAuthenticationController, AdminCategoryController, AdminOrderController, AdminProductController, UserCategoryController, UserOrderController, UserProductController (+19 more)

### Community 2 - "Composer Config"
Cohesion: 0.04
Nodes (47): pestphp/pest-plugin, php-http/discovery, autoload, autoload-dev, psr-4, psr-4, config, allow-plugins (+39 more)

### Community 3 - "Database Migrations"
Cohesion: 0.07
Nodes (3): Illuminate\Database\Migrations\Migration, Illuminate\Database\Schema\Blueprint, Illuminate\Support\Facades\Schema

### Community 4 - "Warehouse Node Deps"
Cohesion: 0.04
Nodes (44): @grpc/grpc-js, @grpc/proto-loader, mysql2, @nestjs/common, @nestjs/core, @nestjs/microservices, @nestjs/platform-express, @nestjs/typeorm (+36 more)

### Community 5 - "Warehouse gRPC Client"
Cohesion: 0.08
Nodes (12): Protobuf, AdminUserSeeder, DatabaseSeeder, DemoProductsSeeder, PerformanceTestSeeder, RoleSeeder, UserSeeder, Illuminate\Database\Seeder (+4 more)

### Community 6 - "Warehouse Dev Tooling"
Cohesion: 0.06
Nodes (33): @nestjs/cli, @nestjs/mau, @nestjs/schematics, @nestjs/testing, oxlint, oxlint-tsgolint, prettier, source-map-support (+25 more)

### Community 7 - "Warehouse NestJS Core"
Cohesion: 0.12
Nodes (13): Column, Entity, GrpcMethod, Injectable, InjectDataSource, Module, PrimaryColumn, AppModule (+5 more)

### Community 8 - "Composer Scripts"
Cohesion: 0.08
Nodes (26): scripts, dev, post-autoload-dump, post-create-project-cmd, post-root-package-install, post-update-cmd, pre-package-uninstall, setup (+18 more)

### Community 9 - "Token Refresh & Logout"
Cohesion: 0.11
Nodes (6): self, RefreshDTO, MutualAuthenticationController, RefreshTokenRequest, UserAuthInfoResource, MutualAuthenticationService

### Community 10 - "Frontend/Vite Deps"
Cohesion: 0.08
Nodes (24): concurrently, laravel-echo, @laravel/multiplex, laravel-vite-plugin, devDependencies, concurrently, laravel-echo, laravel-vite-plugin (+16 more)

### Community 11 - "Warehouse TS Config"
Cohesion: 0.09
Nodes (22): node, vitest/globals, compilerOptions, allowSyntheticDefaultImports, declaration, emitDecoratorMetadata, esModuleInterop, experimentalDecorators (+14 more)

### Community 12 - "Core Domain Models"
Cohesion: 0.15
Nodes (7): OrderItem, OrderFactory, OrderItemFactory, Illuminate\Database\Eloquent\Attributes\Fillable, Illuminate\Database\Eloquent\Factories\HasFactory, Illuminate\Database\Eloquent\Model, Illuminate\Database\Eloquent\Relations\BelongsTo

### Community 13 - "Policies & Access Control"
Cohesion: 0.15
Nodes (4): User, CategoryPolicy, ProductPolicy, Illuminate\Foundation\Auth\User

### Community 14 - "Laravel Practice Docs"
Cohesion: 0.16
Nodes (18): Advanced Query Best Practices, Architecture Best Practices, Blade and View Best Practices, Caching Best Practices, Collection Best Practices, Configuration Best Practices, Database Performance Best Practices, Eloquent Best Practices (+10 more)

### Community 15 - "Auth Tokens & DTOs"
Cohesion: 0.15
Nodes (5): AuthInfoDTO, NewRefreshDTO, DateTimeInterface, Illuminate\Support\Facades\DB, TokenNameEnum

### Community 16 - "User Auth Endpoints"
Cohesion: 0.14
Nodes (5): UserAuthenticationController, UserLoginRequest, UserRegisterRequest, UserVerifyEmailRequest, Illuminate\Validation\Rules\Password

### Community 17 - "Project Tooling Config"
Cohesion: 0.12
Nodes (16): ../Rehlati/**, command, enabled, type, mcp, laravel-boost, description, path (+8 more)

### Community 18 - "Model Factories"
Cohesion: 0.21
Nodes (5): CategoryFactory, ProductImageFactory, UserFactory, Illuminate\Database\Eloquent\Factories\Factory, static

### Community 19 - "Testing Guidance Docs"
Cohesion: 0.21
Nodes (12): Laravel Boost Guidelines (AGENTS.md), Assertions, Endpoint Tests, How to Find Test Framework Features, Fakes, Mocks, and Determinism, Naming and Structure, Test Suite Performance, Reviewing Tests (+4 more)

### Community 20 - "Email Verification Notify"
Cohesion: 0.23
Nodes (6): VerifiyEmailNotification, Illuminate\Bus\Queueable, Illuminate\Contracts\Queue\ShouldQueue, Illuminate\Notifications\Messages\MailMessage, Illuminate\Notifications\Notification, MailMessage

### Community 21 - "Login Rate Limiting"
Cohesion: 0.23
Nodes (5): AdminLoginRateLimiter, EmailVerificationRateLimiter, UserLoginRateLimiter, Illuminate\Cache\RateLimiting\Limit, Illuminate\Support\Facades\RateLimiter

### Community 22 - "Category Domain Model"
Cohesion: 0.17
Nodes (5): Illuminate\Database\Eloquent\Attributes\Hidden, Illuminate\Database\Eloquent\Relations\HasMany, Illuminate\Notifications\Notifiable, Laravel\Sanctum\HasApiTokens, Spatie\Permission\Traits\HasRoles

### Community 24 - "NestJS Build Config"
Cohesion: 0.17
Nodes (11): dist, node_modules, **/*spec.ts, src, test, ./tsconfig.json, compilerOptions, rootDir (+3 more)

### Community 25 - "Auth Controllers (Admin/User)"
Cohesion: 0.20
Nodes (3): AdminNormalAuthInfoDTO, self, AdminAuthenticationService

### Community 26 - "Broadcasting & Events"
Cohesion: 0.25
Nodes (6): OrderCreated, Illuminate\Broadcasting\InteractsWithSockets, Illuminate\Broadcasting\PrivateChannel, Illuminate\Contracts\Broadcasting\ShouldBroadcast, Illuminate\Contracts\Events\ShouldDispatchAfterCommit, Illuminate\Foundation\Events\Dispatchable

### Community 27 - "Unified API Requests"
Cohesion: 0.25
Nodes (6): UnifiedApiRequest, ShowOrderRequest, Illuminate\Auth\Access\Response, Illuminate\Contracts\Validation\Validator, Illuminate\Foundation\Http\FormRequest, Illuminate\Http\Exceptions\HttpResponseException

### Community 29 - "Rate Limiting Provider"
Cohesion: 0.31
Nodes (3): AppServiceProvider, RateLimitingServiceProvider, Illuminate\Support\ServiceProvider

### Community 30 - "Token Device Management"
Cohesion: 0.48
Nodes (3): SendEmailVerificationCodeAction, TokenDeviceManagementService, UserAuthenticationService

### Community 32 - "Warehouse Lint/Test Config"
Cohesion: 0.29
Nodes (6): env, node, rules, typescript/no-explicit-any, typescript/no-floating-promises, $schema

### Community 36 - "Example Tests"
Cohesion: 0.40
Nodes (3): Illuminate\Foundation\Testing\TestCase, ExampleTest, TestCase

### Community 37 - "NestJS Decorators/Module"
Cohesion: 0.33
Nodes (5): collection, compilerOptions, deleteOutDir, $schema, sourceRoot

### Community 38 - "Validation & Password Rules"
Cohesion: 0.40
Nodes (3): Illuminate\Contracts\Validation\ValidationRule, Illuminate\Validation\Rule, Illuminate\Validation\Validator

### Community 39 - "Logging Config"
Cohesion: 0.40
Nodes (4): Monolog\Handler\NullHandler, Monolog\Handler\StreamHandler, Monolog\Handler\SyslogUdpHandler, Monolog\Processor\PsrLogMessageProcessor

### Community 40 - "Middleware Helpers"
Cohesion: 0.40
Nodes (4): Illuminate\Cookie\Middleware\EncryptCookies, Illuminate\Foundation\Http\Middleware\ValidateCsrfToken, Laravel\Sanctum\Http\Middleware\AuthenticateSession, Laravel\Sanctum\Sanctum

### Community 49 - "Docker Compose Infra"
Cohesion: 1.00
Nodes (3): Docker Compose Infrastructure, E-Commerce Project Analysis, E-Commerce Setup and Testing Guide

## Knowledge Gaps
- **182 isolated node(s):** `php`, `$schema`, `name`, `type`, `description` (+177 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **25 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `User` connect `Policies & Access Control` to `Email Verification Action`, `API Controllers`, `Laravel Facades & DB Tx`, `Auth DTO Variants`, `Warehouse gRPC Client`, `Core Domain Models`, `Auth Tokens & DTOs`, `User Auth Endpoints`, `Model Factories`, `Email Verification Notify`, `Category Domain Model`, `Order Status/Policy Logic`, `Auth Controllers (Admin/User)`, `Product Image Policy`, `Token Device Management`?**
  _High betweenness centrality (0.066) - this node is a cross-community bridge._
- **Why does `UnifiedApiRequest` connect `Unified API Requests` to `HTTP Middleware`, `API Controllers`, `Laravel Facades & DB Tx`, `Validation & Password Rules`, `Category Requests`, `Product Image Requests`, `Product Requests`, `Update Category Requests`, `Update Product Requests`, `Token Refresh & Logout`, `Order Listing Requests`, `Order Store Requests`, `User Auth Endpoints`, `Order Status Requests`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **Why does `Category` connect `API Controllers` to `Category Requests`, `Core Domain Models`, `Policies & Access Control`, `Model Factories`, `Category Domain Model`, `Order Status/Policy Logic`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **What connects `php`, `$schema`, `name` to the rest of the system?**
  _182 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `HTTP Middleware` be split into smaller, more focused modules?**
  _Cohesion score 0.05427905427905428 - nodes in this community are weakly interconnected._
- **Should `API Controllers` be split into smaller, more focused modules?**
  _Cohesion score 0.06260406260406261 - nodes in this community are weakly interconnected._
- **Should `Composer Config` be split into smaller, more focused modules?**
  _Cohesion score 0.041666666666666664 - nodes in this community are weakly interconnected._
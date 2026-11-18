# RabbitMQ in the E-Commerce Project

This document explains:

- what RabbitMQ is;
- what it is used for in general;
- what we implemented in this project;
- where RabbitMQ is wired into the application;
- what it helped us achieve;
- how to run, inspect, and troubleshoot it.

The report was produced from the current codebase and the graphify knowledge graph in
`graphify-out/graph.json`.

---

## 1. Executive summary

RabbitMQ is the **asynchronous job bus** for this project.

The Laravel API does not wait for WebSocket broadcasts or emails to finish before it
responds to the user. Instead, queued work is written to RabbitMQ, and a dedicated
`queue-worker` container consumes that work and performs it:

- Laravel broadcasts order events to Reverb;
- Reverb pushes those events to the customer and admin SPAs over WebSocket;
- queued mail notifications send order-confirmation and email-verification messages.

RabbitMQ is therefore **not** the WebSocket server. Reverb is the WebSocket server.
RabbitMQ is the durable queue between Laravel and Reverb/mail.

In this project RabbitMQ supports:

- customer order-created notifications;
- admin new-order notifications;
- customer order-status notifications;
- admin order-status notifications;
- queued order-confirmation email;
- queued email-verification notification for legacy unverified accounts.

---

## 2. How graphify was used for this report

Graphify was queried against the updated graph:

```bash
$(cat graphify-out/.graphify_python) -m graphify query \
  "RabbitMQ RabbitMQ queue broker message queue integration configuration" \
  --budget 2500
```

The traversal started from:

- `RabbitMQ Queue Broker`;
- `rabbitmq.php`;
- `Queue and Job Best Practices`.

It found **38 nodes and 45 edges** around RabbitMQ, including:

```text
rabbitmq.php --imports--> iamfarhad\LaravelRabbitMQ\Jobs\RabbitMQJob
Docker Compose Service Stack --references--> RabbitMQ Queue Broker
Docker Compose Service Stack --references--> Queue Worker Service
Docker Compose Service Stack --references--> Reverb WebSocket Service
Queue Worker Service --shares_data_with--> RabbitMQ Queue Broker
Queued Broadcast After Commit --shares_data_with--> RabbitMQ Queue Broker
Queued Broadcast After Commit --conceptually_related_to--> OrderCreated Event
Queued Broadcast After Commit --conceptually_related_to--> OrderStatusUpdated Event
```

Graphify also found the infrastructure bridge:

```text
RabbitMQ Queue Broker <--references-- Docker Compose Service Stack
Docker Compose Service Stack --references--> Reverb WebSocket Service
```

That confirms the architectural role of RabbitMQ in this repository: it is part of the
Docker Compose service stack and sits between queued application work and Reverb.

---

## 3. What RabbitMQ is

RabbitMQ is an open-source **message broker**. A message broker is middleware that
receives messages from one application component and stores them until another component
is ready to process them.

RabbitMQ implements the **AMQP 0-9-1** protocol. Applications connect to RabbitMQ over
TCP, publish messages to an exchange, and consume messages from queues.

It is commonly used for:

- background jobs;
- asynchronous email and notification delivery;
- work queues;
- communication between services;
- buffering traffic spikes;
- retrying failed work;
- decoupling producers from consumers;
- event-driven systems.

RabbitMQ is written in Erlang and is designed for high-throughput, reliable message
delivery.

### 3.1 Core RabbitMQ concepts

| Concept | Meaning |
|---|---|
| Producer | An application that publishes a message. In this project, Laravel is the producer. |
| Exchange | Receives published messages and routes them to queues. |
| Binding | A rule connecting an exchange to a queue. |
| Routing key | A value the exchange uses to decide where a message should go. |
| Queue | A durable buffer that stores messages until a consumer processes them. |
| Consumer | An application that reads messages from a queue. In this project, `queue-worker` is the consumer. |
| Acknowledgement | The consumer confirms that it finished a message successfully. |
| Negative acknowledgement | The consumer reports failure, allowing requeue or dead-lettering. |
| Prefetch / QoS | Limits how many unacknowledged messages a consumer receives at once. |
| Durable queue | The queue definition survives a broker restart. |
| Persistent message | The message itself is written to disk and can survive a broker restart. |
| Dead-letter exchange | A destination for messages that cannot be processed. |
| Virtual host / vhost | A namespace that isolates queues, exchanges, and permissions. |
| Management UI | A web interface for inspecting connections, queues, message rates, and consumers. |

### 3.2 Why use a message broker instead of doing the work inline?

Without a broker, the HTTP request would have to do everything synchronously:

```text
Create order
  -> generate order record
  -> send email
  -> call Reverb / publish WebSocket event
  -> return HTTP response
```

That makes the API slower and couples order creation to email delivery and realtime
infrastructure. If the mail server or Reverb is unavailable, the user request can fail or
take a long time.

With RabbitMQ:

```text
Create order
  -> generate order record
  -> enqueue email job
  -> enqueue broadcast job
  -> return HTTP response quickly

queue-worker
  -> consumes job
  -> sends email or publishes to Reverb
```

This is the pattern used by this project.

### 3.3 RabbitMQ is not the same thing as Reverb

| Component | Role |
|---|---|
| RabbitMQ | Stores and distributes background jobs and broadcast jobs. |
| Reverb | Maintains WebSocket connections and pushes messages to browser clients. |
| Laravel queue worker | Consumes RabbitMQ messages and executes Laravel jobs. |
| Customer/admin SPA | Connects to Reverb and subscribes to private channels. |

The order-created event does not travel directly from Laravel to the browser. It travels:

```text
Laravel -> RabbitMQ -> queue-worker -> Reverb -> browser
```

---

## 4. Where RabbitMQ is used in this project

### 4.1 At a glance

| Area | File | What it does |
|---|---|---|
| PHP dependency | `composer.json:11` | Adds `iamfarhad/laravel-rabbitmq` version `^1.4`. |
| PHP extension | `Dockerfile:34`, `Dockerfile:42`, `Dockerfile:48`, `Dockerfile:62` | Installs `librabbitmq-dev`, builds `ext-amqp`, and enables it. |
| Broker container | `docker-compose.yml:115` | Runs `rabbitmq:4-management`. |
| Broker ports | `docker-compose.yml:123` | Exposes AMQP on `5672` and management UI on `15672`. |
| Broker persistence | `docker-compose.yml:126` | Mounts `rabbitmq_data` at `/var/lib/rabbitmq`. |
| Broker health check | `docker-compose.yml:128` | Uses `rabbitmq-diagnostics -q ping`. |
| Queue connection | `config/queue.php:76` | Declares the `rabbitmq` queue connection. |
| Driver configuration | `config/rabbitmq.php:18` | Configures the RabbitMQ driver, host, queue, pooling, retries, and failure handling. |
| Runtime environment | `.env.docker:19` | Sets `QUEUE_CONNECTION=rabbitmq`. |
| Broker host | `.env.docker:20` | Uses Docker DNS hostname `rabbitmq`. |
| Queue name | `.env.docker:25` | Uses the `default` queue. |
| Worker container | `docker-compose.yml:148` | Starts `queue-worker`. |
| Worker command | `docker-compose.yml:151` | Runs `php artisan rabbitmq:consume`. |
| Realtime docs | `WEBSOCKET.md:30` | Documents the `queue-worker` -> RabbitMQ -> Reverb path. |
| Customer docs | `frontend/README.md:98` | Notes that broadcasts are queued through RabbitMQ. |
| Order created event | `app/Events/OrderCreated.php:11` | Broadcast event for new orders. |
| Order status event | `app/Events/OrderStatusUpdated.php:12` | Broadcast event for status changes. |
| Order email | `app/Notifications/OrderCreatedNotification.php:10` | Queued order-confirmation mail. |
| Verification email | `app/Notifications/VerifiyEmailNotification.php:10` | Queued email-verification mail. |

### 4.2 Dependency and PHP extension

`composer.json` includes:

```json
"iamfarhad/laravel-rabbitmq": "^1.4"
```

This package provides:

- the Laravel queue driver named `rabbitmq`;
- the `rabbitmq:consume` Artisan command;
- the `RabbitMQJob` class used by the queue worker;
- connection pooling;
- retries and backoff support;
- optional publisher confirms and transactions;
- optional Horizon and Octane integration.

The Docker image installs the native AMQP extension:

```dockerfile
librabbitmq-dev
pecl install amqp
docker-php-ext-enable redis amqp
```

Without `ext-amqp`, Laravel cannot use this RabbitMQ driver.

### 4.3 RabbitMQ broker container

`docker-compose.yml` defines the broker:

```yaml
rabbitmq:
  image: rabbitmq:4-management
  hostname: rabbitmq
  ports:
    - "5672:5672"
    - "15672:15672"
  volumes:
    - rabbitmq_data:/var/lib/rabbitmq
```

- `5672` is the AMQP port used by Laravel.
- `15672` is the browser-based management UI.
- `rabbitmq_data` keeps broker state across container restarts.
- The health check prevents the app and worker from starting before the broker is ready.

The `app`, `queue-worker`, and therefore the realtime pipeline depend on a healthy
RabbitMQ instance.

### 4.4 Laravel queue configuration

`config/queue.php` declares a queue connection named `rabbitmq`:

```php
'rabbitmq' => [
    'driver' => 'rabbitmq',
    'queue' => env('RABBITMQ_QUEUE', 'default'),
],
```

The detailed driver configuration lives in `config/rabbitmq.php`. That file controls:

- the broker host and port;
- username, password, and vhost;
- heartbeat and connection timeout;
- the queue name;
- exchange and routing key behavior;
- connection pooling;
- retry and backoff behavior;
- dead-letter exchange settings;
- publisher confirms;
- transactions;
- consumer mode and prefetch;
- TLS options.

Important current defaults:

| Setting | Current behavior |
|---|---|
| `RABBITMQ_QUEUE` | `default` |
| `RABBITMQ_CONSUME_MODE` | `poll` |
| `RABBITMQ_QUEUE_DURABLE` | `true` |
| `RABBITMQ_QUEUE_AUTO_DELETE` | `false` |
| `RABBITMQ_QUEUE_QUORUM` | `false` |
| `RABBITMQ_EXCHANGE` | Empty, so the default exchange is used |
| `RABBITMQ_DLX_ENABLED` | `true` in the package configuration |
| `RABBITMQ_PUBLISHER_CONFIRMS_ENABLED` | `false` |
| `RABBITMQ_TRANSACTIONS_ENABLED` | `false` |
| `RABBITMQ_DELAYED_PLUGIN_ENABLED` | `false` |
| `RABBITMQ_RPC_ENABLED` | `false` |

Because `RABBITMQ_EXCHANGE` is empty, Laravel publishes through the default exchange.
In RabbitMQ, the default exchange routes directly to a queue whose name matches the
routing key, so the `default` queue is addressed by name.

### 4.5 Queue worker

The dedicated worker is defined in `docker-compose.yml:148`:

```bash
php artisan rabbitmq:consume \
  --queue=default \
  --consume-mode=poll \
  --memory=256 \
  --tries=3 \
  --timeout=60
```

What each option does:

| Option | Meaning |
|---|---|
| `--queue=default` | Consume the `default` queue. |
| `--consume-mode=poll` | Poll the broker with `basic_get` instead of blocking on `basic_consume`. |
| `--memory=256` | Restart the worker before it exceeds 256 MB. |
| `--tries=3` | Try a failed job up to three times. |
| `--timeout=60` | Allow up to 60 seconds for a job. |

The worker has `restart: unless-stopped`, so Docker restarts it if it exits.

### 4.6 Queued order events

`app/Events/OrderCreated.php` and `app/Events/OrderStatusUpdated.php` both implement:

```php
ShouldBroadcast
ShouldDispatchAfterCommit
```

- `ShouldBroadcast` tells Laravel that this event should be broadcast to WebSocket
  clients. Laravel queues the broadcast job instead of performing it inline.
- `ShouldDispatchAfterCommit` delays dispatch until the surrounding database transaction
  has committed.

`OrderCreated` broadcasts on:

```text
private-user.{userId}
private-admin.orders
```

`OrderStatusUpdated` broadcasts on:

```text
private-orders.{orderId}
private-user.{userId}
private-admin.orders
```

With `QUEUE_CONNECTION=rabbitmq`, the queued broadcast job is stored in RabbitMQ. The
queue worker executes it, and Reverb delivers the result to the connected SPAs.

### 4.7 Queued email notifications

Both notification classes implement `ShouldQueue`:

- `OrderCreatedNotification`;
- `VerifiyEmailNotification`.

The order flow calls:

```php
$order->user->notify(
    (new OrderCreatedNotification($order->id, $order->status->value))
        ->locale(app()->getLocale())
);
```

Laravel wraps that in a queued notification job. The same RabbitMQ `default` queue carries
the mail job.

The verification notification is used when an unverified user logs in. Current
registration auto-verifies the account, so this path mainly supports older unverified
accounts.

### 4.8 Order creation flow

```text
POST /api/v1/orders
  |
  |-- validate request
  |-- reserve stock through the warehouse service
  |-- create order + items in a database transaction
  |-- queue OrderCreatedNotification  ----------> RabbitMQ
  |-- dispatch OrderCreated event --------------> RabbitMQ
  |
  +-- return 201 Created
```

Later:

```text
RabbitMQ
  |
  +-- queue-worker
        |
        +-- sends order confirmation email
        |
        +-- runs BroadcastEvent
              |
              +-- Reverb
                    |
                    +-- customer channel user.{userId}
                    +-- admin channel admin.orders
```

The order API responds before email and WebSocket delivery complete.

### 4.9 Order status update flow

```text
PATCH/PUT admin order status
  |
  |-- validate status transition
  |-- optionally release warehouse reservation on cancellation
  |-- update order status in MySQL
  |-- dispatch OrderStatusUpdated event ---------> RabbitMQ
  |
  +-- return success
```

Later:

```text
RabbitMQ -> queue-worker -> Reverb
  |
  +-- customer channel user.{userId}
  +-- customer channel orders.{orderId}
  +-- admin channel admin.orders
```

The customer UI patches the open order detail page and debounces a refresh on the orders
list. The admin UI refreshes the order queue and open detail panel.

### 4.10 What is not using RabbitMQ directly

The application does not publish to RabbitMQ with a direct `RabbitMQ::` facade call.
There are no custom RabbitMQ exchanges, RPC calls, delayed-message exchanges, or direct
`RabbitQueue` usage in application code.

The integration is intentionally indirect:

```text
Laravel queue API
  -> rabbitmq queue driver
  -> RabbitMQ broker
```

That is the correct Laravel pattern: application code stays coupled to the queue
abstraction, not to RabbitMQ-specific APIs.

---

## 5. What we did

The RabbitMQ work in this project can be summarized as:

1. Added the `iamfarhad/laravel-rabbitmq` package.
2. Installed and enabled the native `ext-amqp` PHP extension in the application image.
3. Added a RabbitMQ 4 management container to Docker Compose.
4. Added a persistent RabbitMQ volume and a broker health check.
5. Pointed the Docker environment at the `rabbitmq` queue driver.
6. Added a dedicated `queue-worker` container.
7. Configured the worker to consume the `default` queue in poll mode with bounded memory,
   retries, and timeout.
8. Marked order events as broadcast events and after-commit events.
9. Marked order and verification notifications as queued notifications.
10. Connected the queued broadcasts to Reverb, customer private channels, and the admin
    private channel.
11. Documented the queue path in `WEBSOCKET.md` and `frontend/README.md`.
12. Indexed the resulting architecture in the graphify knowledge graph.

The outcome is a queue-backed realtime pipeline:

```text
HTTP request
  -> database commit
  -> RabbitMQ job
  -> queue worker
  -> Reverb
  -> customer/admin browser
```

---

## 6. What it helped with

RabbitMQ helped this project in the following concrete ways.

### 6.1 Faster order responses

Order creation no longer waits for the email server or Reverb. The API writes the order,
enqueues the notification and broadcast jobs, and returns a `201` response.

### 6.2 Decoupling realtime from order creation

If Reverb is temporarily unavailable, the API can still create orders. The broadcast work
is queued and can be processed when the worker and Reverb are available.

This is also why the customer app has manual refresh fallbacks. Realtime is valuable, but
it is not a hard requirement for the order API.

### 6.3 Decoupling email from order creation

Email delivery is slow and can fail independently of the database. Queuing the email means
an SMTP problem does not block the customer's order request.

### 6.4 Retry and failure handling

The worker is configured with three tries and a timeout. Failed jobs can be retried
rather than failing the original HTTP request. The broker configuration also includes
backoff and dead-letter settings for future production hardening.

### 6.5 A single realtime event can serve multiple audiences

One `OrderCreated` event fans out to:

- the customer who created the order;
- all admins listening on `admin.orders`.

One `OrderStatusUpdated` event fans out to:

- the customer;
- the order-specific channel;
- all admins.

Without the queue-backed broadcast pipeline, each HTTP request would need to perform this
fan-out synchronously.

### 6.6 Operational visibility

The management container exposes the RabbitMQ UI on port `15672`, where you can inspect:

- queue depth;
- publish and delivery rates;
- consumers;
- connections;
- channels;
- unacknowledged messages;
- message rates over time.

### 6.7 Horizontal scaling path

The worker is a separate container. In production it can be scaled independently of the
API and Reverb, for example by running multiple worker replicas or splitting queues by
workload.

### 6.8 What it did not do

There are no benchmark numbers in the repository that prove a specific latency
improvement. The benefits above are architectural: the request no longer performs email
and broadcast work inline, and queued work can be retried independently.

RabbitMQ is also not a substitute for Reverb. It does not hold WebSocket connections and
does not push messages directly to browsers.

---

## 7. Operational runbook

### 7.1 Start the queue stack

```bash
docker compose up -d rabbitmq queue-worker reverb
```

For the full realtime setup:

```bash
docker compose up -d --build app queue-worker reverb web frontend admin
```

### 7.2 Check broker health

```bash
docker compose exec rabbitmq rabbitmq-diagnostics -q ping
```

### 7.3 Inspect worker logs

```bash
docker compose logs -f queue-worker
```

### 7.4 Inspect broker logs

```bash
docker compose logs -f rabbitmq
```

### 7.5 Open the management UI

```text
http://localhost:15672
```

Use the credentials configured in `docker-compose.yml` and `.env.docker`. Do not publish
these credentials in documentation or commit real production secrets.

### 7.6 Check the queue

In the management UI:

1. Open **Queues and Streams**.
2. Select the `default` queue.
3. Check **Ready**, **Unacked**, **Total**, **Incoming**, and **Deliver / get** rates.
4. Check **Consumers** to confirm `queue-worker` is connected.

A growing **Ready** count with no consumers usually means the worker is stopped or cannot
connect to RabbitMQ.

### 7.7 Run a worker manually

Only do this when the `queue-worker` container is stopped, otherwise two workers will
compete for messages:

```bash
docker compose exec app php artisan rabbitmq:consume --queue=default
```

### 7.8 Verify queued work after a code change

A practical smoke test:

1. Start `app`, `rabbitmq`, `queue-worker`, `reverb`, `web`, `frontend`, and `admin`.
2. Sign in as a customer.
3. Sign in as an admin in the same browser.
4. Create an order.
5. Confirm the admin receives the new-order notification and the customer receives the
   order-created notification.
6. Change the order status as the admin.
7. Confirm the customer receives the status notification and the order detail updates.

If the order is created but no realtime message arrives, check `queue-worker` first.

---

## 8. Troubleshooting

| Symptom | Likely cause | What to check |
|---|---|---|
| Orders succeed but no realtime event arrives | Worker is stopped or cannot consume | `docker compose logs -f queue-worker`; check queue consumers in the management UI. |
| Orders succeed but no email arrives | Mail job failed or worker is down | Worker logs; Laravel log; mail configuration. |
| `Class "AMQPConnection" not found` | Native AMQP extension is missing | Rebuild the app image; confirm `docker-php-ext-enable amqp`. |
| Worker cannot connect to broker | Wrong host or broker not healthy | In Docker use `RABBITMQ_HOST=rabbitmq`; outside Docker use `127.0.0.1` or the correct broker host. |
| Authentication failure | Wrong username, password, or vhost | Compare `.env.docker` with the RabbitMQ container environment. |
| Management UI unreachable | Port not mapped or container down | Confirm `15672:15672` in Compose and `docker compose ps`. |
| Queue keeps growing | Worker crashed, is too slow, or is not consuming | Check consumer count, worker memory, and job duration. |
| Customer channel never subscribes | Auth response lacks `user_id` or token expired | Sign out and back in; confirm the session has a fresh auth payload. |
| Admin channel returns 403 | User is not an admin | Confirm the role and `routes/channels.php`. |
| Broadcast auth returns 401 | Access token expired and refresh failed | Sign in again. |
| Events stop after a code deploy | Old worker still running or config not reloaded | Restart `queue-worker` after changing queue or broadcast configuration. |
| Worker restarts repeatedly | Memory limit or job timeout | Inspect logs; raise `--memory`/`--timeout` only after identifying the slow job. |

---

## 9. Production hardening

The current configuration is suitable for local development, but production requires
additional controls.

### 9.1 Credentials

- Replace the local RabbitMQ username and password.
- Do not commit production credentials.
- Use Docker secrets, a secret manager, or environment injection.
- Give each environment and application its own vhost where appropriate.

### 9.2 Network exposure

- Do not expose port `15672` to the public internet.
- Restrict port `5672` to application and worker networks.
- Put RabbitMQ behind a private network or VPN where possible.

### 9.3 TLS

`config/rabbitmq.php` supports TLS through:

- `RABBITMQ_SECURE`;
- `RABBITMQ_SSL_CAFILE`;
- `RABBITMQ_SSL_LOCALCERT`;
- `RABBITMQ_SSL_LOCALKEY`;
- `RABBITMQ_SSL_VERIFY_PEER`.

Enable TLS and certificate verification for production brokers.

### 9.4 Delivery guarantees

For critical messages, consider enabling:

- publisher confirms;
- bounded publish retries;
- dead-letter queues with monitoring and replay procedures;
- quorum queues if the broker runs as a cluster.

Publisher confirms can add latency, so measure the tradeoff.

### 9.5 Queue separation

At present, mail and broadcast jobs share the `default` queue. A slow mail job can delay
broadcasts behind it. A production setup may split queues, for example:

```text
default
mail
broadcasts
```

Then run separate workers or weighted worker pools for each queue.

### 9.6 Monitoring

Monitor:

- queue depth;
- unacknowledged messages;
- consumer count;
- publish/delivery rates;
- redeliveries;
- disk usage;
- memory alarms;
- network partitions;
- dead-letter volume.

Alert on a sustained growing queue or zero consumers.

---

## 10. Current limitations and observations

These are important to keep the report honest.

1. **RabbitMQ is enabled only in the Docker environment.**  
   `.env.docker` sets `QUEUE_CONNECTION=rabbitmq`, while `.env.example` still defaults to
   `QUEUE_CONNECTION=database`. Running the backend outside Docker does not automatically
   use RabbitMQ.

2. **There is no direct RabbitMQ application API usage.**  
   The project does not call `RabbitMQ::` or `RabbitQueue` directly. All work goes through
   Laravel's queue abstraction.

3. **Publisher confirms are disabled by default.**  
   The broker may not confirm that a published message was routed and persisted. For
   critical jobs, enable publisher confirms and monitor failures.

4. **Transactions are disabled by default.**  
   `RABBITMQ_TRANSACTIONS_ENABLED` is `false`. This is normal for most Laravel workloads,
   but do not combine transactions and publisher confirms on the same channel.

5. **The dead-letter configuration is present, but provisioning is not automatic.**  
   `config/rabbitmq.php` contains DLX settings, but the repository does not call
   `setupDeadLetterExchange()` explicitly. Do not assume a DLQ exists until it is declared
   and verified.

6. **The default queue mixes different workloads.**  
   Order emails and broadcast jobs share the `default` queue. This is simple, but a slow
   email job can delay realtime delivery.

7. **The worker uses poll mode.**  
   Poll mode is predictable and easy to debug, but consume mode can be more efficient for
   high-throughput workloads. Benchmark before changing it.

8. **The queue is a single worker container by default.**  
   The architecture supports scaling, but Compose starts one worker replica.

9. **Realtime still has manual fallbacks.**  
   If the queue worker or Reverb is down, the customer and admin apps can still use manual
   refresh. Realtime is an enhancement, not the only data path.

---

## 11. Key configuration reference

### 11.1 Producer-side settings

| Variable | Purpose | Current Docker value/behavior |
|---|---|---|
| `QUEUE_CONNECTION` | Selects the Laravel queue driver. | `rabbitmq` |
| `RABBITMQ_HOST` | Broker hostname. | `rabbitmq` |
| `RABBITMQ_PORT` | AMQP port. | `5672` |
| `RABBITMQ_USER` | Broker user. | Configured in `.env.docker`. |
| `RABBITMQ_PASSWORD` | Broker password. | Configured in `.env.docker`; use a secret in production. |
| `RABBITMQ_VHOST` | RabbitMQ virtual host. | `/` |
| `RABBITMQ_QUEUE` | Default queue name. | `default` |
| `RABBITMQ_CONSUME_MODE` | Worker consumption mode. | `poll` |
| `RABBITMQ_AFTER_COMMIT` | Dispatch queued jobs after commit. | `false` by default in `config/rabbitmq.php`; order events use `ShouldDispatchAfterCommit`. |
| `RABBITMQ_SECURE` | Enable TLS. | `false` by default |
| `RABBITMQ_PUBLISHER_CONFIRMS_ENABLED` | Enable publisher confirms. | `false` by default |
| `RABBITMQ_DLX_ENABLED` | Enable dead-letter configuration. | `true` by default in `config/rabbitmq.php` |

### 11.2 Worker-side settings

| Variable | Purpose | Current behavior |
|---|---|---|
| `RABBITMQ_CONSUME_MODE` | `poll` or `consume`. | `poll` |
| `RABBITMQ_PREFETCH_COUNT` | Unacknowledged message limit in consume mode. | `1` |
| `RABBITMQ_QUEUE_DURABLE` | Queue survives broker restart. | `true` |
| `RABBITMQ_QUEUE_AUTO_DELETE` | Delete queue when unused. | `false` |
| `RABBITMQ_QUEUE_QUORUM` | Quorum queue mode. | `false` |
| `RABBITMQ_MAX_CONNECTIONS` | Pool maximum connections. | `10` |
| `RABBITMQ_MIN_CONNECTIONS` | Pool minimum connections. | `2` |
| `RABBITMQ_HEALTH_CHECK_ENABLED` | Pool health checks. | `true` |

### 11.3 Docker ports

| Port | Purpose |
|---|---|
| `5672` | AMQP traffic from Laravel and the worker. |
| `15672` | RabbitMQ management UI. |
| `8081` | Reverb WebSocket port exposed to browsers. |
| `8080` | Reverb container port used by the backend. |

---

## 12. File index

| File | Relevance |
|---|---|
| `composer.json` | RabbitMQ PHP package dependency. |
| `Dockerfile` | Native AMQP extension installation. |
| `docker-compose.yml` | Broker, worker, ports, volume, health check. |
| `.env.docker` | Runtime queue connection and RabbitMQ connection variables. |
| `config/queue.php` | Declares the `rabbitmq` Laravel queue connection. |
| `config/rabbitmq.php` | Full driver configuration: pool, backoff, DLX, confirms, consumer mode. |
| `app/Events/OrderCreated.php` | Queued broadcast event for new orders. |
| `app/Events/OrderStatusUpdated.php` | Queued broadcast event for status changes. |
| `app/Notifications/OrderCreatedNotification.php` | Queued order-confirmation email. |
| `app/Notifications/VerifiyEmailNotification.php` | Queued email-verification notification. |
| `app/Http/Controllers/V1/User/UserOrderController.php` | Enqueues order notification and order-created broadcast. |
| `app/Http/Controllers/V1/Admin/AdminOrderController.php` | Enqueues order-status broadcast. |
| `routes/channels.php` | Authorizes customer and admin private channels. |
| `WEBSOCKET.md` | Realtime and queue architecture documentation. |
| `frontend/README.md` | Customer realtime notes, including the RabbitMQ queue requirement. |

---

## 13. Glossary

| Term | Definition |
|---|---|
| AMQP | Advanced Message Queuing Protocol; the protocol RabbitMQ implements. |
| Broker | Middleware that receives, stores, and routes messages. |
| Consumer | Process that reads messages from a queue. |
| Dead-letter queue | Queue that receives messages that cannot be processed. |
| Durable queue | Queue definition that survives a broker restart. |
| Exchange | RabbitMQ routing component that sends messages to queues. |
| Prefetch | Maximum number of unacknowledged messages delivered to a consumer. |
| Publisher confirm | Broker acknowledgement that a published message was accepted. |
| Queue | Buffer of messages waiting to be consumed. |
| Reverb | Laravel's WebSocket server used for realtime browser updates. |
| Routing key | Label used by an exchange to route messages. |
| Vhost | Virtual host that isolates RabbitMQ resources. |
| Worker | Long-running process that consumes and executes queued jobs. |

---

## 14. Bottom line

RabbitMQ is the asynchronous backbone of the realtime and notification features in this
project.

It gives the API a fast path:

```text
commit the order -> enqueue the work -> respond
```

It gives the system a resilient path:

```text
RabbitMQ -> queue-worker -> email / Reverb
```

It gives operators visibility through the management UI, and it gives the application a
clean scaling path through a separately deployable worker.

The most important operational rule is:

> If orders are created but realtime notifications do not arrive, check `queue-worker`
> and the RabbitMQ `default` queue before debugging the frontend.

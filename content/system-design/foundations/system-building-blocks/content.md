# The Building Blocks of a System

**Module:** Foundations · **Interview priority:** Core

## What Is It?

Almost every large system is assembled from the same small set of building blocks. Every app shows **data** — text, images, video, audio — and each block exists to store that data, reach it, or deliver it faster and more reliably.

```text
                         ┌──────────── Monitoring, logs, traces (watch everything) ─────────────┐
 Client  ─►  DNS  ─►  Load balancer  ─►  App servers (APIs)  ─►  Cache  ─►  Database
 (web,                                        │      │                         │
  mobile)                                     │      └─►  Object storage (files)
    ▲                                         └─►  Message queue  ─►  Workers (email, SMS, resize)
    └──────────── CDN serves static files and media from the edge ─────────────┘
```

## Why It Exists

Knowing the blocks and what each one is *for* lets you build any design from requirements: "reads dominate → cache", "files are large → object storage + CDN", "work can happen later → queue". It also gives a shared vocabulary for interviews.

## How It Works

| Block | Job | Typical technology | Covered in |
|-------|-----|--------------------|-----------|
| **Client** | What users touch; starts most requests | Browser, mobile app, ATM, another service | [Request Journey](../../communication/request-journey/content.md) |
| **DNS** | Turns a name into an IP address | Route 53, Cloud DNS | [DNS](../../communication/dns-in-system-design/content.md) |
| **Load balancer** | Spreads requests over healthy servers | Nginx, HAProxy, cloud LBs | [Load Balancing](../../scaling-and-distribution/load-balancing-fundamentals/content.md) |
| **Application servers + APIs** | Business logic; expose endpoints; hide the database | Spring Boot, Node.js, Go services | [REST API Design](../../communication/rest-api-design/content.md) |
| **Database** | Durable storage and querying of structured data | PostgreSQL, MySQL, MongoDB, Cassandra | [Choosing a Database](../../data-and-storage/choosing-a-database/content.md) |
| **Cache** | Keeps hot data in memory to skip slow work | Redis, Memcached | [Caching](../../caching/caching-fundamentals/content.md) |
| **Object storage** | Stores large files cheaply and durably | Amazon S3, GCS, Azure Blob | [Object Storage](../../data-and-storage/object-and-blob-storage/content.md) |
| **CDN** | Serves static content from servers near users | CloudFront, Akamai, Cloudflare | [CDN](../../communication/content-delivery-networks/content.md) |
| **Message queue** | Holds work to be done asynchronously | RabbitMQ, Kafka, SQS | [Message Queues](../../messaging/message-queues/content.md) |
| **Monitoring and logging** | Shows what is happening and what broke | Prometheus, Grafana, ELK, OpenTelemetry | [Observability](../../observability/observability-fundamentals/content.md) |

### Why users never talk to the database directly

The application layer exposes operations such as `GET /students/42` and hides tables, queries and credentials. Direct database access would be unsafe (anyone could delete data others rely on), fragile (every client would break when the schema changes) and unscalable (no place to cache, validate or rate-limit). Clients in any language — a React site, a Swift iOS app — speak HTTP and JSON to the same API.

### Synchronous vs asynchronous calls

- **Synchronous:** the caller waits for the answer before continuing. Use it when the user needs the result now: "is this item in stock?", "was the payment accepted?".
- **Asynchronous:** the caller hands the work off (usually through a queue) and continues. Use it when the work can happen later: sending the confirmation email, generating thumbnails, updating analytics.

```text
Sync:   Order service ──"reserve stock"──► Inventory  (waits for "OK")
Async:  Order service ──"order placed"──► Queue ──► Email service   (does not wait)
```

Async calls keep the user-facing path fast and isolate failures: if the email service is down, orders still succeed and emails are sent later.

**Think about it:** after a purchase, which of these should be synchronous: decrementing inventory, sending the receipt email, notifying the warehouse, updating the "bestsellers" list?

<details>
<summary>Answer</summary>

Only **decrementing inventory** must be synchronous (the last item must show as sold out immediately, and the purchase must fail if it is). The receipt, warehouse notification and bestseller list can be asynchronous events processed after the order is committed.

</details>

## Common Traps

> [!WARNING]
> **Common trap:** adding every block to every design. Each block must answer a requirement; a 50-user internal tool needs an app server, a database and backups — not a CDN, Kafka and Redis.

## Interview Follow-up

- *"Why put a queue between the order service and the email service?"* Decoupling (each can fail and deploy independently), lower latency for the user, buffering bursts, and retries handled by the queue.

## Key Takeaways

- Core blocks: client, DNS, load balancer, app servers/APIs, database, cache, object storage, CDN, queue, monitoring.
- The API layer hides storage from clients for safety, flexibility and scale.
- Synchronous when the caller needs the answer now; asynchronous when the work can happen later.

# Observability: Metrics, Logs and Traces

**Module:** Observability and Operations · **Interview priority:** Core

## What Is It?

**Observability** is how well you can understand what a running system is doing — and why — from the data it emits, without adding new code during an incident. Building a product and keeping it alive are different jobs; observability is the foundation of the second.

Three kinds of signal (often called the three pillars):

| Signal | What it is | Answers | Example |
|--------|-----------|---------|---------|
| **Metrics** | Numbers aggregated over time | *Is something wrong? How much? Since when?* | requests/s, error rate, P99 latency, CPU %, queue depth |
| **Logs** | Timestamped records of discrete events | *What exactly happened in this case?* | "payment 9183 declined: card expired" |
| **Traces** | The path of one request across services, with timing per step | *Where did this request spend its time or fail?* | checkout → 40 ms auth → 300 ms payment → 12 ms DB |

## Why It Exists

In a distributed system, a slow page might be caused by any of dozens of services, databases, caches and networks. Without signals, debugging is guesswork; with them, you can go from "users are complaining" to "the payment provider's P99 doubled at 14:02 after deploy 812" in minutes.

## How It Works

### Metrics

- Cheap to store (numbers, aggregated), fast to query, ideal for **dashboards and alerts**.
- Types: **counters** (only go up: requests, errors), **gauges** (current value: memory, queue depth), **histograms** (distributions: latency → percentiles).
- Labels (dimensions) such as `endpoint`, `status`, `region` allow slicing — but labels with unbounded values (user ID, request ID) explode storage (**high cardinality**). Keep those for logs and traces.
- Tools: Prometheus, Grafana, cloud monitoring services.

### Logs

- **Structured logging:** emit machine-parseable key-value records (usually JSON) instead of free text, so logs can be searched and aggregated.

```json
{"ts":"2026-10-07T14:02:11.482Z","level":"ERROR","service":"payments","traceId":"4bf92f3577b34da6",
 "orderId":"77","event":"charge_failed","provider":"cardco","httpStatus":502,"latencyMs":3011}
```

- Include a **correlation / trace ID** in every log line so all logs for one request can be found across services.
- Use levels (DEBUG, INFO, WARN, ERROR) sensibly; DEBUG off in production by default (log volume costs money and can fill disks).
- **Never log secrets** — passwords, tokens, full card numbers, personal data beyond need.
- Centralise logs (ELK/OpenSearch, Loki, cloud logging) because servers come and go.

### Traces

A **trace** is a tree of **spans**, one per operation (an HTTP call, a query), each with start time, duration and attributes, all sharing a trace ID propagated through headers. See [Distributed Tracing](../distributed-tracing/content.md). **OpenTelemetry** is the vendor-neutral standard for producing metrics, logs and traces.

### What to measure first

| Area | Measure |
|------|---------|
| APIs | Request rate (throughput), error rate by status class (5xx, 4xx), latency percentiles (P50/P95/P99), saturation (in-flight requests) |
| Machines | CPU, memory, disk I/O and space, network |
| Dependencies | Database query latency and connection-pool usage, cache hit ratio, queue depth and consumer lag |
| Business | Orders per minute, signups, payment success rate — often the first sign that something is wrong |

The **golden signals** — latency, traffic, errors and saturation — cover most services ([Monitoring and Alerting](../monitoring-and-alerting/content.md)).

**Think about it:** the payment success rate dropped from 98 % to 85 %, but every server's CPU and memory look normal. Which signals help you find the cause?

<details>
<summary>Answer</summary>

Metrics sliced by dimension (payment provider, card type, region, app version) show **where** failures concentrate; structured logs for failed payments (filtered by error code and provider) show **what** happened; traces of failing requests show **which hop** failed or slowed — for example a provider returning 502 after 3 s. Machine metrics alone cannot reveal a failing dependency.

</details>

## Common Traps

> [!WARNING]
> **Common trap:** "We log everything, so we have observability." Unstructured logs without correlation IDs, metrics or traces make questions like "which service caused the slowdown?" nearly impossible to answer quickly.

## Interview Follow-up

- *"How would you monitor this design?"* Golden signals per service, dependency metrics (DB latency, cache hit ratio, queue lag), business KPIs, structured logs with trace IDs, distributed tracing, and alerts on SLO burn.

## Key Takeaways

- Observability = understanding the system from its outputs: metrics (what and how much), logs (exact events), traces (where across services).
- Use structured logs with correlation IDs; avoid secrets and high-cardinality metric labels.
- Measure APIs, machines, dependencies and business outcomes; start with the golden signals.
- OpenTelemetry standardises collection.

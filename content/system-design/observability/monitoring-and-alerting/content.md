# Monitoring and Alerting

**Module:** Observability and Operations · **Interview priority:** Core

## What Is It?

- **Monitoring** continuously collects and displays measurements of the system — mainly metrics on dashboards — so people can see its health and trends.
- **Alerting** notifies a person (or an automated system) when a measurement shows that users are, or soon will be, affected.

Two things are watched: **how the APIs perform** for users, and **how the machines and dependencies cope**.

## Why It Exists

A failure nobody notices lasts until customers complain. Good monitoring detects problems in minutes, shows their scope, and helps decide when to scale up (evening peaks) and down (nights) to save cost. Good alerting wakes people only when action is needed.

## How It Works

### The four golden signals

| Signal | Meaning | Example metric |
|--------|---------|----------------|
| **Latency** | Time to serve requests (successful and failed separately) | P50/P95/P99 of `/checkout` |
| **Traffic** | Demand on the system | Requests/s, messages/s |
| **Errors** | Rate of failed requests | 5xx rate, failed payments |
| **Saturation** | How "full" the service is | CPU, memory, queue depth, connection-pool usage |

Two related checklists: **RED** for request-driven services (Rate, Errors, Duration) and **USE** for resources (Utilisation, Saturation, Errors).

### API monitoring

- **Throughput:** if an API handles up to 10,000 requests/s and traffic reaches 8,000–9,000, alert and add capacity or shift load before it tops out.
- **Error codes:** track counts and rates of 5xx, 4xx and 3xx; alert on spikes in 5xx (server faults) and unusual 4xx patterns (a broken client release, an attack); use logs to find the root cause.
- **Health checks:** active synthetic requests and passive observation of real traffic ([Load Balancing](../../scaling-and-distribution/load-balancing-fundamentals/content.md)).
- **Latency percentiles:** not averages ([Latency Percentiles](../latency-percentiles/content.md)).

### Machine and dependency monitoring

| Resource | Example warning threshold | Why |
|----------|---------------------------|-----|
| CPU | Sustained above ~75 % | Latency rises sharply near saturation |
| Memory | Above ~90 % | Risk of swapping or out-of-memory kills |
| Disk space | Above ~80 % | Full disks stop databases and logging |
| Disk I/O, network | Near device limits | Hidden bottlenecks |
| Database | Slow queries, replication lag, connections used | The usual shared bottleneck |
| Queues | Depth, consumer lag, oldest message age | Backlog and backpressure |

Thresholds are starting points — tune them to each system's behaviour.

### Alert on symptoms, not just causes

- **Page** (wake someone) for **user-visible symptoms**: error rate above the SLO, latency above target, the checkout success rate dropping, a queue's oldest message older than 10 minutes.
- **Ticket or dashboard** for **causes** that are not yet hurting users: one server's CPU at 85 %, disk at 75 %.
- **SLO burn-rate alerts:** alert when the error budget is being consumed fast enough to exhaust it — fast burn (pages) and slow burn (tickets) — instead of on every brief spike ([SLA, SLO, SLI](../../foundations/sla-slo-sli-and-availability/content.md)).

Every alert should be **actionable**, have an owner, a severity and a **runbook** link. Alerts that fire often without action cause **alert fatigue**, and real alerts get ignored.

### After the incident

Write a **blameless post-incident review (RCA)**: timeline, impact, root cause, what detection missed, and action items that fix the system (better alerts, safer deploys, capacity), not the people.

**Think about it:** the on-call engineer receives 40 alerts a night — CPU above 70 % on individual servers, a few slow queries, a disk at 65 %. Users rarely notice anything. What should change?

<details>
<summary>Answer</summary>

These are cause-based alerts that rarely need action, so they create fatigue. Page only on user-facing symptoms and SLO burn rates (error rate, latency, success rate of key flows); move per-server CPU and disk warnings to dashboards or daytime tickets; raise or remove thresholds that never correlate with incidents; deduplicate and group related alerts; and make every remaining page actionable with a runbook.

</details>

## Common Traps

> [!WARNING]
> **Common trap:** alerting on every metric that looks unusual. Too many alerts are as bad as none: real problems drown in noise. Page on user impact; track causes on dashboards.

## Interview Follow-up

- *"What would you monitor and alert on in your design?"* Golden signals per service with SLO-based paging, dependency health (database latency and replication lag, cache hit ratio, queue lag), machine saturation on dashboards, and business KPIs such as orders per minute.

## Key Takeaways

- Monitor the golden signals — latency, traffic, errors, saturation — for APIs, plus machine and dependency health.
- Track throughput against capacity, error-code rates and latency percentiles; set saturation thresholds and tune them.
- Page on user-facing symptoms and SLO burn rate; send cause-level warnings to dashboards or tickets.
- Make alerts actionable with owners and runbooks; learn from incidents with blameless reviews.

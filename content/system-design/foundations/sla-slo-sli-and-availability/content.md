# SLA, SLO, SLI and Availability Math

**Module:** Foundations · **Interview priority:** Frequently asked

## What Is It?

Three related terms turn "the service should be reliable" into numbers:

- **SLI (service level indicator):** a measurement of behaviour users feel. Example: the fraction of HTTP requests that return a non-5xx response within 300 ms.
- **SLO (service level objective):** the internal target for an SLI over a window. Example: 99.9 % of requests succeed within 300 ms, measured over 30 days.
- **SLA (service level agreement):** a contract with customers that promises a level of service and states the consequence (usually service credits or refunds) if it is missed. SLAs are set looser than SLOs so the team has warning before a breach.

**Availability** is the fraction of time (or of requests) for which the service works.

## Why It Exists

Without a target, every outage is either a panic or ignored. An SLO tells the team how much unreliability is acceptable, which decides architecture (do we need a second region?) and process (do we freeze releases?). An SLA turns reliability into a business commitment.

## How It Works

### The nines

| Availability | Downtime per year | Per 30-day month | Per day |
|--------------|-------------------|------------------|---------|
| 99 % ("two nines") | 3.65 days | 7.2 hours | 14.4 min |
| 99.9 % | 8.76 hours | 43.2 min | 1.44 min |
| 99.95 % | 4.38 hours | 21.6 min | 43 s |
| 99.99 % | 52.6 min | 4.32 min | 8.6 s |
| 99.999 % | 5.26 min | 26 s | 0.86 s |

Each extra nine cuts allowed downtime tenfold and usually costs far more than tenfold: automated failover, multiple zones or regions, and careful releases. At 99.99 %, a human cannot even respond to a page before the month's budget is gone, so recovery must be automatic.

### Error budgets

The **error budget** is `1 − SLO`. A 99.9 % SLO over 30 days allows 43.2 minutes (or 0.1 % of requests) of failure. While budget remains, the team ships features; when it is spent, effort shifts to reliability work. This turns "move fast" versus "be stable" into a measurable agreement.

### Availability of combined components

**Components in series** (a request needs all of them) multiply:

```text
A_total = A1 × A2 × … × An
LB 99.99 % → app 99.9 % → DB 99.9 %
0.9999 × 0.999 × 0.999 = 0.9979  →  99.79 %  (lower than any single part)
```

**Redundant components in parallel** (any one is enough) combine as:

```text
A_total = 1 − (1 − A1) × (1 − A2) × …
two app servers at 99 % each: 1 − 0.01 × 0.01 = 0.9999  →  99.99 %
```

The parallel formula assumes failures are **independent**. Two servers in the same rack, on the same power supply, running the same buggy release, fail together; real gains are smaller unless redundancy spans racks, zones and release batches.

**Think about it:** a request passes through 10 microservices in series, each 99.9 % available. What is the end-to-end availability?

<details>
<summary>Answer</summary>

0.999¹⁰ ≈ 0.990 → about **99 %**, roughly 7 hours of failure per month. Long synchronous call chains erode availability, which is why designs shorten them, add redundancy per service, use timeouts and fallbacks, and move non-essential work to asynchronous queues.

</details>

### Choosing good SLIs

- Measure from the user's side where possible (load balancer logs, synthetic checks), not "the process is running".
- Use request-based SLIs (successful requests ÷ total) for APIs and time-based ones (minutes up ÷ minutes) for simple checks.
- Include latency: a request that succeeds after 30 seconds is a failure to the user.

## Comparison

| | SLI | SLO | SLA |
|---|-----|-----|-----|
| What | A measurement | A target for the measurement | A contract with consequences |
| Audience | Engineers | Engineering and product | Customers, legal |
| Example | 99.95 % of requests OK this month | ≥ 99.9 % per 30 days | 99.5 % or 10 % credit |
| If missed | — | Spend effort on reliability | Pay penalties |

## Common Traps

> [!WARNING]
> **Common trap:** "Adding components always increases availability." Components in series lower it. Only redundant components in parallel raise it, and only when their failures are independent.

- **"100 % is the right target."** It is unachievable and blocks all change; users cannot tell 99.999 % from 100 % through their own networks.
- **"Average latency is a good SLI."** Use percentiles (P95/P99).

## Interview Follow-up

- *"How much downtime is 99.9 %?"* About 8.8 hours a year, or 43 minutes in a 30-day month.
- *"How do you raise availability from 99.9 % to 99.99 %?"* Remove single points of failure, spread redundancy across zones, automate failover and rollbacks, use health checks and gradual releases.

## Key Takeaways

- SLI = measurement, SLO = target, SLA = contract (looser than the SLO).
- Each nine is ten times less downtime: 99.9 % ≈ 43 min/month, 99.99 % ≈ 4.3 min/month.
- Series availability multiplies down; parallel redundancy multiplies failure probabilities down — if failures are independent.
- The error budget (1 − SLO) balances shipping speed against reliability.

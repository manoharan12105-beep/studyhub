# Observability: Metrics, Logs and Traces — Interview Questions

## Beginner

### Q1. What are the three pillars of observability?

**Style:** Direct

<details>
<summary>Answer</summary>

Metrics (numeric measurements aggregated over time, for dashboards and alerts), logs (timestamped records of individual events, for detail), and traces (the end-to-end path of a single request across services with timing per step, for locating latency and failures).

</details>

### Q2. What is structured logging and why use it?

**Style:** Why

<details>
<summary>Answer</summary>

Writing log entries as machine-parseable key-value data (usually JSON) with consistent fields — timestamp, level, service, trace ID, event and context — instead of free text. It makes logs searchable, filterable and aggregatable in central log systems, and lets you correlate all entries for one request.

</details>

## Intermediate

### Q3. What is a correlation ID and why is it important?

**Style:** Why

<details>
<summary>Answer</summary>

A unique identifier assigned when a request enters the system and propagated through every service call, message and log line. It lets you gather all logs (and spans) for one request across many services, which is otherwise nearly impossible in a distributed system.

</details>

### Q4. Why shouldn't you use user IDs as metric labels?

**Style:** Trap

<details>
<summary>Answer</summary>

Each unique label combination creates a separate time series. Unbounded values such as user or request IDs create millions of series (high cardinality), overwhelming the metrics system's memory and storage and slowing queries. Use bounded labels (endpoint, status class, region) for metrics and put per-user detail in logs and traces.

</details>

### Q5. What would you monitor for an API service?

**Style:** How

<details>
<summary>Answer</summary>

Request rate, error rate by status class and endpoint, latency percentiles (P50, P95, P99), saturation (in-flight requests, thread and connection pool usage), host metrics (CPU, memory, disk, network), dependency health (database latency, cache hit ratio, downstream error rates, queue lag), and business indicators such as successful orders per minute.

</details>

## Advanced

### Q6. Metrics, logs or traces — which do you reach for first in an incident, and why?

**Style:** How

<details>
<summary>Answer</summary>

Metrics first: dashboards and alerts show whether something is wrong, how badly, since when and where (which service, endpoint, region or version). Then traces to find which hop in the request path is slow or failing, and logs for the specific details of failing cases. Each narrows the search for the next.

</details>

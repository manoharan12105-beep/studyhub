# Distributed Tracing — Interview Questions

## Beginner

### Q1. What is distributed tracing?

**Style:** Direct

<details>
<summary>Answer</summary>

Recording the end-to-end path of individual requests through a distributed system as a trace made of spans — one per operation such as an HTTP call or database query — with timings, statuses and attributes, so you can see where each request spent its time or failed.

</details>

### Q2. What are traces and spans?

**Style:** Direct

<details>
<summary>Answer</summary>

A span is a single timed operation with a name, start time, duration, status, attributes and a parent span ID. A trace is the tree of all spans that share one trace ID — the full journey of one request across services.

</details>

## Intermediate

### Q3. How is trace context propagated between services?

**Style:** How

<details>
<summary>Answer</summary>

Each outgoing request carries the trace ID and the current span ID in headers (the W3C `traceparent` header); the receiving service creates child spans under that context and propagates it further, including into message headers for asynchronous hops. Instrumentation libraries such as OpenTelemetry handle this for common frameworks.

</details>

### Q4. Head-based vs tail-based sampling?

**Style:** Comparison

<details>
<summary>Answer</summary>

Head-based sampling decides at the start of a request whether to record it (for example 1 %), which is cheap but may discard the rare error or slow traces you need. Tail-based sampling buffers spans and decides after the trace completes, keeping all errors and slow traces plus a sample of normal ones — more useful, but needs more collection infrastructure.

</details>

## Advanced

### Q5. Traces stop at the API service even though work continues in a worker consuming from a queue. Why, and how do you fix it?

**Style:** Debugging

<details>
<summary>Answer</summary>

The trace context is not propagated across the asynchronous boundary: the producer must inject the context into message headers and the consumer must extract it and start its span as a child (or a linked span). Context can also be lost in thread pools or scheduled tasks; use instrumentation that wraps executors and messaging clients.

</details>

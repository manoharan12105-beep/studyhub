# Distributed Tracing

**Module:** Observability and Operations · **Interview priority:** Frequently asked

> [!NOTE]
> **Advanced topic.** Builds on [Observability Fundamentals](../observability-fundamentals/content.md).

## What Is It?

**Distributed tracing** records the path of a single request as it travels through many services, with the timing of every step. A **trace** is a tree of **spans**; each span is one unit of work (an incoming HTTP request, an outgoing call, a database query, publishing a message) with a start time, duration, status and attributes.

```text
Trace 4bf92f35…  POST /checkout                                   total 1,240 ms
├─ api-gateway       auth check                    35 ms
├─ order-service     create order                 110 ms
│   └─ postgres      INSERT orders                 18 ms
├─ payment-service   charge                       980 ms   ◄── the slow hop
│   └─ cardco API    POST /charges                955 ms   (provider latency)
└─ notification      publish OrderPlaced            6 ms
```

## Why It Exists

In a monolith, one profiler shows where time goes. In microservices, one user request may touch ten services, three databases and a queue; each team's logs and metrics show only their piece. Tracing answers "**which hop** made this request slow or fail?" directly.

## How It Works

### Context propagation

The first service (or the gateway) creates a **trace ID**; every outgoing call carries the trace ID and the current span ID in headers — the W3C standard is the `traceparent` header:

```http
traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01
```

Each service creates child spans under the incoming context and passes the context on — including through **message queues** (in message headers), so asynchronous steps join the same trace. Instrumentation libraries (OpenTelemetry) do this automatically for common HTTP clients, servers, database drivers and brokers.

### Collection and sampling

Spans are exported to a tracing backend (Jaeger, Zipkin, Tempo, vendor APMs) that assembles and visualises traces. Recording every request is expensive at scale, so systems **sample**:

- **Head-based sampling:** decide at the start (keep 1 % of traces). Cheap, but may miss rare errors.
- **Tail-based sampling:** decide after the trace completes — keep all errors and slow traces plus a small share of normal ones. More useful, more infrastructure.

### Using traces well

- Put the **trace ID in every log line** so you can jump from a trace to its logs and back.
- Add meaningful attributes (endpoint, customer tier, cache hit/miss, retry count) but never secrets.
- Look for: one slow span dominating; many **sequential** spans that could run in parallel; repeated identical spans (an N+1 pattern across services); retries hidden inside a span; long gaps (queueing).

**Think about it:** a trace shows `GET /profile` making 50 sequential calls to `friends-service`, each 8 ms. What is the problem and the fix?

<details>
<summary>Answer</summary>

An N+1 pattern across services: 50 × 8 ms = 400 ms spent on sequential calls. Batch them into one call (`GET /friends?ids=…`), or run them in parallel with a concurrency limit, or cache the results.

</details>

## Common Traps

> [!WARNING]
> **Common trap:** losing context at asynchronous boundaries — thread pools, message queues, scheduled jobs. If the trace context is not passed along, traces stop at the first async hop and the slow part is invisible.

## Interview Follow-up

- *"How do you find which microservice is slowing down checkout?"* Look at latency percentiles per service, then examine slow traces of checkout requests to see which span dominates, and jump to that service's logs with the trace ID.

## Key Takeaways

- A trace is a tree of spans showing one request's path and timing across services.
- Context (trace ID + parent span ID) propagates through headers, including message headers.
- Sample traces (tail-based sampling keeps errors and slow requests); link traces and logs by trace ID.
- Traces reveal the slow hop, sequential calls that could be parallel, N+1 calls and hidden retries.

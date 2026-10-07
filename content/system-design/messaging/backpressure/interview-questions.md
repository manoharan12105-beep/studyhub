# Backpressure — Interview Questions

## Beginner

### Q1. What is backpressure?

**Style:** Direct

<details>
<summary>Answer</summary>

A mechanism by which a component that cannot keep up signals upstream producers to slow down (or have their work rejected), so the flow of work matches the capacity of the slowest stage instead of piling up in unbounded buffers.

</details>

## Intermediate

### Q2. Why doesn't a large queue solve a producer–consumer rate mismatch?

**Style:** Why

<details>
<summary>Answer</summary>

A queue absorbs temporary bursts, but if producers are faster on average, the backlog grows indefinitely: processing delay increases without bound, storage or memory eventually fills, and messages may expire before processing. Only matching rates — scaling consumers, slowing producers or shedding work — fixes it.

</details>

### Q3. What metrics show you need backpressure?

**Style:** Direct

<details>
<summary>Answer</summary>

Steadily growing queue depth or consumer lag, rising age of the oldest unprocessed message, consumers or downstream dependencies saturated, growing memory in services that buffer work in-process, and increasing end-to-end processing latency.

</details>

### Q4. How does pull-based consumption provide natural backpressure?

**Style:** How

<details>
<summary>Answer</summary>

Consumers request new messages only when they have capacity, so they are never pushed more than they can handle; the backlog stays in the broker's durable storage rather than overwhelming consumer memory, and lag metrics reveal the mismatch for scaling decisions.

</details>

## Advanced

### Q5. Your consumers are autoscaled to 50 instances but lag still grows. What could be wrong?

**Style:** Debugging

<details>
<summary>Answer</summary>

The bottleneck is not consumer count: partitions may cap parallelism (extra consumers idle), the downstream database or API may be saturated (more consumers make contention worse), processing may be inefficient (no batching, synchronous per-message calls), or a hot partition may concentrate load on one consumer. Measure where time is spent and fix that resource.

</details>

### Q6. When is dropping messages an acceptable response to backpressure?

**Style:** Trade-off

<details>
<summary>Answer</summary>

When messages are low value, superseded or approximable: periodic location or sensor updates (the next one replaces it), debug logs and traces (sampling), metrics that can be aggregated. Never for business events like orders, payments or messages users sent — those must be buffered durably, delayed or rejected back to the caller so they can retry.

</details>

# Backpressure — Practice

### P1. Bounded buffer

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** bounded queues

A service's in-memory work queue is unbounded. Under sustained overload, what eventually happens?

- A) Throughput increases
- B) Latency grows without limit and the process can run out of memory
- C) Requests are automatically rejected with 429
- D) The queue shrinks

<details>
<summary>Answer</summary>

**Answer:** B) Latency grows without limit and the process can run out of memory

</details>

### P2. Lag growth

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** consumer lag

Events arrive at 4,000/s; consumers handle 3,200/s. How much lag builds in 15 minutes? Once arrivals drop to 2,000/s (capacity still 3,200/s), how long does the backlog take to clear?

<details>
<summary>Answer</summary>

Lag = (4,000 − 3,200) × 900 = **720,000 events**. Afterwards the spare capacity is 3,200 − 2,000 = 1,200/s, so 720,000 ÷ 1,200 = 600 s = **10 minutes** to clear.

</details>

### P3. Choose a response

**Difficulty:** Medium · **Type:** Design · **Concepts:** backpressure strategies

For each overloaded pipeline choose a response: (a) a click-stream for analytics, (b) order events to the invoicing service, (c) live GPS updates from drivers.

<details>
<summary>Answer</summary>

(a) Buffer durably and accept delay, or sample if delay is unacceptable. (b) Never drop: buffer durably in the broker, scale consumers, and batch writes. (c) Keep only the latest position per driver (drop superseded updates).

</details>

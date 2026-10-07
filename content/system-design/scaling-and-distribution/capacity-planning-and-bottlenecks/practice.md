# Capacity Planning and Finding Bottlenecks — Practice

### P1. Little's law

**Difficulty:** Easy · **Type:** Calculation · **Concepts:** concurrency

An API serves 2,000 requests/s with an average latency of 150 ms. How many requests are in flight on average? What if a dependency raises latency to 1.5 s?

<details>
<summary>Answer</summary>

2,000 × 0.15 = **300**. At 1.5 s: 2,000 × 1.5 = **3,000** — ten times more threads and connections in use.

</details>

### P2. Instance count

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** capacity planning

Peak 18,000 requests/s; one instance handles 900 requests/s at target latency; target utilisation 70 %. How many instances?

<details>
<summary>Answer</summary>

18,000 ÷ (900 × 0.7) = 18,000 ÷ 630 ≈ 28.6 → **29 instances** (before adding spares for failures and growth).

</details>

### P3. Identify the bottleneck

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** bottleneck identification

Under load: app CPU 35 %, database CPU 95 %, cache CPU 10 %, network 20 %. Throughput has plateaued. Where is the bottleneck and what are two next steps?

<details>
<summary>Answer</summary>

The database. Next steps: find the most expensive queries (query statistics, plans) and fix or index them; offload reads to a cache or read replicas. Adding app servers would not help.

</details>

### P4. Utilisation

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** utilisation and latency

Why do teams avoid running critical resources above about 70–80 % at peak?

- A) Hardware wears out faster
- B) Queueing makes latency rise steeply, and there is no headroom for spikes or failures
- C) Cloud providers forbid it
- D) Monitoring stops working

<details>
<summary>Answer</summary>

**Answer:** B) Queueing makes latency rise steeply, and there is no headroom for spikes or failures

</details>

# Distributed Tracing — Practice

### P1. Read the trace

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** finding the slow hop

A 900 ms request trace shows spans: auth 20 ms, catalog 60 ms, pricing 750 ms (containing a 730 ms call to a tax API), render 40 ms. Where should optimisation start?

- A) Auth
- B) The tax API call inside pricing
- C) Rendering
- D) The load balancer

<details>
<summary>Answer</summary>

**Answer:** B) The tax API call inside pricing

</details>

### P2. Sequential spans

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** parallelism

A trace shows calls to inventory (100 ms), reviews (120 ms) and recommendations (150 ms) one after another; none depends on another. What is the minimum latency for these three if parallelised?

<details>
<summary>Answer</summary>

Sequential: 370 ms. In parallel: the longest one, **150 ms** (plus small overhead).

</details>

### P3. Sampling choice

**Difficulty:** Medium · **Type:** Design · **Concepts:** sampling

A service handles 50,000 requests/s; errors are 0.05 %. With 1 % head-based sampling, how many error traces per second are kept on average? What would tail-based sampling keep?

<details>
<summary>Answer</summary>

Errors: 50,000 × 0.0005 = 25/s; 1 % head sampling keeps about **0.25 error traces/s** (one every 4 seconds). Tail-based sampling can keep **all 25/s** error traces plus a small sample of successful ones.

</details>

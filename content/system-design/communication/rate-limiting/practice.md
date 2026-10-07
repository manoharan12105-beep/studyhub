# Rate Limiting — Practice

### P1. Status code

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** HTTP 429

Which response is correct when a client exceeds its rate limit?

- A) 403 Forbidden
- B) 429 Too Many Requests with `Retry-After`
- C) 500 Internal Server Error
- D) 200 OK with an error message

<details>
<summary>Answer</summary>

**Answer:** B) 429 Too Many Requests with `Retry-After`

</details>

### P2. Trace a token bucket

**Difficulty:** Medium · **Type:** Output · **Concepts:** token bucket

Capacity 2, refill 1 token every 500 ms, bucket full at t = 0. Requests arrive at 0, 100, 200, 600, 700 and 1,300 ms. Which are allowed?

<details>
<summary>Answer</summary>

t=0: 2 → allow (1 left). t=100: 1.2 → allow (0.2). t=200: 0.4 → reject. t=600: 0.4 + 0.8 = 1.2 → allow (0.2). t=700: 0.4 → reject. t=1300: 0.4 + 1.2 = 1.6 → allow (0.6). Allowed: **0, 100, 600, 1300**.

</details>

### P3. Sliding window counter

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** sliding window

Limit 50 requests per minute. The previous minute had 40 requests; the current minute has 22 so far and is 40 % complete. Is another request allowed?

<details>
<summary>Answer</summary>

Estimate = 22 + 40 × (1 − 0.4) = 22 + 24 = 46. 46 < 50, so **allowed** (the new request makes it 47).

</details>

### P4. Choose the algorithm

**Difficulty:** Medium · **Type:** Design · **Concepts:** algorithm choice

Match: (a) public API that should allow short bursts but cap the average, (b) protecting a legacy system that can only process 10 requests/s evenly, (c) a simple daily quota of 10,000 calls.

<details>
<summary>Answer</summary>

(a) Token bucket, (b) leaky bucket (queue drained at a constant rate), (c) fixed window counter (one counter per key per day).

</details>

### P5. Distributed limits

**Difficulty:** Hard · **Type:** Failure · **Concepts:** distributed rate limiting

A limit of 100/min is enforced separately on each of 10 gateway nodes with a round-robin load balancer. What is a client's effective limit, and how do you fix it?

<details>
<summary>Answer</summary>

Up to about **1,000/min**, because each node allows 100. Fix with a shared counter store (Redis with atomic updates), consistent routing of each key to one node, or per-node limits of 10/min with synchronisation.

</details>

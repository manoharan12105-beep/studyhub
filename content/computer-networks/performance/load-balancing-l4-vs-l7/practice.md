# Load Balancing: L4 vs L7 — Practice

### P1. Path routing

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** L7 routing

Which load balancer can send `/images/*` and `/api/*` to different server pools?

- A) An L4 load balancer
- B) An L7 load balancer
- C) A hub
- D) A DNS server with one A record

<details>
<summary>Answer</summary>

**Answer:** B) An L7 load balancer

</details>

### P2. Round robin

**Difficulty:** Easy · **Type:** Output · **Concepts:** algorithms

Round robin over servers A, B, C; requests 1–7 arrive. Which server gets each? With weights A:2, B:1, C:1 (smooth weighted), roughly how are 8 requests split?

<details>
<summary>Answer</summary>

Round robin: 1A, 2B, 3C, 4A, 5B, 6C, 7A. Weighted 2:1:1 over 8 requests: **A 4, B 2, C 2**.

</details>

### P3. L4 or L7?

**Difficulty:** Medium · **Type:** Comparison · **Concepts:** choosing a layer

Choose L4 or L7: (a) balance MQTT/TCP connections from IoT devices, (b) send requests with header `X-Beta: true` to the new version, (c) terminate TLS and add `X-Forwarded-For`, (d) highest throughput for a custom binary protocol.

<details>
<summary>Answer</summary>

(a) L4, (b) L7, (c) L7, (d) L4.

</details>

### P4. Least connections

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** algorithm choice

Some requests take 50 ms, others 30 s (report generation). With round robin, one instance becomes overloaded. Which algorithm helps and why?

<details>
<summary>Answer</summary>

**Least connections** (or least outstanding requests): the LB sends new work to the instance with the fewest active requests, so instances busy with long reports receive fewer new ones. (Better still: move long reports to async processing.)

</details>

### P5. Health check design

**Difficulty:** Hard · **Type:** Scenario · **Concepts:** health checks

The ALB health check calls `/actuator/health`, which includes a check of an optional recommendation service. When that service goes down, every instance is marked unhealthy and the whole API returns 503. What went wrong?

<details>
<summary>Answer</summary>

The health check made a **non-critical dependency** part of every instance's health, so one downstream failure removed all instances — a cascading outage. Use a readiness probe that checks only what the instance needs to serve (e.g. its own state and essential DB connectivity), and degrade gracefully when optional services fail.

</details>

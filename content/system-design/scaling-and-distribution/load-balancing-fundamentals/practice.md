# Load Balancing Fundamentals — Practice

### P1. What DNS returns

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** load balancer placement

With a load balancer in front of 10 servers, what IP does DNS return for `api.example.com`?

- A) The IP of a random server
- B) All 10 server IPs
- C) The load balancer's IP
- D) The database's IP

<details>
<summary>Answer</summary>

**Answer:** C) The load balancer's IP

</details>

### P2. Detection time

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** health check timing

Interval 10 s, timeout 3 s, unhealthy threshold 3. A server dies just after passing a check. Roughly how long until the balancer stops routing to it?

<details>
<summary>Answer</summary>

Three failed checks are needed: at about 10 s, 20 s and 30 s, each failing after the 3 s timeout → about **33 seconds**. Passive checks on real traffic would usually remove it sooner.

</details>

### P3. L4 or L7

**Difficulty:** Medium · **Type:** Comparison · **Concepts:** L4 vs L7

Choose L4 or L7: (a) route `/images/*` to a separate pool, (b) balance PostgreSQL read replicas, (c) send requests with header `X-Beta: 1` to a canary pool, (d) balance a custom binary protocol over TCP.

<details>
<summary>Answer</summary>

(a) L7, (b) L4, (c) L7, (d) L4.

</details>

### P4. Deploy without errors

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** draining

During each deployment, users see a burst of 502 errors when old servers are stopped. What is missing?

<details>
<summary>Answer</summary>

Connection draining and graceful shutdown: the server should first fail its readiness check so the balancer stops sending new requests, wait for in-flight requests to finish (within a draining timeout), and only then stop the process.

</details>

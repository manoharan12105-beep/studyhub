# Service Discovery — Practice

### P1. Why not hard-code?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** dynamic instances

Why do microservices on an autoscaling platform need service discovery?

- A) DNS is too slow to use at all
- B) Instance addresses change as instances are added, replaced and removed
- C) HTTP cannot address servers by IP
- D) Load balancers cannot be used with microservices

<details>
<summary>Answer</summary>

**Answer:** B) Instance addresses change as instances are added, replaced and removed

</details>

### P2. Pattern match

**Difficulty:** Medium · **Type:** Comparison · **Concepts:** discovery patterns

A gRPC client fetches the list of `inventory` instances and round-robins between them itself. Which pattern is this, and what is one drawback?

<details>
<summary>Answer</summary>

Client-side discovery. Drawback: every client (in every language) must implement registry lookup, caching and load balancing correctly, and changing the strategy means updating all clients.

</details>

### P3. Detection window

**Difficulty:** Medium · **Type:** Failure · **Concepts:** heartbeats

Instances send heartbeats every 10 s; the registry removes an instance after 3 missed heartbeats, and clients refresh their cached list every 30 s. What is the worst-case time a crashed instance can still receive requests, and how do callers stay correct during it?

<details>
<summary>Answer</summary>

Up to about 30 s (detection) + 30 s (client cache refresh) ≈ **60 s**. Callers stay correct with timeouts and retries to another instance, and passive health checks that stop using an instance after a few errors.

</details>

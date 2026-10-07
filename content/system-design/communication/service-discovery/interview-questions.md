# Service Discovery — Interview Questions

## Beginner

### Q1. What is service discovery and why do microservices need it?

**Style:** Direct

<details>
<summary>Answer</summary>

A mechanism that lets a service find the current addresses of healthy instances of another service by name. Microservices need it because instances are created and destroyed dynamically by autoscaling, deployments and failures, so fixed addresses become wrong quickly.

</details>

## Intermediate

### Q2. Compare client-side and server-side discovery.

**Style:** Comparison

<details>
<summary>Answer</summary>

Client-side: the caller queries the registry, caches the instance list and load-balances itself — no extra network hop and smarter balancing, but every client needs discovery logic. Server-side: the caller sends to a stable address (a load balancer or platform proxy) that looks up instances — simple, language-agnostic callers, at the cost of an extra hop and a component that must be highly available.

</details>

### Q3. How does a registry learn that an instance is dead?

**Style:** How

<details>
<summary>Answer</summary>

Through heartbeats the instance sends (missing several in a row marks it dead) or active health checks the registry or platform performs; graceful shutdowns deregister explicitly. Passive checks — callers reporting failures — can remove bad instances faster.

</details>

## Advanced

### Q4. The service registry becomes unavailable for two minutes. What should happen?

**Style:** What happens if

<details>
<summary>Answer</summary>

Callers should keep using their last cached instance lists, so existing traffic continues; only changes during the outage (new or removed instances) are missed, which timeouts and retries can tolerate. This is why registries are replicated using consensus, and why clients must not fail closed when the registry is unreachable.

</details>

### Q5. What does a service mesh add beyond basic discovery?

**Style:** Direct

<details>
<summary>Answer</summary>

Sidecar proxies beside each instance that handle load balancing, retries, timeouts and circuit breaking, mutual TLS between services, traffic shifting for canary releases, and uniform metrics and tracing — all configured centrally rather than coded into each service. The cost is extra latency per hop and operational complexity.

</details>

# Load Balancing Fundamentals — Interview Questions

## Beginner

### Q1. What does a load balancer do?

**Style:** Direct

<details>
<summary>Answer</summary>

It receives client traffic on a single address and distributes connections or requests across a pool of backend servers, sending traffic only to servers that pass health checks. This enables horizontal scaling, high availability, autoscaling and zero-downtime deployments, and often terminates TLS.

</details>

### Q2. What are the two main jobs of a load balancer?

**Style:** Direct

<details>
<summary>Answer</summary>

Choosing a server for each request or connection (using an algorithm such as round robin or least connections) and continuously checking server health so failed servers stop receiving traffic.

</details>

### Q3. Is a load balancer special hardware?

**Style:** Trap

<details>
<summary>Answer</summary>

Not usually. Most load balancers are software (Nginx, HAProxy, Envoy) running on ordinary servers, or managed cloud services built the same way. A load balancer is a reverse proxy specialised in distributing traffic. Dedicated hardware appliances exist but are less common today.

</details>

## Intermediate

### Q4. What is the difference between active and passive health checks?

**Style:** Comparison

<details>
<summary>Answer</summary>

Active checks send periodic probe requests (TCP connect or an HTTP health endpoint) and judge the response against thresholds. Passive checks observe real traffic and mark servers that produce connection errors, timeouts or 5xx responses. Active checks detect failures even without traffic; passive checks react faster under load. Many balancers use both.

</details>

### Q5. How do you avoid the load balancer being a single point of failure?

**Style:** How

<details>
<summary>Answer</summary>

Run several balancer instances: managed cloud balancers spread across availability zones, or self-hosted pairs in active-passive mode with a floating virtual IP that moves on failure (VRRP/keepalived), or multiple active nodes reached via DNS or anycast. Monitor the balancers like any other critical component.

</details>

### Q6. What is connection draining?

**Style:** Direct

<details>
<summary>Answer</summary>

When a server is being removed (deployment, scale-in, maintenance), the balancer stops sending it new connections or requests but allows existing ones to complete within a timeout, so users don't see dropped requests. Applications cooperate by failing their readiness check at shutdown while still serving in-flight work.

</details>

## Advanced

### Q7. A dependency outage caused every server to fail health checks and the site went fully down. What was wrong with the health check design?

**Style:** Debugging

<details>
<summary>Answer</summary>

The health check included a dependency that was not essential (or that all servers share), so one external failure made every server look unhealthy and the balancer removed them all. Health checks should test whether the instance itself can serve requests; shared dependency failures should be handled with graceful degradation and alerting, not by pulling all servers. Many balancers also "fail open" when all targets are unhealthy.

</details>

### Q8. When would you choose an L4 load balancer over an L7 one?

**Style:** Trade-off

<details>
<summary>Answer</summary>

For non-HTTP protocols (databases, MQTT, custom TCP, UDP), when maximum throughput and minimal latency matter, when TLS must pass through to backends end-to-end, or when you need to preserve client IPs without proxy headers. Choose L7 when you need path- or host-based routing, header manipulation, per-request balancing, or TLS termination and HTTP-aware features.

</details>

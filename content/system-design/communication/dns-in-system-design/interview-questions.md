# DNS in System Design — Interview Questions

## Beginner

### Q1. What does DNS do, and why is it distributed?

**Style:** Direct

<details>
<summary>Answer</summary>

DNS translates domain names into IP addresses. It is distributed and hierarchical because the namespace is enormous (hundreds of millions of domains), changes constantly, and must have no single point of failure; each organisation manages its own zone, and answers are cached widely.

</details>

### Q2. Walk through a DNS lookup that is not cached anywhere.

**Style:** How

<details>
<summary>Answer</summary>

The client asks its recursive resolver. The resolver asks a root server, which refers it to the TLD servers (for `.com`); the TLD server refers it to the domain's authoritative name servers; the authoritative server returns the address record with a TTL. The resolver caches and returns it, and the client connects to that IP.

</details>

## Intermediate

### Q3. What is a DNS TTL and how do you choose it?

**Style:** Trade-off

<details>
<summary>Answer</summary>

The time to live says how long resolvers and clients may cache a record. Long TTLs reduce lookups and latency but make changes slow to propagate; short TTLs make migrations and failover fast at the cost of more lookups. Use short TTLs (tens of seconds to a few minutes) for records involved in failover, and lower TTLs in advance before planned changes.

</details>

### Q4. How can DNS route users to the nearest region?

**Style:** How

<details>
<summary>Answer</summary>

With geo- or latency-based DNS: the authoritative service looks at the location of the resolver (or the client subnet, when the resolver sends it) and returns the address of the closest or fastest region. Combined with health checks, it also stops returning a failed region.

</details>

### Q5. Why is DNS load balancing coarse compared to a load balancer?

**Style:** Comparison

<details>
<summary>Answer</summary>

DNS answers are cached for the TTL by resolvers and clients, so DNS cannot react to load or failures within seconds and cannot balance individual requests; it also does not know per-server load. A load balancer sees every connection or request, tracks health continuously and shifts traffic immediately.

</details>

## Advanced

### Q6. Your DNS provider has an outage. What happens and how do you protect against it?

**Style:** What happens if

<details>
<summary>Answer</summary>

Clients with cached answers keep working until their TTLs expire; new clients and expired caches cannot resolve the name, so the service looks down although servers are healthy. Protect by using two independent DNS providers serving the same zone (both listed as name servers), keeping reasonable TTLs on stable records, and monitoring resolution from outside.

</details>

### Q7. You switched DNS to a new server, but some users still reach the old one a day later. Why?

**Style:** Debugging

<details>
<summary>Answer</summary>

Caches: the old record's TTL may have been long, some resolvers and clients cache beyond the TTL, and long-lived applications (for example a JVM caching lookups, or pooled connections) may never re-resolve. Keep the old server running (or forwarding) during the transition, lower TTLs before migrations, and make clients re-resolve periodically.

</details>

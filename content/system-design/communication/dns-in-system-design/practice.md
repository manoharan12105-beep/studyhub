# DNS in System Design — Practice

### P1. Lookup order

**Difficulty:** Easy · **Type:** Conceptual · **Concepts:** DNS resolution

Order the servers a recursive resolver contacts on an uncached lookup of `api.example.com`: authoritative server, root server, `.com` TLD server.

<details>
<summary>Answer</summary>

Root server → `.com` TLD server → `example.com` authoritative server.

</details>

### P2. Choosing a TTL

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** TTL

You plan to move `shop.example.com` to a new load balancer next week. What should you do now?

- A) Raise the TTL to one week
- B) Lower the TTL to a few minutes so the switch takes effect quickly
- C) Delete the record until the move
- D) Nothing; DNS changes are instant

<details>
<summary>Answer</summary>

**Answer:** B) Lower the TTL to a few minutes so the switch takes effect quickly

Lower it at least one old-TTL period before the change, then raise it again afterwards.

</details>

### P3. Root servers

**Difficulty:** Medium · **Type:** Conceptual · **Concepts:** DNS hierarchy

True or false, with a correction: "There are only 13 root DNS servers in the world, owned by 13 companies."

<details>
<summary>Answer</summary>

False. There are 13 root server *identities* (A–M) operated by 12 organisations, served by well over a thousand physical instances worldwide using anycast.

</details>

### P4. Failover delay

**Difficulty:** Medium · **Type:** Failure · **Concepts:** DNS failover

DNS-based failover detects a dead region within 30 s and changes the answer, but the record TTL is 600 s. What is the worst-case time before a well-behaved client reaches the healthy region, and how would you reduce it?

<details>
<summary>Answer</summary>

Up to about 30 s + 600 s ≈ **10.5 minutes** (detection plus a cached answer that just refreshed). Reduce the TTL (for example to 60 s), make clients retry and re-resolve on connection failures, or use anycast/global load balancing with a stable IP so failover does not depend on DNS caches.

</details>

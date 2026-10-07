# Stateless vs Stateful Services — Interview Questions

## Beginner

### Q1. What is a stateless service?

**Style:** Direct

<details>
<summary>Answer</summary>

A service whose instances keep no client-specific data between requests. Every request carries what is needed (or a reference such as a token or session ID), and any persistent state lives in external stores like a database, cache or object storage. Any instance can handle any request.

</details>

### Q2. Why are stateless services easier to scale?

**Style:** Why

<details>
<summary>Answer</summary>

Instances are interchangeable: the load balancer can route any request to any instance, new instances can be added or removed at any time (autoscaling, rolling deployments), and an instance crash loses only in-flight requests. Nothing has to be copied or drained when the instance count changes.

</details>

### Q3. After scaling from 2 to 5 servers, users are randomly logged out. What is the cause and the fix?

**Style:** Scenario

<details>
<summary>Answer</summary>

Sessions are stored in each server's memory; when a later request lands on a different server, that server has no session for the user. Fix by moving sessions to a shared store such as Redis (or using signed tokens), making the servers stateless.

</details>

## Intermediate

### Q4. What are sticky sessions and why are they considered a poor fix?

**Style:** Trade-off

<details>
<summary>Answer</summary>

Sticky sessions make the load balancer route a client to the same server each time (via a cookie or IP hash) so in-memory session data is available. They lead to uneven load, users still lose sessions when that server dies or is redeployed, and scaling in becomes awkward because servers hold users. They hide statefulness instead of removing it.

</details>

### Q5. Redis session store vs JWT: what are the trade-offs?

**Style:** Comparison

<details>
<summary>Answer</summary>

A Redis session store keeps session data server-side keyed by a random ID: revocation is instant (delete the key) and tokens are small, but every request needs a lookup and Redis must be highly available. A JWT carries signed claims, so any server verifies it locally without a shared store, but revoking before expiry is hard and tokens are larger; mitigate with short lifetimes, refresh tokens and a deny-list for emergencies.

</details>

### Q6. Does a server that writes to a database count as stateful?

**Style:** Trap

<details>
<summary>Answer</summary>

No. Statefulness refers to data the server instance itself holds between requests. A server that reads and writes an external database and keeps nothing locally is stateless; the state lives in a component built to manage it.

</details>

## Advanced

### Q7. Which components in a system are legitimately stateful, and how do you manage them?

**Style:** Design

<details>
<summary>Answer</summary>

Databases, caches, message brokers, search indexes, and connection-holding services such as WebSocket gateways or game servers. Manage them with replication and automated failover, persistence where needed, and, for connection holders, a registry of which user is connected where plus client reconnect logic, so a node failure only forces reconnections rather than data loss.

</details>

### Q8. An in-memory local cache sits on each stateless server. Is the server still stateless?

**Style:** Follow-up

<details>
<summary>Answer</summary>

In the sense that matters, yes, provided the cache is only an optimisation: losing it costs speed, never correctness, and any server can still serve any request. You must still handle staleness (short TTLs or invalidation messages), because each server's local copy can differ for a while.

</details>

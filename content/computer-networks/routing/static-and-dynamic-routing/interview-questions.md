# Static and Dynamic Routing — Interview Questions

## Beginner

### Q1. What is the difference between static and dynamic routing?

**Style:** Comparison

<details>
<summary>Answer</summary>

Static routes are configured manually; they are simple, predictable and use no protocol overhead, but they do not adapt to failures and do not scale. Dynamic routes are learned through routing protocols (RIP, OSPF, BGP); routers discover networks, choose best paths by metric and reconverge automatically when links fail, at the cost of CPU, bandwidth and complexity.

</details>

### Q2. What are RIP, OSPF and BGP used for?

<details>
<summary>Answer</summary>

RIP: a simple distance-vector protocol for small networks (hop count, max 15). OSPF: a link-state protocol used inside organisations (cost based on bandwidth, fast convergence, areas). BGP: the path-vector protocol used between autonomous systems on the Internet, choosing routes by policy.

</details>

## Intermediate

### Q3. Distance vector vs link state?

**Style:** Comparison

<details>
<summary>Answer</summary>

Distance-vector routers share their routing tables (distances) with neighbours and trust them — Bellman-Ford, simple, low resource use, slow convergence and possible loops (count to infinity); example RIP. Link-state routers flood descriptions of their links so every router builds the complete topology map and computes shortest paths with Dijkstra — faster convergence and no rumour-based loops, but more CPU and memory; example OSPF.

</details>

### Q4. What is an autonomous system, and how does it relate to IGP vs EGP?

<details>
<summary>Answer</summary>

An autonomous system is a network (or group of networks) under one administration with one routing policy, identified by an AS number — an ISP, a cloud provider, a large company. IGPs (RIP, OSPF, IS-IS) route inside an AS; the EGP, BGP, exchanges routes between ASes.

</details>

## Advanced

### Q5. Why is BGP called a path-vector protocol, and why does the Internet need policy-based routing?

**Style:** Why

<details>
<summary>Answer</summary>

Each BGP route carries the full list of ASes it has traversed (AS_PATH); a router rejects routes containing its own AS (loop prevention) and can apply policies based on that path. Between independent companies, the "shortest" path is not the goal — business relationships decide: customers are preferred over peers over paid transit, some networks must never carry certain traffic. BGP's attributes (local preference, AS path, MED, communities) express those policies.

</details>

### Q6. What is "count to infinity" and how is it mitigated?

<details>
<summary>Answer</summary>

In distance-vector routing, after a network fails, two neighbours may keep learning the dead route from each other, each adding one hop, so the metric creeps upward slowly while packets loop. RIP limits it by treating 16 as infinity, and uses split horizon (do not advertise a route back to the neighbour you learned it from), poison reverse (advertise it back as unreachable) and triggered updates.

</details>

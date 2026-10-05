# Static Routing, Dynamic Routing, RIP, OSPF and BGP

**Module:** Routing · **Interview priority:** Frequently asked

> [!NOTE]
> Software and backend interviews expect the **ideas** here — static vs dynamic, distance vector vs link state, IGP vs EGP, what BGP does — not router configuration.

## What Is It?

Routes get into a routing table in three ways:

| Source | How | Example |
|--------|-----|---------|
| **Connected** | Automatically, for networks the router has an interface in | `192.168.1.0/24 dev eth0` |
| **Static** | Typed in by an administrator | `ip route add 10.20.0.0/16 via 192.168.1.254` |
| **Dynamic** | Learned from neighbours through a **routing protocol** | OSPF, RIP, BGP |

## Why It Exists

Static routes are simple but do not react to failures and do not scale to hundreds of routers. Routing protocols let routers **discover** networks, **share** what they know, choose the **best** path by a metric, and **reconverge** automatically when a link fails.

## Static Routing

| Advantages | Disadvantages |
|------------|---------------|
| Simple, predictable, no protocol overhead | Manual: every change on every router |
| Secure — nothing is learned from others | No automatic failover when a link dies |
| Ideal for small or stub networks (one way out) | Does not scale; error-prone |

Typical uses: a default route on a branch router, a home router's route to the ISP, a cloud route table entry pointing to a NAT gateway.

## Dynamic Routing

### Two families of interior protocols

| | Distance vector | Link state |
|---|-----------------|------------|
| Idea | "Routing by rumour": each router tells neighbours its distances to every network | Each router learns the **whole topology map**, then computes paths itself |
| What is shared | Routing table (destination + distance) with neighbours, periodically | Link-state advertisements (my links and their costs), flooded to all routers in the area |
| Algorithm | Bellman-Ford | Dijkstra's shortest path first (SPF) |
| Convergence | Slow; can suffer loops ("count to infinity") | Fast |
| Resource use | Low CPU/memory | More CPU/memory |
| Example | **RIP** | **OSPF**, IS-IS |

### RIP (Routing Information Protocol)

- Distance vector; metric = **hop count**; maximum **15** hops (16 = unreachable).
- Sends its table every 30 seconds (UDP port 520).
- Simple but slow to converge and blind to bandwidth (a 2-hop path over slow links beats a 3-hop path over fast ones). Mostly legacy and teaching use.

### OSPF (Open Shortest Path First)

- Link state; metric = **cost**, by default derived from bandwidth (reference bandwidth ÷ interface bandwidth).
- Routers form **adjacencies** with neighbours (hello packets), flood **LSAs**, build an identical link-state database, and run **Dijkstra** to compute the shortest-path tree.
- Hierarchical **areas** (area 0 is the backbone) limit flooding and allow summarisation.
- Fast convergence; the common choice **inside** enterprise and data-centre networks. Runs directly over IP (protocol 89).

### BGP (Border Gateway Protocol)

- The routing protocol **between** autonomous systems (ISPs, clouds, large companies) — the protocol that holds the Internet together.
- **Path vector:** each route carries the list of ASes it has passed through (**AS_PATH**), which prevents loops and lets networks apply **policy** ("never send traffic through competitor X", "prefer the cheaper transit link").
- Chooses routes by policy attributes (local preference, AS path length, …), not just shortest distance.
- Runs over **TCP port 179** between configured peers.
- The global table holds roughly a million IPv4 prefixes. Misconfigurations (route leaks) have caused major outages of large services.

### IGP vs EGP

| | IGP (Interior Gateway Protocol) | EGP (Exterior Gateway Protocol) |
|---|---------------------------------|---------------------------------|
| Scope | Inside one autonomous system | Between autonomous systems |
| Goal | Fastest/shortest path | Policy and reachability |
| Examples | RIP, OSPF, IS-IS, EIGRP | BGP |

## Comparison

| | RIP | OSPF | BGP |
|---|-----|------|-----|
| Type | Distance vector | Link state | Path vector |
| Used | Inside small networks (legacy) | Inside an organisation | Between organisations (Internet) |
| Metric | Hop count (max 15) | Cost (bandwidth) | Policy attributes, AS path |
| Algorithm | Bellman-Ford | Dijkstra | Best-path selection by attributes |
| Transport | UDP 520 | IP protocol 89 | TCP 179 |
| Convergence | Slow | Fast | Slow-ish, deliberate |

## Real World

- Home: one static default route to the ISP — no protocol needed.
- Enterprise: OSPF inside, BGP (or static) to the ISPs.
- Cloud: you mostly edit static route tables; BGP appears when you connect a data centre via VPN or Direct Connect.
- Data centres and Kubernetes (Calico) increasingly use BGP internally because it scales and supports policy.

## Common Traps

- **"BGP finds the shortest path."** BGP selects by policy first; the shortest AS path is only one criterion.
- **"RIP's metric is speed."** It is hop count only.
- **"Dynamic is always better than static."** Static is preferable for simple stub networks — no overhead, nothing to attack.

## Interview Follow-up

- *"What is count to infinity?"* In distance-vector protocols, after a failure two routers can keep advertising the dead route to each other with increasing hop counts; RIP limits it with a maximum of 16 and techniques like split horizon and poison reverse.
- *"Why does the Internet use BGP and not OSPF?"* OSPF assumes one administration sharing a full map; between independent organisations you need policy control, scale and privacy of internal topology.

## Key Takeaways

- Routes come from connected interfaces, static configuration or dynamic protocols.
- Static: simple, no failover. Dynamic: automatic discovery and failover.
- RIP: distance vector, hop count ≤ 15. OSPF: link state, Dijkstra, cost by bandwidth, areas. BGP: path vector between ASes, policy-driven, TCP 179.
- IGPs (RIP, OSPF) inside an AS; BGP between ASes.

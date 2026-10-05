# Static and Dynamic Routing — Practice

### P1. Protocol between ISPs

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** BGP

Which protocol exchanges routes between autonomous systems on the Internet?

- A) RIP
- B) OSPF
- C) BGP
- D) ARP

<details>
<summary>Answer</summary>

**Answer:** C) BGP

</details>

### P2. Match the protocol

**Difficulty:** Easy · **Type:** Conceptual · **Concepts:** routing protocol properties

Match: (a) hop count, max 15; (b) Dijkstra over a full topology map; (c) AS path and policy; (d) TCP port 179.

<details>
<summary>Answer</summary>

(a) RIP, (b) OSPF, (c) BGP, (d) BGP.

</details>

### P3. Choose static or dynamic

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** static vs dynamic

(a) A branch office with one Internet link. (b) A campus with 40 routers and redundant links. Which routing approach suits each?

<details>
<summary>Answer</summary>

(a) Static default route — one way out, nothing to adapt. (b) Dynamic, typically OSPF — too many routes to maintain by hand, and redundant links need automatic failover.

</details>

### P4. RIP's blind spot

**Difficulty:** Medium · **Type:** Conceptual · **Concepts:** metrics

Path X: 2 hops over 10 Mbit/s links. Path Y: 3 hops over 10 Gbit/s links. Which does RIP choose, which would OSPF prefer, and why?

<details>
<summary>Answer</summary>

RIP chooses **X** (fewer hops; it ignores bandwidth). OSPF prefers **Y**, because its cost is based on bandwidth, so the high-speed links have a much lower total cost.

</details>

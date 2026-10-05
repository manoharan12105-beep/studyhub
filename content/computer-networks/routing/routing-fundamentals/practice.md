# Routing Fundamentals — Practice

### P1. Default route

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** default route

Which entry is the default route?

- A) 255.255.255.255/32
- B) 0.0.0.0/0
- C) 127.0.0.0/8
- D) 192.168.1.0/24

<details>
<summary>Answer</summary>

**Answer:** B) 0.0.0.0/0

</details>

### P2. Read the table

**Difficulty:** Medium · **Type:** Packet flow · **Concepts:** routing table lookup

Router table: `10.0.0.0/8 via 192.168.1.2`, `172.16.0.0/16 via 192.168.1.3`, `0.0.0.0/0 via 203.0.113.1`. Where does it send packets to (a) `10.5.5.5`, (b) `172.16.9.9`, (c) `8.8.8.8`, (d) `172.17.0.1`?

<details>
<summary>Answer</summary>

(a) `192.168.1.2`, (b) `192.168.1.3`, (c) `203.0.113.1` (default), (d) `203.0.113.1` — `172.17.0.1` is not in `172.16.0.0/16`.

</details>

### P3. No route

**Difficulty:** Medium · **Type:** Conceptual · **Concepts:** unmatched destination

A router has no default route and no entry matching `198.51.100.9`. What happens to the packet and what does the sender receive?

<details>
<summary>Answer</summary>

The router drops it and sends an ICMP Destination Unreachable (network unreachable) message back to the source.

</details>

### P4. Order of operations

**Difficulty:** Medium · **Type:** Packet flow · **Concepts:** forwarding process

Order: (a) ARP for the next hop, (b) decrement TTL, (c) longest prefix match lookup, (d) check FCS and destination MAC, (e) send new frame.

<details>
<summary>Answer</summary>

(d) → (b) → (c) → (a) → (e).

</details>

### P5. Asymmetric path

**Difficulty:** Hard · **Type:** Scenario · **Concepts:** hop-by-hop routing

`traceroute` from A to B shows hops R1, R2, R5; from B to A it shows R6, R3, R1. Is something broken?

<details>
<summary>Answer</summary>

Not necessarily. Each router chooses the next hop independently, and each direction is routed on its own, so paths can be asymmetric. It matters mainly for stateful firewalls that must see both directions of a connection.

</details>

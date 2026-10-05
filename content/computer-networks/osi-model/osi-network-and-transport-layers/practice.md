# OSI Layers 3 and 4 — Practice

### P1. Addressing by layer

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** ports

Which identifier selects the application on a host?

- A) MAC address
- B) IP address
- C) Port number
- D) TTL

<details>
<summary>Answer</summary>

**Answer:** C) Port number

</details>

### P2. Who reads what?

**Difficulty:** Medium · **Type:** Packet flow · **Concepts:** hop-by-hop vs end-to-end

A segment from port 52100 to port 443 crosses five routers. How many of those routers use the port numbers to forward it (assuming no NAT or firewall)?

<details>
<summary>Answer</summary>

**None.** Routers forward by destination IP; ports are read only by the destination host's transport layer.

</details>

### P3. Protocol field

**Difficulty:** Medium · **Type:** Conceptual · **Concepts:** IP protocol field

An IP packet's Protocol field is 17. Which protocol is inside, and does it provide reliability?

<details>
<summary>Answer</summary>

UDP. It provides ports and a checksum but no reliability, ordering or connection.

</details>

### P4. Which layer's job?

**Difficulty:** Medium · **Type:** Conceptual · **Concepts:** layer 3 vs 4 functions

Assign to Layer 3 or 4: (a) a packet loops between two routers and is eventually dropped, (b) data arrives out of order and is reordered, (c) the receiver advertises it can accept only 8 KB more, (d) a router splits a large IPv4 packet.

<details>
<summary>Answer</summary>

(a) Layer 3 (TTL), (b) Layer 4 (TCP sequence numbers), (c) Layer 4 (TCP flow control), (d) Layer 3 (fragmentation).

</details>

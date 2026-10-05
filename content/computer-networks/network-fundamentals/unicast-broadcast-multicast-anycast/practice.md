# Unicast, Broadcast, Multicast and Anycast — Practice

### P1. Classify the address

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** IPv4 multicast range

Which address is a multicast address?

- A) 192.168.1.255
- B) 239.10.20.30
- C) 10.0.0.1
- D) 255.255.255.255

<details>
<summary>Answer</summary>

**Answer:** B) 239.10.20.30

**Explanation:** IPv4 multicast is `224.0.0.0`–`239.255.255.255`. A is the broadcast address of `192.168.1.0/24`, C is a private unicast address, D is the limited broadcast address.

</details>

### P2. Which mode?

**Difficulty:** Easy · **Type:** Conceptual · **Concepts:** delivery modes

Classify: (a) a browser loading a page, (b) an ARP request, (c) OSPF hello messages to `224.0.0.5`, (d) a query to `8.8.8.8` answered by the nearest Google site.

<details>
<summary>Answer</summary>

(a) unicast, (b) broadcast, (c) multicast, (d) anycast.

</details>

### P3. Does it cross the router?

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** broadcast domains

PC1 (`192.168.1.10/24`) sends a broadcast to `192.168.1.255`. The router also has an interface in `192.168.2.0/24`. Does PC2 at `192.168.2.20` receive it?

<details>
<summary>Answer</summary>

No. Routers do not forward broadcasts; the broadcast stays in the `192.168.1.0/24` broadcast domain.

</details>

### P4. Server load

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** unicast vs multicast

A 5 Mbit/s live stream is watched by 2,000 viewers on an ISP network. How much does the source send with unicast, and with multicast?

<details>
<summary>Answer</summary>

Unicast: 2,000 × 5 Mbit/s = **10 Gbit/s** (one copy per viewer). Multicast: **5 Mbit/s** — one stream; routers duplicate it only where branches lead to viewers.

</details>

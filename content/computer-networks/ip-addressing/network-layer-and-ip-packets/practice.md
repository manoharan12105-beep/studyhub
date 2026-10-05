# The Network Layer and IP Packets — Practice

### P1. Protocol field

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** IP header

An IPv4 packet has Protocol = 6. What does it carry?

- A) ICMP
- B) TCP
- C) UDP
- D) ARP

<details>
<summary>Answer</summary>

**Answer:** B) TCP

**Explanation:** 1 = ICMP, 6 = TCP, 17 = UDP. ARP is not carried in IP at all.

</details>

### P2. Count the hops

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** TTL

A Linux server replies to your ping with `ttl=57`. Linux starts at 64. How many routers did the reply cross?

<details>
<summary>Answer</summary>

64 − 57 = **7** routers.

</details>

### P3. Packet size

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** header sizes

`ping` reports `56(84) bytes`. Explain the 84.

<details>
<summary>Answer</summary>

56 bytes of ICMP payload + 8 bytes ICMP header + 20 bytes IPv4 header = 84 bytes.

</details>

### P4. What is guaranteed?

**Difficulty:** Medium · **Type:** Conceptual · **Concepts:** best effort

Which of these does IP guarantee: (a) delivery, (b) order, (c) no duplicates, (d) a valid header when accepted?

<details>
<summary>Answer</summary>

Only (d): packets whose header checksum fails are discarded. Delivery, order and uniqueness are not guaranteed.

</details>

### P5. Fragments

**Difficulty:** Hard · **Type:** Scenario · **Concepts:** fragmentation, DF bit

A host sends a 3,000-byte IPv4 packet with DF = 1 to a link with MTU 1,500. What does the router do, and what does a well-behaved sender do next?

<details>
<summary>Answer</summary>

The router drops the packet and sends ICMP "Fragmentation Needed" (Destination Unreachable, code 4) with the next-hop MTU 1,500. The sender lowers its path MTU and resends smaller packets (TCP reduces its segment size). If that ICMP is blocked by a firewall, the transfer stalls — a path-MTU black hole.

</details>

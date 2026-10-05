# Encapsulation and Decapsulation — Practice

### P1. Order of wrapping

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** encapsulation order

At the sender, which order are headers added?

- A) Ethernet → IP → TCP
- B) TCP → IP → Ethernet
- C) IP → TCP → Ethernet
- D) TCP → Ethernet → IP

<details>
<summary>Answer</summary>

**Answer:** B) TCP → IP → Ethernet

**Explanation:** Data goes down the stack: transport first, then network, then data link (which also adds the trailer).

</details>

### P2. Read the frame

**Difficulty:** Medium · **Type:** Packet flow · **Concepts:** headers by layer

A captured frame shows: dst MAC `a4:91:b1:00:00:01`, src MAC `3c:22:fb:9a:10:4e`, IP `192.168.1.10 → 203.0.113.10`, TCP `52100 → 443`. Which header tells a switch where to send it, a router where to send it, and the server which process gets it?

<details>
<summary>Answer</summary>

Switch: the Ethernet destination MAC. Router: the IP destination `203.0.113.10`. Server: the TCP destination port `443`.

</details>

### P3. Header overhead

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** overhead

An application sends 100 bytes over TCP/IPv4 on Ethernet (no TCP options, no TLS). How many bytes are in the Ethernet frame (header + payload + FCS), and what fraction is overhead?

<details>
<summary>Answer</summary>

14 (Ethernet) + 20 (IP) + 20 (TCP) + 100 (data) + 4 (FCS) = **158 bytes**. Overhead = 58 ÷ 158 ≈ **37 %**.

</details>

### P4. After the router

**Difficulty:** Medium · **Type:** Packet flow · **Concepts:** re-encapsulation

A packet arrives at a router with TTL 64. List exactly what is different in the frame that leaves the router (no NAT).

<details>
<summary>Answer</summary>

New source MAC (router's outgoing interface), new destination MAC (next hop), TTL 63, recomputed IPv4 header checksum, new FCS. IPs, ports and data are the same.

</details>

### P5. MSS

**Difficulty:** Hard · **Type:** Calculation · **Concepts:** MTU, MSS

A tunnel adds 60 bytes of extra headers to every packet on a path whose physical MTU is 1,500. What TCP MSS (IPv4, no options) avoids fragmentation?

<details>
<summary>Answer</summary>

Inner MTU = 1,500 − 60 = 1,440. MSS = 1,440 − 20 (IP) − 20 (TCP) = **1,400 bytes**.

</details>

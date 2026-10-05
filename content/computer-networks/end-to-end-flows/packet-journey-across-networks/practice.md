# A Packet's Journey — Practice

### P1. Who decrements TTL?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** TTL

A packet passes two switches and three routers. By how much has its TTL decreased?

- A) 2
- B) 3
- C) 5
- D) 0

<details>
<summary>Answer</summary>

**Answer:** B) 3

**Explanation:** Only routers decrement TTL.

</details>

### P2. Fill the table

**Difficulty:** Medium · **Type:** Packet flow · **Concepts:** headers at each hop

PC `10.0.0.5` (MAC `P`) → router R (LAN MAC `RL`, WAN MAC `RW`, public IP `198.51.100.9`, performs PAT) → ISP router I (MAC `I`) → … → server `203.0.113.80:443`. The PC uses source port 50000; R maps it to 61000. Give src/dst MAC and src/dst IP:port on the PC–R link and on the R–I link.

<details>
<summary>Answer</summary>

PC–R: MAC `P → RL`; IP `10.0.0.5:50000 → 203.0.113.80:443`.
R–I: MAC `RW → I`; IP `198.51.100.9:61000 → 203.0.113.80:443`.

</details>

### P3. Reply translation

**Difficulty:** Medium · **Type:** Packet flow · **Concepts:** NAT reply

Continuing P2, the server's reply reaches R as `203.0.113.80:443 → 198.51.100.9:61000`. What does R send to the PC (IP:ports and destination MAC)?

<details>
<summary>Answer</summary>

`203.0.113.80:443 → 10.0.0.5:50000`, in a frame with destination MAC `P` (source MAC `RL`).

</details>

### P4. Same LAN check

**Difficulty:** Medium · **Type:** Conceptual · **Concepts:** switch behaviour

On the same LAN, does the switch change the source MAC to its own when forwarding? Does it decrement TTL?

<details>
<summary>Answer</summary>

No to both. A Layer 2 switch forwards frames unchanged and does not look at IP headers.

</details>

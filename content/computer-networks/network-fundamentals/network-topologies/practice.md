# Network Topologies — Practice

### P1. Single cable failure

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** bus, star

In which topology can one broken cable segment stop communication for every device?

- A) Star
- B) Bus
- C) Full mesh
- D) Partial mesh

<details>
<summary>Answer</summary>

**Answer:** B) Bus

**Explanation:** All devices share the backbone cable; a break splits it and leaves it unterminated. In a star only the device on that cable is affected.

</details>

### P2. Mesh links

**Difficulty:** Easy · **Type:** Calculation · **Concepts:** full mesh

How many links and how many ports per device does a full mesh of 8 routers need?

<details>
<summary>Answer</summary>

Links = 8 × 7 / 2 = **28**. Each router needs **7** ports.

</details>

### P3. Identify the topology

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** tree, hybrid

A campus has a core switch connected to one distribution switch per building, and each distribution switch connects to switches on each floor, which connect to PCs. Name the topology and the effect of a distribution switch failure.

<details>
<summary>Answer</summary>

Tree (hierarchical star). If a distribution switch fails, every floor switch and host in that building loses connectivity to the rest of the campus; other buildings are unaffected.

</details>

### P4. Physical vs logical

**Difficulty:** Hard · **Type:** Conceptual · **Concepts:** physical vs logical topology

Ten PCs are cabled to a hub. Later the hub is replaced by a switch with the same cables. Did the physical topology change? Did the logical topology change?

<details>
<summary>Answer</summary>

Physical: no — it is still a star. Logical: yes — with the hub, every frame reached every PC (logical bus, one collision domain); with the switch, frames go only to the destination port (dedicated links, one collision domain per port).

</details>

# Collision Domains and Broadcast Domains — Practice

### P1. Which device?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** broadcast domains

Which device, by default, places each of its interfaces in a separate broadcast domain?

- A) Hub
- B) Switch
- C) Router
- D) Repeater

<details>
<summary>Answer</summary>

**Answer:** C) Router

</details>

### P2. Count domains

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** counting

Three 8-port switches are daisy-chained (S1–S2–S3) with one cable between neighbours. Every other port has a PC. No router, no VLANs. How many collision and broadcast domains?

<details>
<summary>Answer</summary>

Links: S1 has 7 PCs + 1 link to S2; S2 has 6 PCs + 2 links; S3 has 7 PCs + 1 link. Distinct links = 7 + 6 + 7 PC links + 2 switch-to-switch links = **22 collision domains**. Broadcast domains: **1**.

</details>

### P3. Back-off

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** binary exponential back-off

After its 3rd consecutive collision, from how many slot times can a CSMA/CD station choose its random wait?

<details>
<summary>Answer</summary>

From 0 to 2³ − 1 = 7, so **8** possible values.

</details>

### P4. Design

**Difficulty:** Hard · **Type:** Scenario · **Concepts:** design for broadcast domains

A flat office network has 1,200 devices in one broadcast domain, and users complain about slowness every morning when everyone logs in. Suggest a design change and explain why it helps.

<details>
<summary>Answer</summary>

Split the network into several VLANs (e.g. per floor or department), each with its own IP subnet of a few hundred hosts, routed by a Layer 3 switch or router. Broadcasts (DHCP, ARP, discovery) then reach only one VLAN, so each host processes far fewer of them, and a fault or loop is contained within one VLAN.

</details>

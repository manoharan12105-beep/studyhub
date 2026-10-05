# VLSM and Supernetting — Practice

### P1. Summarise

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** supernetting

Which single prefix summarises `172.16.8.0/24` through `172.16.15.0/24`?

- A) 172.16.8.0/22
- B) 172.16.8.0/21
- C) 172.16.0.0/20
- D) 172.16.8.0/23

<details>
<summary>Answer</summary>

**Answer:** B) 172.16.8.0/21

**Explanation:** 8 networks (8–15) → 3 bits → 24 − 3 = /21; 8 is a multiple of 8, so the boundary is clean. C would also include 0–7.

</details>

### P2. Size each subnet

**Difficulty:** Easy · **Type:** Calculation · **Concepts:** sizing for VLSM

Give the smallest prefix for each: 200 hosts, 60 hosts, 12 hosts, 2 hosts.

<details>
<summary>Answer</summary>

200 → /24 (254). 60 → /26 (62). 12 → /28 (14). 2 → /30 (2).

</details>

### P3. VLSM plan

**Difficulty:** Hard · **Type:** Calculation · **Concepts:** VLSM allocation

Allocate from `172.16.10.0/23`: 200 hosts, 100 hosts, 60 hosts, 10 hosts and two router links (2 hosts each). Give each subnet and its usable range.

<details>
<summary>Answer</summary>

Largest first:

| Need | Subnet | Usable range |
|------|--------|--------------|
| 200 | 172.16.10.0/24 | 172.16.10.1 – 172.16.10.254 |
| 100 | 172.16.11.0/25 | 172.16.11.1 – 172.16.11.126 |
| 60 | 172.16.11.128/26 | 172.16.11.129 – 172.16.11.190 |
| 10 | 172.16.11.192/28 | 172.16.11.193 – 172.16.11.206 |
| Link 1 | 172.16.11.208/30 | 172.16.11.209 – 172.16.11.210 |
| Link 2 | 172.16.11.212/30 | 172.16.11.213 – 172.16.11.214 |

Free: `172.16.11.216` – `172.16.11.255`.

</details>

### P4. Over-summarisation

**Difficulty:** Hard · **Type:** Scenario · **Concepts:** summary boundaries

A router summarises `10.20.6.0/24` and `10.20.7.0/24` as `10.20.4.0/22`. `10.20.4.0/24` belongs to a different site. What goes wrong, and what should the summary be?

<details>
<summary>Answer</summary>

`10.20.4.0/22` covers 4–7, so traffic for the other site's `10.20.4.0/24` (and `10.20.5.0/24`) could be attracted to this router — unless a more specific /24 route for it exists elsewhere, which would win by longest prefix match. The correct summary for exactly 6–7 is **`10.20.6.0/23`** (6 is even, block 2).

</details>

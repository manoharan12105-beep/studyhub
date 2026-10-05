# Longest Prefix Match — Practice

### P1. Pick the route

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** LPM

Destination `192.168.10.5`. Routes: `192.168.0.0/16 via A`, `192.168.10.0/24 via B`, `0.0.0.0/0 via C`. Which next hop?

- A) A
- B) B
- C) C
- D) Load-balanced across all three

<details>
<summary>Answer</summary>

**Answer:** B) B

**Explanation:** /24 is the longest matching prefix.

</details>

### P2. Several destinations

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** LPM with boundaries

Table: `10.0.0.0/8 via R1`, `10.20.0.0/14 via R2`, `10.22.0.0/16 via R3`, `0.0.0.0/0 via R4`. Next hop for (a) `10.22.1.1`, (b) `10.21.1.1`, (c) `10.24.1.1`, (d) `11.0.0.1`?

<details>
<summary>Answer</summary>

`10.20.0.0/14` covers `10.20`–`10.23` (2nd octet block 4).
(a) matches /8, /14, /16 → **R3**. (b) matches /8, /14 → **R2**. (c) `10.24` is outside /14 → only /8 → **R1**. (d) only default → **R4**.

</details>

### P3. Does it match?

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** prefix matching

Does `172.16.5.9` match `172.16.4.0/23`? Does `172.16.6.9`?

<details>
<summary>Answer</summary>

/23 → 3rd octet block 2: covers `172.16.4.0`–`172.16.5.255`. `172.16.5.9` **matches**; `172.16.6.9` **does not**.

</details>

### P4. Host route

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** /32 routes

During an attack, an admin adds `198.51.100.66/32 via null0` (discard). The router also has a default route and `198.51.100.0/24 via R2`. What happens to traffic for `.66` and for `.67`?

<details>
<summary>Answer</summary>

`.66` matches /32, /24 and /0 → /32 wins → **discarded** (blackholed). `.67` matches /24 and /0 → **via R2** as before.

</details>

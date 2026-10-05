# IPv6 Addressing and IPv4 vs IPv6 — Practice

### P1. Address size

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** IPv6 size

How many bits are in an IPv6 address?

- A) 32
- B) 64
- C) 128
- D) 256

<details>
<summary>Answer</summary>

**Answer:** C) 128

</details>

### P2. Valid or not?

**Difficulty:** Medium · **Type:** Conceptual · **Concepts:** notation rules

Which are valid? (a) `2001:db8::1`, (b) `2001::db8::1`, (c) `fe80::1ff:fe23:4567:890a`, (d) `2001:db8:0:0:0:0:0:0:1`.

<details>
<summary>Answer</summary>

(a) valid; (b) invalid — `::` used twice; (c) valid; (d) invalid — nine groups.

</details>

### P3. Expand

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** expanding ::

Write `fd00:1::abc` in full (8 groups of 4 digits).

<details>
<summary>Answer</summary>

`fd00:1::abc` has 3 explicit groups, so `::` stands for 5 zero groups:
`fd00:0001:0000:0000:0000:0000:0000:0abc`.

</details>

### P4. Identify the type

**Difficulty:** Medium · **Type:** Conceptual · **Concepts:** address types

Classify: `::1`, `fe80::a1b2`, `fd12:3456::7`, `2a00:1450:4001::200e`, `ff02::1`.

<details>
<summary>Answer</summary>

Loopback; link-local; unique local (private); global unicast; multicast (all nodes on the link).

</details>

### P5. Subnets in a /48

**Difficulty:** Hard · **Type:** Calculation · **Concepts:** IPv6 subnetting

A company receives `2001:db8:abcd::/48`. How many /64 subnets can it create, and what is the 3rd one (counting from 0)?

<details>
<summary>Answer</summary>

64 − 48 = 16 subnet bits → 2¹⁶ = **65,536** subnets. Subnet 0 is `2001:db8:abcd:0::/64`, subnet 1 `…:1::/64`, subnet 2 `…:2::/64` — so the 3rd is **`2001:db8:abcd:2::/64`**.

</details>

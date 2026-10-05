# Subnetting Interview Problems — Practice

### P1. Point-to-point link

**Difficulty:** Easy · **Type:** Calculation · **Concepts:** /30

Find the network, broadcast and the two usable addresses of `192.168.4.10/30`.

<details>
<summary>Answer</summary>

Block 4: 10 is in 8–11. Network `192.168.4.8`, broadcast `192.168.4.11`, usable `.9` and `.10`.

</details>

### P2. Host count

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** host formula

How many usable hosts does `255.255.255.224` provide?

- A) 32
- B) 30
- C) 62
- D) 14

<details>
<summary>Answer</summary>

**Answer:** B) 30

**Explanation:** 224 → /27 → 5 host bits → 2⁵ − 2 = 30.

</details>

### P3. A /27 range

**Difficulty:** Easy · **Type:** Calculation · **Concepts:** network, broadcast

Find the network, broadcast and host range of `10.0.5.177/27`.

<details>
<summary>Answer</summary>

Block 32: 177 is in 160–191. Network `10.0.5.160`, broadcast `10.0.5.191`, hosts `.161`–`.190`.

</details>

### P4. Network address trap

**Difficulty:** Medium · **Type:** Conceptual · **Concepts:** valid host

Can `192.168.200.64/26` be assigned to a server?

<details>
<summary>Answer</summary>

No. Block 64: 64 is a multiple of 64, so it is the network address of `192.168.200.64/26` (hosts `.65`–`.126`).

</details>

### P5. Not the broadcast

**Difficulty:** Medium · **Type:** Conceptual · **Concepts:** /22 boundaries

Can `10.9.37.255/22` be assigned to a host?

<details>
<summary>Answer</summary>

**Yes.** /22 → 3rd octet, block 4: 37 is in 36–39. Network `10.9.36.0`, broadcast `10.9.39.255`. `10.9.37.255` is an ordinary host in between.

</details>

### P6. Same subnet?

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** comparing networks

Can `10.1.1.100/25` and `10.1.1.130/25` communicate without a router?

<details>
<summary>Answer</summary>

No. Block 128: `.100` is in `10.1.1.0/25`, `.130` in `10.1.1.128/25` — different subnets.

</details>

### P7. Third-octet /17

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** /17

Find the network, broadcast and usable host count of `172.31.127.130/17`.

<details>
<summary>Answer</summary>

/17 → 3rd octet, mask 128, block 128: 127 is in 0–127. Network `172.31.0.0`, broadcast `172.31.127.255`, usable 2¹⁵ − 2 = **32,766**.

</details>

### P8. Fifty subnets

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** subnets from requirement

Split `172.16.0.0/16` into at least 50 equal subnets with as many hosts as possible. Give the prefix and hosts per subnet.

<details>
<summary>Answer</summary>

2⁶ = 64 ≥ 50 → borrow 6 → **/22**, with 2¹⁰ − 2 = **1,022** hosts each.

</details>

### P9. The tenth subnet

**Difficulty:** Hard · **Type:** Calculation · **Concepts:** k-th subnet

`192.168.2.0/24` is divided into `/28` subnets. Give the 10th subnet (counting from 1), its host range and broadcast.

<details>
<summary>Answer</summary>

Start = (10 − 1) × 16 = 144 → `192.168.2.144/28`, hosts `.145`–`.158`, broadcast `.159`.

</details>

### P10. Check the configuration

**Difficulty:** Hard · **Type:** Troubleshooting · **Concepts:** gateway validity

A host is `10.0.8.200/21` with gateway `10.0.15.254`. A colleague says the gateway is in another subnet "because the third octet is different". Who is right?

<details>
<summary>Answer</summary>

The configuration is **valid**. /21 → block 8 in the 3rd octet: the host's network is `10.0.8.0/21`, covering `10.0.8.0`–`10.0.15.255`. The gateway `10.0.15.254` is the last usable host of that same subnet. A different third octet does not mean a different subnet when the prefix is shorter than /24.

</details>

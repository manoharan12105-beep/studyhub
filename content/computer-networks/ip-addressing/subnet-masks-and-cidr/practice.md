# Subnet Masks and CIDR — Practice

### P1. Prefix to mask

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** mask conversion

What is the dotted-decimal mask for `/28`?

- A) 255.255.255.224
- B) 255.255.255.240
- C) 255.255.255.248
- D) 255.255.240.0

<details>
<summary>Answer</summary>

**Answer:** B) 255.255.255.240

**Explanation:** 28 bits = 24 + 4 → last octet `11110000` = 240.

</details>

### P2. Mask to prefix

**Difficulty:** Easy · **Type:** Calculation · **Concepts:** mask conversion

Convert `255.255.248.0` to a prefix length.

<details>
<summary>Answer</summary>

248 = `11111000` (5 ones). 8 + 8 + 5 = **/21**.

</details>

### P3. AND it

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** network address

Find the network address of `10.1.77.130/22`.

<details>
<summary>Answer</summary>

/22 → mask `255.255.252.0`; the split is in the 3rd octet with block size 4. 77 lies in the block 76–79. Network = **`10.1.76.0`** (broadcast `10.1.79.255`).

</details>

### P4. All four answers

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** network, broadcast, range

For `192.168.5.100/29`, give the network, broadcast, first and last usable host and the host count.

<details>
<summary>Answer</summary>

Block size 8. 100 is in 96–103. Network `192.168.5.96`, broadcast `192.168.5.103`, hosts `.97`–`.102`, **6** usable.

</details>

### P5. Valid gateway

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** gateway within subnet

A host is `172.20.4.70/26`. Which can be its default gateway: `172.20.4.1`, `172.20.4.65`, `172.20.4.127`?

<details>
<summary>Answer</summary>

The host's network is `172.20.4.64/26` (hosts `.65`–`.126`). Only **`172.20.4.65`** works. `.1` is in another subnet; `.127` is the broadcast address.

</details>

### P6. Same network?

**Difficulty:** Hard · **Type:** Calculation · **Concepts:** comparing networks

Are `10.10.10.62/27` and `10.10.10.66/27` on the same network?

<details>
<summary>Answer</summary>

Block size 32: `.62` is in 32–63 (network `10.10.10.32`), `.66` is in 64–95 (network `10.10.10.64`). **No** — they need a router to communicate.

</details>

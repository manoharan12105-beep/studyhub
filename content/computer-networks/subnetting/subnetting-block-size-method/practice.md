# Subnetting by Hand: The Block-Size Method — Practice

### P1. Block size

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** block size

What is the block size for a `/29`?

- A) 4
- B) 8
- C) 16
- D) 32

<details>
<summary>Answer</summary>

**Answer:** B) 8

**Explanation:** /29 → mask 248 in the 4th octet → 256 − 248 = 8.

</details>

### P2. Fourth octet

**Difficulty:** Easy · **Type:** Calculation · **Concepts:** network, broadcast, range

Find the network, broadcast and host range of `172.16.35.45/28`.

<details>
<summary>Answer</summary>

Block 16: 45 is in 32–47. Network `172.16.35.32`, broadcast `172.16.35.47`, hosts `.33`–`.46` (14).

</details>

### P3. Fourth octet again

**Difficulty:** Easy · **Type:** Calculation · **Concepts:** network, broadcast, range

Find the network, broadcast and host range of `192.168.77.77/28`.

<details>
<summary>Answer</summary>

Block 16: 77 is in 64–79. Network `192.168.77.64`, broadcast `192.168.77.79`, hosts `.65`–`.78`.

</details>

### P4. Third octet

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** 3rd-octet subnetting

Find the network, broadcast and usable host count of `172.18.99.99/19`.

<details>
<summary>Answer</summary>

/19 → 3rd octet, mask 224, block 32: 99 is in 96–127. Network `172.18.96.0`, broadcast `172.18.127.255`, hosts `172.18.96.1`–`172.18.127.254`, **8,190** usable.

</details>

### P5. Third octet, /23

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** /23

Find the network and broadcast of `100.64.10.200/23`. Is `100.64.11.0` a valid host in it?

<details>
<summary>Answer</summary>

Block 2 in the 3rd octet: 10 is in 10–11. Network `100.64.10.0`, broadcast `100.64.11.255`. **Yes**, `100.64.11.0` is an ordinary host (it is neither all-zeros nor all-ones in the host bits).

</details>

### P6. Second octet

**Difficulty:** Hard · **Type:** Calculation · **Concepts:** 2nd-octet subnetting

Find the network, broadcast and usable host count of `10.255.0.1/9`.

<details>
<summary>Answer</summary>

/9 → 2nd octet, mask 128, block 128: 255 is in 128–255. Network `10.128.0.0`, broadcast `10.255.255.255`, usable 2²³ − 2 = **8,388,606**.

</details>

### P7. Network, broadcast or host?

**Difficulty:** Hard · **Type:** Conceptual · **Concepts:** identifying special addresses

Classify each as network address, broadcast address or host: (a) `192.168.1.47/28`, (b) `10.4.4.4/30`, (c) `192.168.30.150/25`, (d) `200.10.5.100/30`.

<details>
<summary>Answer</summary>

(a) broadcast (block 16: 32–47), (b) network (block 4: 4–7), (c) host (network `.128`, broadcast `.255`), (d) network (block 4: 100–103).

</details>

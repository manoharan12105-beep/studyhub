# IPv4 Addressing — Practice

### P1. Valid address?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** octet range

Which is a valid IPv4 address?

- A) 192.168.1.256
- B) 10.300.1.1
- C) 172.16.254.1
- D) 192.168.1

<details>
<summary>Answer</summary>

**Answer:** C) 172.16.254.1

**Explanation:** Octets must be 0–255 and there must be four of them.

</details>

### P2. Binary conversion

**Difficulty:** Easy · **Type:** Calculation · **Concepts:** binary

Convert `172.16.10.200` to binary.

<details>
<summary>Answer</summary>

172 = 128+32+8+4 → `10101100`; 16 → `00010000`; 10 = 8+2 → `00001010`; 200 = 128+64+8 → `11001000`.
`10101100.00010000.00001010.11001000`

</details>

### P3. Identify the class

**Difficulty:** Easy · **Type:** Conceptual · **Concepts:** classful addressing

Give the historical class: `10.1.2.3`, `150.10.5.5`, `200.1.1.1`, `230.0.0.1`.

<details>
<summary>Answer</summary>

A, B, C, D (multicast).

</details>

### P4. Network and broadcast

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** network, broadcast, hosts

For `10.20.30.40/16`, give the network address, broadcast address and number of usable hosts.

<details>
<summary>Answer</summary>

Network `10.20.0.0`, broadcast `10.20.255.255`, usable hosts 2¹⁶ − 2 = **65,534**.

</details>

### P5. Size a network

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** host bits

What is the smallest prefix that gives at least 500 usable hosts?

<details>
<summary>Answer</summary>

Need 2ʰ − 2 ≥ 500 → h = 9 (510 hosts). Prefix = 32 − 9 = **/23**.

</details>

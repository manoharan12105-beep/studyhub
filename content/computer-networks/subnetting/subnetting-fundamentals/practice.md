# Subnetting Fundamentals — Practice

### P1. Hosts in a /28

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** host formula

How many usable hosts does a `/28` subnet have?

- A) 16
- B) 14
- C) 30
- D) 12

<details>
<summary>Answer</summary>

**Answer:** B) 14

**Explanation:** 32 − 28 = 4 host bits → 2⁴ − 2 = 14.

</details>

### P2. Subnet count

**Difficulty:** Easy · **Type:** Calculation · **Concepts:** subnet formula

How many `/27` subnets fit in a `/24`?

<details>
<summary>Answer</summary>

Borrowed bits = 27 − 24 = 3 → 2³ = **8**.

</details>

### P3. Prefix for a requirement

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** sizing

What prefix gives at least 60 usable hosts per subnet? How many such subnets fit in `10.1.1.0/24`?

<details>
<summary>Answer</summary>

2⁶ − 2 = 62 ≥ 60 → h = 6 → **/26**; 2² = **4** subnets.

</details>

### P4. Many subnets

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** borrowing for subnets

You must create at least 1,000 subnets from `10.0.0.0/8`. What prefix do you use, and how many hosts does each subnet have?

<details>
<summary>Answer</summary>

2ˢ ≥ 1,000 → s = 10 (1,024 subnets). New prefix = 8 + 10 = **/18**. Host bits = 14 → 2¹⁴ − 2 = **16,382** hosts per subnet.

</details>

### P5. Hosts drive the design

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** sizing from hosts

From `172.16.0.0/16` you need subnets of 500 hosts each. Which prefix, and how many subnets?

<details>
<summary>Answer</summary>

2⁹ − 2 = 510 ≥ 500 → h = 9 → **/23**. Subnets = 2^(23−16) = 2⁷ = **128**.

</details>

### P6. Fifth subnet

**Difficulty:** Hard · **Type:** Calculation · **Concepts:** listing subnets

`192.168.1.0/24` is divided into `/27`s. What is the 5th subnet (the first is number 1), with its host range and broadcast?

<details>
<summary>Answer</summary>

Block size 32: subnets start at 0, 32, 64, 96, **128**. The 5th is `192.168.1.128/27`, hosts `.129`–`.158`, broadcast `.159`.

</details>

# Basic Excel Formulas — Practice

### P1. Simple addition

**Difficulty:** Easy · **Type:** Formula · **Concepts:** addition

A1 = 10 and B1 = 20. What is the result of `=A1+B1`?

- A) 1020
- B) 30
- C) A1+B1
- D) 200

<details>
<summary>Answer</summary>

**Answer:** B) 30

The formula adds the two cell values. `1020` would be joining text, which `+` does not do.

</details>

### P2. Precedence

**Difficulty:** Easy · **Type:** Formula · **Concepts:** operator precedence

What does `=2+3*4` return?

- A) 20
- B) 14
- C) 24
- D) 9

<details>
<summary>Answer</summary>

**Answer:** B) 14

Multiplication first: 3 × 4 = 12; then 2 + 12 = 14. `=(2+3)*4` would give 20.

</details>

### P3. Average of two marks

**Difficulty:** Medium · **Type:** Formula · **Concepts:** parentheses

B2 = 60 (Theory) and C2 = 80 (Practical). A student writes `=B2+C2/2` to get the average and gets 100. Explain the error and write the correct formula.

<details>
<summary>Answer</summary>

Division happens before addition, so Excel calculated `60 + (80 / 2) = 60 + 40 = 100`. The correct formula is `=(B2+C2)/2`, which gives 70. (`=AVERAGE(B2:C2)` also gives 70.)

</details>

### P4. Missing equals sign

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** formula vs value

A user types `B2*C2` (without `=`) into D2. What does D2 show?

- A) The product of B2 and C2
- B) `#VALUE!`
- C) The text `B2*C2`
- D) 0

<details>
<summary>Answer</summary>

**Answer:** C) The text `B2*C2`

Without the leading `=`, Excel treats the entry as text, not a formula.

</details>

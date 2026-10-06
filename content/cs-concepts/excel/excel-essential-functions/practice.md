# Essential Excel Functions — Practice

### P1. Pick the function

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** function selection

You need the highest mark in C2:C9. Which formula do you use?

- A) `=SUM(C2:C9)`
- B) `=MAX(C2:C9)`
- C) `=COUNT(C2:C9)`
- D) `=TOP(C2:C9)`

<details>
<summary>Answer</summary>

**Answer:** B) `=MAX(C2:C9)`

`MAX` returns the largest number. There is no `TOP` function.

</details>

### P2. Counting names

**Difficulty:** Easy · **Type:** Formula · **Concepts:** COUNT vs COUNTA

A2:A9 contains eight employee names. What does `=COUNT(A2:A9)` return?

- A) 8
- B) 0
- C) 9
- D) `#VALUE!`

<details>
<summary>Answer</summary>

**Answer:** B) 0

`COUNT` counts only numbers; names are text. `=COUNTA(A2:A9)` returns 8.

</details>

### P3. Mixed column

**Difficulty:** Medium · **Type:** Formula · **Concepts:** COUNT, COUNTA, AVERAGE

B2:B6 contains `40`, `Absent`, `60`, an empty cell and `0`. Give the results of `=COUNT(B2:B6)`, `=COUNTA(B2:B6)` and `=AVERAGE(B2:B6)`.

<details>
<summary>Answer</summary>

- `COUNT` = 3 (40, 60 and 0 are numbers).
- `COUNTA` = 4 (40, Absent, 60 and 0 are not empty).
- `AVERAGE` = (40 + 60 + 0) ÷ 3 = 33.33… — the zero is included, the text and the empty cell are not.

</details>

### P4. Total of a range

**Difficulty:** Easy · **Type:** Formula · **Concepts:** SUM

A1 = 10, A2 = 20, A3 = 30, A4 = 40. What is `=SUM(A1:A3)`?

- A) 100
- B) 60
- C) 30
- D) 40

<details>
<summary>Answer</summary>

**Answer:** B) 60

`A1:A3` covers A1, A2 and A3 only: 10 + 20 + 30 = 60.

</details>

# Common Excel Errors — Practice

### P1. Divide by zero

**Difficulty:** Easy · **Type:** Error · **Concepts:** #DIV/0!

What does `=10/0` return?

- A) 0
- B) `#VALUE!`
- C) `#DIV/0!`
- D) 10

<details>
<summary>Answer</summary>

**Answer:** C) `#DIV/0!`

Division by zero is undefined, so Excel returns the divide-by-zero error.

</details>

### P2. Misspelled function

**Difficulty:** Easy · **Type:** Error · **Concepts:** #NAME?

Which error does `=AVERGE(C2:C9)` produce?

- A) `#NAME?`
- B) `#REF!`
- C) `#N/A`
- D) `#VALUE!`

<details>
<summary>Answer</summary>

**Answer:** A) `#NAME?`

`AVERGE` is not a function name Excel knows.

</details>

### P3. After deleting a column

**Difficulty:** Medium · **Type:** Error · **Concepts:** #REF!

E2 contains `=C2*D2`. You delete column D. Which error appears in the formula cell?

- A) `#DIV/0!`
- B) `#REF!`
- C) `#NAME?`
- D) No error — the formula adjusts to `=C2*E2`

<details>
<summary>Answer</summary>

**Answer:** B) `#REF!`

The referenced cell no longer exists, so the formula becomes `=C2*#REF!`.

</details>

### P4. Text in a number column

**Difficulty:** Medium · **Type:** Error · **Concepts:** #VALUE!, SUM

A1 = 40, A2 = `Absent` (text), A3 = 60. What do `=A1+A2+A3` and `=SUM(A1:A3)` return?

- A) Both return 100
- B) `#VALUE!` and 100
- C) 100 and `#VALUE!`
- D) Both return `#VALUE!`

<details>
<summary>Answer</summary>

**Answer:** B) `#VALUE!` and 100

The `+` operator cannot add text and returns `#VALUE!`; `SUM` ignores text in a range and adds 40 + 60.

</details>

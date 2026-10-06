# Cell References — Practice

### P1. Copy down a relative reference

**Difficulty:** Easy · **Type:** Reference · **Concepts:** relative reference

C2 contains `=A2*B2`. You copy it to C3. What is the formula in C3?

- A) `=A2*B2`
- B) `=A3*B3`
- C) `=B2*C2`
- D) `=A3*B2`

<details>
<summary>Answer</summary>

**Answer:** B) `=A3*B3`

Both references are relative, so each moves down one row.

</details>

### P2. The fixed rate

**Difficulty:** Easy · **Type:** Reference · **Concepts:** absolute reference

B2 contains `=A2*$B$1`. What happens to `$B$1` when the formula is copied down to B3, B4 and B5?

- A) It becomes `$B$2`, `$B$3`, `$B$4`
- B) It stays `$B$1` in every row
- C) It becomes `B2`, `B3`, `B4`
- D) Excel shows `#REF!`

<details>
<summary>Answer</summary>

**Answer:** B) It stays `$B$1` in every row

Both the column and the row are locked, so the reference never changes. Only `A2` adjusts (to `A3`, `A4`, `A5`).

</details>

### P3. Copy right

**Difficulty:** Medium · **Type:** Reference · **Concepts:** mixed reference

D5 contains `=$B5*C$2`. You copy it to E5 (one column right). What is the formula in E5?

- A) `=$B5*D$2`
- B) `=$C5*D$2`
- C) `=$B5*C$2`
- D) `=$B6*C$3`

<details>
<summary>Answer</summary>

**Answer:** A) `=$B5*D$2`

Copying right changes column letters that are not locked. `$B5` has a locked column, so it stays `$B5`. `C$2` has a free column, so it becomes `D$2`. Rows do not change when copying sideways.

</details>

### P4. Find the bug

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** absolute reference

Commission is 5%, stored in F1. Sales are in B2:B9. A user writes `=B2*F1` in C2 and fills down. C2 is correct but C3:C9 show 0. Why, and what is the fix?

<details>
<summary>Answer</summary>

`F1` is relative, so the copies point at `F2`, `F3`, … which are empty (treated as 0), giving 0 commission. Lock the rate: `=B2*$F$1` in C2, then fill down again.

</details>

# Common Excel Errors — Interview Questions

## Beginner

### Q1. What causes `#DIV/0!`?

<details>
<summary>Answer</summary>

A division whose divisor is zero or an empty cell, such as `=10/0` or `=C2/D2` when D2 is blank. `AVERAGE` of a range with no numbers also returns it. Fix it by entering the divisor or by checking it first: `=IF(D2=0,"",C2/D2)`.

</details>

### Q2. What causes `#REF!`?

<details>
<summary>Answer</summary>

An invalid cell reference — usually because a row, column or sheet that the formula used was deleted. `=B2*C2` becomes `=B2*#REF!` after column C is deleted. Undo the deletion with Ctrl + Z if possible, or rewrite the formula. Clearing contents instead of deleting cells avoids it.

</details>

### Q3. What causes `#VALUE!`?

<details>
<summary>Answer</summary>

A formula received the wrong type of value — most often text where a number is required, as in `=A1*2` when A1 contains `Ten`. Arithmetic operators such as `+` and `*` return `#VALUE!`, while `SUM` simply ignores text in a range. Fix the data so the cells contain real numbers.

</details>

## Intermediate

### Q4. What causes `#N/A`, and how is it different from `#NAME?`?

<details>
<summary>Answer</summary>

`#N/A` means a value was not available — typically a lookup function (`VLOOKUP`, `XLOOKUP`, `MATCH`) could not find what it searched for, because it does not exist or is spelled differently. `#NAME?` means Excel could not understand the formula itself — a misspelled function such as `=SUMM(...)` or text without quotes. One is a data problem; the other is a typing problem in the formula.

</details>

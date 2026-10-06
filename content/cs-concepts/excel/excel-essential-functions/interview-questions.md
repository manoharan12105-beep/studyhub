# Essential Excel Functions — Interview Questions

## Beginner

### Q1. What is the difference between a formula and a function?

<details>
<summary>Answer</summary>

A formula is any calculation that starts with `=`, such as `=A1+B1`. A function is a built-in named calculation, such as `SUM` or `AVERAGE`, that you use inside a formula: `=SUM(A1:A10)`. Every function is used in a formula, but not every formula uses a function.

</details>

### Q2. What do `SUM` and `AVERAGE` do?

<details>
<summary>Answer</summary>

`SUM` adds all the numbers in its arguments: `=SUM(C2:C9)` gives the total marks. `AVERAGE` returns the arithmetic mean — the sum divided by how many numbers there are. Both ignore text and empty cells, but include zeros, so `AVERAGE` of 80, 0 and 70 is 50, while 80, an empty cell and 70 average to 75.

</details>

### Q3. What is the difference between `COUNT` and `COUNTA`?

<details>
<summary>Answer</summary>

`COUNT` counts cells that contain numbers (including dates). `COUNTA` counts all non-empty cells — numbers, text, dates and errors. In a score column containing `82`, `AB`, `38` and one empty cell, `COUNT` returns 2 and `COUNTA` returns 3. To count names, use `COUNTA`; `COUNT` would return 0.

</details>

## Intermediate

### Q4. How would you find the highest, lowest and average salary in a list?

<details>
<summary>Answer</summary>

With salaries in D2:D9: `=MAX(D2:D9)` for the highest, `=MIN(D2:D9)` for the lowest and `=AVERAGE(D2:D9)` for the average. For the Employees dataset these give 72000, 38000 and 52250. A quick check without formulas: select the range and read Average, Count and Sum in the status bar.

</details>

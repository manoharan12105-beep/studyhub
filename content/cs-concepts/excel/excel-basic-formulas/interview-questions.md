# Basic Excel Formulas — Interview Questions

## Beginner

### Q1. What does `=A1+B1` do?

<details>
<summary>Answer</summary>

It adds the value in cell A1 to the value in cell B1 and shows the sum in the cell that contains the formula. Because it refers to the cells, not fixed numbers, the result updates automatically when A1 or B1 changes. With A1 = 10 and B1 = 20 it shows 30.

</details>

### Q2. What is the difference between a formula and a value?

<details>
<summary>Answer</summary>

A value is a constant typed into a cell (`30`, `Asha`). A formula starts with `=` and calculates its result from other cells or numbers (`=A1+B1`). The cell displays the formula's result, the formula bar shows the formula itself, and the result recalculates when the referenced cells change; a typed value never changes on its own.

</details>

## Intermediate

### Q3. In what order does Excel calculate `=10+20/2`, and how would you change the result to 15?

<details>
<summary>Answer</summary>

Excel follows operator precedence: parentheses, then power (`^`), then multiplication and division, then addition and subtraction. So `20/2 = 10` is calculated first and the result is `10 + 10 = 20`. To add first, use parentheses: `=(10+20)/2` gives 15.

</details>

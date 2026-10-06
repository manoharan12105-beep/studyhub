# Cell References — Interview Questions

## Beginner

### Q1. What is a cell reference?

<details>
<summary>Answer</summary>

A cell reference is a cell's address used in a formula, such as `B2` in `=B2*0.18`. It tells Excel to use whatever value is in that cell, so the formula updates when the value changes. References can be relative (`B2`), absolute (`$B$2`) or mixed (`$B2`, `B$2`), which decides how they change when the formula is copied.

</details>

### Q2. What is the difference between a relative and an absolute reference?

<details>
<summary>Answer</summary>

A relative reference (`A1`) adjusts when the formula is copied: copied one row down, `A1` becomes `A2`. An absolute reference (`$A$1`) stays exactly the same wherever the formula is copied. Relative references suit row-by-row calculations; absolute references suit a single fixed input such as a tax rate.

</details>

### Q3. What do `$A$1`, `A$1` and `$A1` mean?

<details>
<summary>Answer</summary>

- `$A$1` — absolute: both column A and row 1 are locked.
- `A$1` — mixed: the row is locked; the column can change when copied across.
- `$A1` — mixed: the column is locked; the row can change when copied down.

The `$` locks the part that directly follows it.

</details>

## Intermediate

### Q4. Why would you use an absolute reference? Give an example.

<details>
<summary>Answer</summary>

When many formulas must use one fixed cell. Prices are in A2:A5 and the tax rate (18%) is in B1. The tax formula `=A2*$B$1` in B2 can be filled down: the price reference moves to each row, while `$B$1` keeps pointing at the rate. With `=A2*B1`, the copied formula in B3 would become `=A3*B2` and multiply by the wrong cell.

</details>

### Q5. When do you need a mixed reference?

<details>
<summary>Answer</summary>

When one formula is copied both down and across and must keep one dimension fixed in each direction. In a grid with prices down column A and discount rates across row 1, `=$A2*B$1` locks the column of the price and the row of the rate, so one formula filled over the whole grid gives every price × rate combination. Pressing F4 while editing cycles through the reference types.

</details>

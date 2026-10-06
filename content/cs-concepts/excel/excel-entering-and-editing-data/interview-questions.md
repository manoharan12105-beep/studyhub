# Entering and Editing Data — Interview Questions

## Beginner

### Q1. What is the difference between pressing Delete and using Home → Delete on a cell?

<details>
<summary>Answer</summary>

The Delete key removes only the cell's contents; the cell, its formatting and the layout stay. Home → Delete (or right-click → Delete) removes the cells, rows or columns themselves, and the neighbouring cells shift up or left to fill the gap. Clear (Home → Clear) sits in between: it can remove contents, formats, or both without moving anything.

</details>

### Q2. What is the fill handle and how does AutoFill behave?

<details>
<summary>Answer</summary>

The fill handle is the small square at the bottom-right of the selection. Dragging it (AutoFill) copies a single number, continues a pattern from two numbers (`1, 2` → `3, 4, 5`), continues built-in lists such as months and weekdays, increments dates and "Item 1"-style text, and copies formulas while adjusting their relative references. Double-clicking it fills down to the end of the adjacent data.

</details>

## Intermediate

### Q3. Why might a column of numbers not add up correctly in `SUM`, and how can you spot it?

<details>
<summary>Answer</summary>

Some of the "numbers" are stored as text — typically from imports, copied web data, or values typed with an apostrophe. `SUM` ignores text in a range, so the total is too small. Signs: the values sit on the left of the cell, a green triangle warning appears in the corner, or `COUNT` returns fewer than expected. Fix by converting them to numbers (the warning's **Convert to Number** option, or retyping).

</details>

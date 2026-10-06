# Excel Fundamentals — Interview Questions

## Beginner

### Q1. What is the difference between a workbook and a worksheet?

<details>
<summary>Answer</summary>

A workbook is the Excel file itself (for example `Report.xlsx`). A worksheet is one grid of rows and columns inside the workbook, shown as a tab at the bottom. One workbook can contain many worksheets — for example `Students`, `Employees` and `Sales` in the same file.

</details>

### Q2. What is a cell, and what is a cell address?

<details>
<summary>Answer</summary>

A cell is the box where a column and a row meet; it holds one value or one formula. Its address is the column letter followed by the row number — `B5` is column B, row 5. Formulas use these addresses to refer to values.

</details>

### Q3. What is a range? Give an example.

<details>
<summary>Answer</summary>

A range is a rectangular block of cells written as `first-cell:last-cell`. `B2:B10` is nine cells in column B; `A1:C10` is 30 cells covering columns A–C and rows 1–10. Functions such as `=SUM(B2:B10)` work on ranges.

</details>

### Q4. What are the Name Box and the formula bar used for?

<details>
<summary>Answer</summary>

The Name Box shows the address of the active cell, and you can type an address into it to jump there. The formula bar shows the actual content of the active cell — if the cell shows `9000` but contains `=B2*0.18`, the formula bar shows the formula. It is where you check or edit formulas.

</details>

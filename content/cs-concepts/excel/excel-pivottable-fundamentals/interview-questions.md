# PivotTable Fundamentals — Interview Questions

## Beginner

### Q1. What is a PivotTable and why would you use one?

<details>
<summary>Answer</summary>

A PivotTable is an Excel report that summarises a list by grouping and calculating — for example, total sales by region or the number of employees per department — without writing formulas. You use it because it is fast, accurate and flexible: dragging a different field into Rows or Columns re-summarises the same data in seconds, and the source data is never changed.

</details>

### Q2. What do the Rows and Columns areas do?

<details>
<summary>Answer</summary>

Both turn the unique values of a field into labels. A field in **Rows** lists its values down the left side (Product → Laptop, Mobile); a field in **Columns** spreads its values across the top as headings (Region → North, South). Together they form a grid, and each cell holds the calculated value for that row–column combination.

</details>

### Q3. What does the Values area do?

<details>
<summary>Answer</summary>

It holds the field that is calculated for each combination of row and column labels. A numeric field is summarised with Sum by default (Sum of Sales); a text field is summarised with Count. The calculation can be changed to Average, Max, Min and others through Value Field Settings.

</details>

### Q4. What does the Filters area do?

<details>
<summary>Answer</summary>

It adds a drop-down above the PivotTable that restricts which source records the whole report uses. With Month in Filters set to Mar, every total in the PivotTable is calculated from March rows only. It differs from Rows and Columns because it does not add labels to the layout — it only narrows the data.

</details>

## Intermediate

### Q5. How is a PivotTable different from a normal table or an Excel Table?

<details>
<summary>Answer</summary>

A normal range or an Excel Table holds the raw records — one row per sale. A PivotTable is a summary report built from such data: it groups the records and shows totals, counts or averages, and can be rearranged by dragging fields. You edit data in the source table; you never type into a PivotTable. The best practice is to keep the raw data in an Excel Table and build the PivotTable from it.

</details>

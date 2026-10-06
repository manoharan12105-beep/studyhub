# PivotTable Calculations and Filtering — Interview Questions

## Beginner

### Q1. How do you summarise total sales by region?

<details>
<summary>Answer</summary>

Click in the sales data → Insert → PivotTable → New Worksheet. Drag **Region** to Rows and **Sales** to Values; Excel shows Sum of Sales for each region with a Grand Total. For the sample data this gives North 227000 and South 268000. Adding Product to Columns would split each region by product.

</details>

### Q2. How do you count employees by department in a PivotTable?

<details>
<summary>Answer</summary>

Put **Department** in Rows and a field that is filled for every employee — Name or Emp ID — in Values. Because it is a text field, Excel summarises it with Count, giving the number of employees per department (HR 2, IT 3, Sales 3 in the sample). If a numeric field is used, change its calculation to Count in Value Field Settings.

</details>

## Intermediate

### Q3. How do you calculate average salary by department?

<details>
<summary>Answer</summary>

Put **Department** in Rows and **Salary** in Values. It starts as Sum of Salary; open Value Field Settings (or right-click → Summarize Values By) and choose **Average**. The sample gives HR 41500, IT 65000 and Sales 46666.67. Set a Number Format in the same dialog to control decimals.

</details>

### Q4. What does Refresh do, and when is it not enough?

<details>
<summary>Answer</summary>

Refresh (right-click → Refresh, or Alt + F5) re-reads the source data so the PivotTable reflects edits — PivotTables do not update automatically. It reads the same source range as before, so rows added below a fixed range are not included; you then need Change Data Source. Building the PivotTable from an Excel Table avoids this, because the Table range grows with new rows.

</details>

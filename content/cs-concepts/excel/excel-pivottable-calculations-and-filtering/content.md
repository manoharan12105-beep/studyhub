# PivotTable Calculations and Filtering

**Module:** PivotTables · **Test priority:** Core

## What Is It?

Once fields are placed, a PivotTable can calculate more than sums, show only the items you care about, order them, and stay up to date with its source. This lesson covers the practical controls used in tests and daily reports. Examples use the Sales and Employees sheets from [Excel Fundamentals](../excel-fundamentals/content.md#practice-datasets).

## Sum, Count and Average in Values

The Values area summarises with **Sum** by default for numbers and **Count** for text. To change it: click the field in the Values area → **Value Field Settings** → **Summarize value field by** → Sum, Count, Average, Max, Min… (or right-click any value → **Summarize Values By**).

| Question | Rows | Values | Result |
|---|---|---|---|
| Total sales by product | Product | Sum of Sales | Laptop 293000, Mobile 202000 |
| Total sales by region | Region | Sum of Sales | North 227000, South 268000 |
| Number of employees by department | Department | Count of Name | HR 2, IT 3, Sales 3 (total 8) |
| Average salary by department | Department | Average of Salary | HR 41500, IT 65000, Sales 46666.67 |

To count employees, put any field that has a value in every row — Name or Emp ID — into Values; because it is text, Excel counts it.

The average for Sales is 140000 ÷ 3 = 46666.666…; use **Number Format** in Value Field Settings to show it as 46,667 or 46,666.67.

> [!WARNING]
> If a number column contains even one blank or text cell, Excel may summarise it with **Count** instead of Sum. When a total looks too small (like 12 instead of 495000), check the calculation in Value Field Settings.

**Quick check:** Department is in Rows and Salary is in Values, showing Sum of Salary. How do you show the average salary instead?

<details>
<summary>Answer</summary>

Click Sum of Salary in the Values area (or right-click a value) → Value Field Settings → choose **Average** → OK. The label changes to Average of Salary.

</details>

## Row Labels, Column Labels and Grand Total

In the default (compact) layout the PivotTable has:

- **Row Labels** — the heading over the items from the Rows area, with a drop-down for sorting and filtering.
- **Column Labels** — the same for the Columns area.
- **Grand Total** — a final row (and a final column when Columns is used) adding everything.

**Design → Grand Totals** turns the totals on or off for rows, columns, or both.

## Subtotals

With **two fields in Rows**, the outer field gets a **subtotal** for each of its items. Rows: Region, then Product:

| Row Labels | Sum of Sales |
|---|---|
| **North** | **227000** |
| Laptop | 136000 |
| Mobile | 91000 |
| **South** | **268000** |
| Laptop | 157000 |
| Mobile | 111000 |
| **Grand Total** | **495000** |

North's subtotal (227000) = 136000 + 91000. **Design → Subtotals** shows them at the top or bottom of each group, or hides them. The order of fields in Rows matters: Product first, then Region, gives subtotals per product instead.

## Sorting PivotTable Results

Right-click any value → **Sort → Sort Largest to Smallest** (or Smallest to Largest), or use the Row Labels drop-down → **More Sort Options**. Sorting count of employees by department, largest first, puts IT and Sales (3 each) above HR (2).

## Filtering PivotTable Results

| Method | How | Example |
|---|---|---|
| **Tick boxes** | Row Labels or Column Labels drop-down → untick items | Hide Mobile |
| **Label Filters** | Drop-down → Label Filters → Equals, Begins With, Contains… | Departments beginning with "S" |
| **Value Filters** | Drop-down → Value Filters → Greater Than, Top 10… | Regions with Sum of Sales > 250000 → South only |
| **Filters area** | Drag a field to Filters, choose items in its drop-down above the PivotTable | Month = Mar |

A funnel icon on a drop-down shows that a filter is active. Clear it from the same drop-down (**Clear Filter From…**).

## Refreshing a PivotTable

A PivotTable does **not** update automatically when the source data changes. After editing the data:

- right-click inside the PivotTable → **Refresh**, or
- **PivotTable Analyze → Refresh** (**Alt + F5**); **Refresh All** (**Ctrl + Alt + F5**) refreshes every PivotTable in the workbook.

Example: change Laptop–South–Jan from 50000 to 60000. The PivotTable still shows Laptop–South 157000 until you refresh; then it shows 167000.

> [!IMPORTANT]
> Refresh re-reads the **existing** source range. If new rows were added below a plain range, use **Change Data Source** — or build the PivotTable from an Excel Table, whose range grows automatically.

## Grouping (Awareness)

Right-click an item → **Group** combines items into larger groups:

- **Dates** group into Months, Quarters or Years — recent Excel versions group a date field automatically when it is added.
- **Numbers** group into ranges, e.g. salaries in bands of 10000 (30000–39999, 40000–49999, …).

**Ungroup** reverses it. Grouping needs real dates or numbers; text months such as `Jan` cannot be grouped by date.

## Show Values As (Awareness)

Value Field Settings → **Show Values As** displays each value relative to a total instead of as a raw number:

| Option | Meaning | Sales by product |
|---|---|---|
| No Calculation | Raw values (default) | Laptop 293000, Mobile 202000 |
| **% of Grand Total** | Each value ÷ grand total | Laptop 59.19%, Mobile 40.81% |
| % of Column Total / % of Row Total | Share within each column or row | Region shares inside each product |

## Common Mistakes

- Forgetting to Refresh after changing the data.
- Adding rows below a plain range and expecting Refresh to include them.
- Count appearing instead of Sum because the number column has blanks or text.
- Confusing "Count of Salary" (how many salaries) with the total salary.
- Reading a subtotal as an extra item.

## Key Takeaways

- Value Field Settings changes the calculation: Sum, Count, Average, Max, Min.
- Count employees with a text field (Name) in Values; average salary with Salary set to Average.
- Two fields in Rows produce subtotals; Design controls subtotals and Grand Totals.
- Sort with right-click → Sort; filter with the label drop-downs, Value Filters, or the Filters area.
- Refresh (**Alt + F5**) after the source changes.

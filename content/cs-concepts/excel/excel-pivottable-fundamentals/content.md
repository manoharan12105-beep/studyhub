# PivotTable Fundamentals

**Module:** PivotTables · **Test priority:** Core

## What Is It?

A **PivotTable** summarises a long list into a compact table of totals — without writing a single formula. You choose which column becomes the rows, which becomes the columns and which numbers to add up, and Excel groups and totals everything.

```text
Raw data (one row per sale)
        ↓  Insert → PivotTable, drag fields
PivotTable
        ↓
Summary (totals by product, by region, …)
```

The PivotTable is a separate report: it reads the source data but never changes it.

## Why and When to Use One

Use a PivotTable whenever the question is "**total / count / average of something, by something**":

- Total sales by region.
- Number of employees by department.
- Average marks by department.
- Sales by product and month.

Doing this with `SUM` formulas means writing one formula per combination; a PivotTable builds all of them in seconds, and you can rearrange it by dragging.

## From Raw Data to Summary

Four sales records (the January rows of the Sales sheet):

| Product | Region | Sales |
|---|---|---|
| Laptop | South | 50000 |
| Mobile | North | 30000 |
| Laptop | North | 45000 |
| Mobile | South | 35000 |

PivotTable with **Product** in Rows, **Region** in Columns and **Sales** in Values:

| Sum of Sales | North | South | Grand Total |
|---|---|---|---|
| **Laptop** | 45000 | 50000 | 95000 |
| **Mobile** | 30000 | 35000 | 65000 |
| **Grand Total** | 75000 | 85000 | 160000 |

Every product appears once as a row, every region once as a column, and each cell is the sum of the matching records: Laptop + North = 45000. The Grand Totals add across and down.

## Preparing Clean Source Data

A PivotTable is only as good as its source. Before creating one, check:

- **One header row**, with a name in every column (Product, Region, Month, Sales).
- **One record per row**, with no blank rows or columns inside the list.
- **One kind of data per column** — the Sales column only numbers, not "N/A" or "50k".
- **No merged cells** and **no subtotal or total rows** inside the data.
- **Consistent spellings** — `North` and `north ` (trailing space) would become two different rows. (See [Find, Replace and Basic Data Cleanup](../excel-find-replace-and-cleanup/content.md).)

> [!TIP]
> Convert the list to an [Excel Table](../excel-tables/content.md) (Ctrl + T) first. New rows added later are then included when you refresh the PivotTable.

## Creating a PivotTable

1. Click any cell in the data (the Sales sheet, A1:D13).
2. **Insert → PivotTable** (in Microsoft 365: **From Table/Range**).
3. Confirm the range and choose **New Worksheet** → OK.
4. An empty PivotTable appears on a new sheet, with the **PivotTable Fields** pane on the right.
5. Drag fields from the field list into the four areas.

If the PivotTable Fields pane disappears, click inside the PivotTable — it only shows when a PivotTable cell is selected.

## PivotTable Fields: Rows, Columns, Values, Filters

The top of the pane lists every column header of the source as a **field**. The bottom has four **areas**:

```text
┌─────────────────────┬─────────────────────┐
│ Filters             │ Columns             │
│   Month             │   Region            │
├─────────────────────┼─────────────────────┤
│ Rows                │ Values              │
│   Product           │   Sum of Sales      │
└─────────────────────┴─────────────────────┘
```

| Area | What it does | Sales example |
|---|---|---|
| **Rows** | Each unique value becomes a **row label** down the left side | Product → Laptop, Mobile |
| **Columns** | Each unique value becomes a **column heading** across the top | Region → North, South |
| **Values** | The numbers to calculate for every row/column combination (Sum by default for numbers) | Sum of Sales |
| **Filters** | A drop-down above the PivotTable that limits which records the whole report uses | Month → show only Mar |

Using all 12 rows of the Sales sheet:

| Sum of Sales | North | South | Grand Total |
|---|---|---|---|
| **Laptop** | 136000 | 157000 | 293000 |
| **Mobile** | 91000 | 111000 | 202000 |
| **Grand Total** | 227000 | 268000 | 495000 |

Now put **Month** in Filters and choose **Mar**:

| Sum of Sales (Month = Mar) | North | South | Grand Total |
|---|---|---|---|
| **Laptop** | 44000 | 55000 | 99000 |
| **Mobile** | 33000 | 40000 | 73000 |
| **Grand Total** | 77000 | 95000 | 172000 |

Simpler layouts answer simpler questions:

| Question | Rows | Columns | Values | Result |
|---|---|---|---|---|
| Total sales by region? | Region | — | Sum of Sales | North 227000, South 268000 |
| Total sales by product? | Product | — | Sum of Sales | Laptop 293000, Mobile 202000 |
| Sales by month? | Month | — | Sum of Sales | Jan 160000, Feb 163000, Mar 172000 |

> [!TIP]
> Ticking a field's checkbox places it automatically: text fields go to Rows, number fields go to Values. Dragging gives full control.

**Quick check:** Which areas would you use to show each region as a row and each month as a column, with total sales in the cells?

<details>
<summary>Answer</summary>

Region → Rows, Month → Columns, Sales → Values (Sum of Sales). Filters stays empty, so all records are included.

</details>

## Common Mistakes

- Messy source data: blank headers, text in number columns, inconsistent spellings.
- Putting the number field (Sales) in Rows — every distinct sales amount becomes its own row instead of being added up.
- Expecting the PivotTable to update the moment the source changes — it needs **Refresh** ([next lesson](../excel-pivottable-calculations-and-filtering/content.md)).
- Typing over cells inside a PivotTable to "fix" a total. Fix the source data and refresh.

## Key Takeaways

- A PivotTable turns raw rows into a summary of totals, counts or averages — no formulas needed.
- Rows = labels down the side; Columns = headings across the top; Values = the numbers calculated; Filters = limit the whole report.
- Clean source data: one header row, no blanks, one data type per column, consistent spellings.
- Insert → PivotTable → New Worksheet → drag fields.

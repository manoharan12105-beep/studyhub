# Sort and Filter

**Module:** Data Handling · **Test priority:** Core

## What Is It?

**Sort** and **Filter** are the two everyday tools for finding things in a list.

| | Sort | Filter |
|---|---|---|
| What it does | **Changes the order** of the rows | **Hides the rows** that do not match a condition |
| Rows removed? | No — all rows stay visible, rearranged | No — non-matching rows are hidden, not deleted |
| Example question | "Who scored highest?" | "Show only the North region." |
| Where | Data → Sort & Filter | Data → Filter (**Ctrl + Shift + L**) |

Both work on a **list**: a block of data with one header row and one record per row, without blank rows or columns in the middle. Examples use the Sales sheet (A1:D13 — Product, Region, Month, Sales).

## Sorting

Click any one cell in the column you want to sort by, then:

- **Data → Sort A to Z** (ascending): A → Z, smallest → largest, oldest → newest.
- **Data → Sort Z to A** (descending): Z → A, largest → smallest, newest → oldest.

Excel detects the whole list and keeps each row together.

| Column type | Ascending | Descending |
|---|---|---|
| Text | Arun, Asha, Divya, … | Vijay, Ravi, Priya, … |
| Numbers | 28000, 30000, 33000, … | 55000, 52000, 50000, … |
| Dates | Oldest first | Newest first |

Sales sorted by Sales, largest to smallest (first four rows):

| Product | Region | Month | Sales |
|---|---|---|---|
| Laptop | South | Mar | 55000 |
| Laptop | South | Feb | 52000 |
| Laptop | South | Jan | 50000 |
| Laptop | North | Feb | 47000 |

### Sorting by Two Columns

**Data → Sort** opens the Sort dialog. Add a level for each column, in priority order. Example: sort by **Region** (A to Z), then by **Sales** (Largest to Smallest).

```text
Sort by   Region   A to Z
Then by   Sales    Largest to Smallest
```

Result: all North rows first (47000, 45000, 44000, 33000, 30000, 28000), then all South rows (55000, 52000, 50000, 40000, 36000, 35000). The second level only decides the order *within* each region.

> [!NOTE]
> Keep **My data has headers** ticked in the Sort dialog, so the heading row stays at the top instead of being sorted with the data.

### Sorting Dates

Sort a date column with the same buttons; Excel shows **Sort Oldest to Newest**. This works only for real dates. In the Sales sheet, Month holds the *text* `Jan`, `Feb`, `Mar`, so Sort A to Z gives Feb, Jan, Mar — alphabetical, not calendar order. (The Sort dialog's **Order → Custom List** can sort month names in calendar order.)

An Expenses list with real dates:

| Date | Item | Amount |
|---|---|---|
| 05-Jan-2025 | Travel | 1200 |
| 18-Feb-2025 | Books | 650 |
| 02-Jan-2025 | Food | 300 |
| 27-Mar-2025 | Internet | 799 |
| 14-Feb-2025 | Food | 450 |

Sort Oldest to Newest → 02-Jan, 05-Jan, 14-Feb, 18-Feb, 27-Mar.

## Filtering

Click a cell in the list and press **Ctrl + Shift + L** (or Data → Filter). A drop-down arrow appears on every header. Open an arrow and choose what to show:

| Filter type | Appears for | Example on the Sales sheet | Rows shown |
|---|---|---|---|
| **By value** (tick boxes) | Any column | Region: tick only North | 6 |
| **Text Filters** | Text columns: Equals, Begins With, Contains… | Product → Begins With `L` | 6 (Laptop) |
| **Number Filters** | Number columns: Greater Than, Between, Top 10… | Sales → Greater Than 40000 | 6 |
| **Date Filters** | Date columns: Before, After, Between, This Month… | Expenses Date → Between 01-Feb-2025 and 28-Feb-2025 | 2 |

Filters on different columns combine with AND: Region = South **and** Sales > 40000 shows only the three Laptop–South rows (50000, 52000, 55000); Mobile–South in March (exactly 40000) is not greater than 40000.

How to tell a filter is on: the header arrow changes to a **funnel** icon, and the row numbers of the matching rows turn **blue**, with gaps where rows are hidden (for Region = North: 3, 4, 7, 8, 11, 12).

To remove: open the column's arrow → **Clear Filter From "Region"**, or Data → **Clear** for all columns. Ctrl + Shift + L turns the filter arrows off completely.

**Quick check:** You filter Region = North. How many rows does the Sales sheet still contain?

<details>
<summary>Answer</summary>

All 12. Six are visible and six are hidden. Filtering never deletes data; clearing the filter shows every row again.

</details>

## Common Mistakes

- **Sorting one column only.** If you select only the Sales column and sort, Excel shows a **Sort Warning**. Choosing *Continue with the current selection* reorders the Sales numbers but not the Product, Region and Month cells beside them — every row now has the wrong sales figure. Always choose **Expand the selection**, or click a single cell before sorting.
- **Blank rows or columns in the list.** Excel treats the blank as the end of the list and sorts or filters only part of it.
- **Numbers stored as text** sort as text: `100` comes before `25`.
- **Forgetting a filter is on.** Hidden rows are easy to miss. `SUM` on a filtered column still adds the hidden rows too.
- Expecting text months to sort by calendar order.

## Key Takeaways

- Sort = reorder rows; Filter = hide non-matching rows. Neither deletes data.
- Sort ascending/descending from Data; multi-column sort with Data → Sort → Add Level.
- Filter with **Ctrl + Shift + L**; use Text, Number or Date Filters for conditions.
- Keep rows together: never sort a single selected column alone.

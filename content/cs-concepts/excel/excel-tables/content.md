# Excel Tables

**Module:** Data Handling · **Test priority:** Frequently tested

## What Is It?

An **Excel Table** is a list that Excel manages as one object. You turn an ordinary range into a Table with **Ctrl + T**, and it gains a style, filter buttons, automatic expansion when you add rows, and an optional total row.

"Table" here means this specific feature (Insert → Table), not just any data laid out in rows and columns.

## Creating a Table

1. Click any cell in the list — for example the Sales sheet, A1:D13.
2. Press **Ctrl + T** (or Insert → Table).
3. Check the range (`$A$1:$D$13`) and keep **My table has headers** ticked.
4. Click OK.

The **Table Design** tab appears whenever a cell in the Table is selected. Use it to:

- rename the Table (**Table Name**, e.g. `SalesData` instead of `Table1`),
- choose a **Table Style** (colours and banded rows),
- turn the **Header Row**, **Total Row** and **Banded Rows** on or off,
- **Convert to Range** to turn it back into a normal range.

> [!NOTE]
> Before creating a Table, make sure the list has one header row, no blank rows or columns, and no merged cells — the same rules as for sorting and filtering.

## What a Table Does Automatically

| Feature | What happens |
|---|---|
| **Header row** | Every header gets a filter/sort arrow at once — no need for Ctrl + Shift + L. When you scroll down, the headers replace the column letters A, B, C. |
| **Sorting and filtering** | Built in through the header arrows, exactly as in [Sort and Filter](../excel-sort-and-filter/content.md). |
| **Formatting** | Banded rows make long lists easier to read; the style extends to new rows. |
| **Expansion** | Type in the row directly below the Table (or the column directly to its right) and the Table grows to include it. |
| **Formulas fill down** | A formula typed in one cell of a new column fills the whole column automatically (a *calculated column*). |
| **Total Row** | Table Design → Total Row adds a last row; each cell has a drop-down: Sum, Average, Count, Max, Min… |

Example: with the Sales Table, type `Mobile | North | Apr | 31000` in row 14. The Table now covers A1:D14 and the new row takes the Table's formatting.

The Total Row respects filters: with Region filtered to North, the Sales total shows 227000 (only the visible rows), while a plain `=SUM(D2:D13)` elsewhere still shows 495000.

> [!NOTE]
> If you click cells while writing a formula inside a Table, Excel writes names instead of addresses, such as `=[@Sales]*0.18` ("the Sales value in this row"). It works the same as `=D2*0.18`. These *structured references* are beyond this module — recognise them, do not worry about them.

## Normal Range vs Excel Table

| | Normal range | Excel Table |
|---|---|---|
| Filter buttons | Add with Ctrl + Shift + L | Automatic |
| Formatting | Manual; new rows are unformatted | Style applied; new rows match |
| New rows | Not included in existing ranges, charts or PivotTables | Included automatically |
| Formulas in a column | Fill down yourself | Fill the whole column automatically |
| Totals | Write `SUM` yourself | Total Row with a drop-down |
| Name | Only addresses (`A1:D13`) | A name (`SalesData`) |

## Why Tables Are Useful

- **Growing data:** monthly sales, new employees and daily expenses keep adding rows. A chart or PivotTable built on a Table includes the new rows (a PivotTable after **Refresh**), so nothing is left out.
- **Fewer formula mistakes:** calculated columns keep one formula for the whole column.
- **Readable reports** with one shortcut.

**Quick check:** A PivotTable is built from the range A1:D13. You add sales for April in rows 14–17 and click Refresh, but April does not appear. Why, and what prevents this?

<details>
<summary>Answer</summary>

The PivotTable's source is fixed to A1:D13, so rows 14–17 are outside it. Change the data source to include them — or, better, convert the list to a Table (Ctrl + T) before building the PivotTable. A Table's range grows automatically, so Refresh picks up new rows.

</details>

## Common Mistakes

- Leaving a blank row between the Table and new data — the Table does not expand across it.
- Creating a Table with **My table has headers** unticked when the first row is a header, so Excel adds `Column1`, `Column2` headers and treats your headings as data.
- Expecting the Total Row to include filtered-out rows — it adds only visible rows.

## Key Takeaways

- **Ctrl + T** turns a list into an Excel Table.
- Tables give automatic filters, banded formatting, auto-expansion, calculated columns and a Total Row.
- Use Tables as the source for charts and PivotTables so new rows are included.
- Table Design tab: name, style, Total Row, Convert to Range.

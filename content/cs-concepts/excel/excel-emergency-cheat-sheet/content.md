# Excel Emergency Cheat Sheet

**Module:** Shortcuts and Revision · **Test priority:** Core

## How to Use This Sheet

Read top to bottom in 10–15 minutes before an Excel test or interview. Every line links back to a lesson in this module if something is unclear. Example values come from the module's [practice datasets](../excel-fundamentals/content.md#practice-datasets).

## Terminology

| Term | Meaning | Example |
|---|---|---|
| Workbook | The Excel file | `Sales.xlsx` |
| Worksheet | One tab (grid) in the workbook | `Students` |
| Cell | One box: column letter + row number | `B5` |
| Range | A block of cells, `first:last` | `A1:C10` (30 cells) |
| Active cell | The selected cell, shown in the Name Box | `C2` |
| Formula bar | Shows the cell's real content (the formula) | `=B2*0.18` |
| Ribbon | Menu tabs: Home, Insert, Data, View… | Data → Sort |

## Formulas and Functions

- A formula starts with `=`. Operators: `+ - * / ^`.
- Order: `( )` → `^` → `* /` → `+ -`. `=2+3*4` = 14; `=(2+3)*4` = 20.
- Function syntax: `=NAME(range)`; a function is a built-in formula.

| Function | Does | Marks 82, 45, 38, 67, 91, 55, 74, 29 (C2:C9) |
|---|---|---|
| `SUM` | Total | `=SUM(C2:C9)` → 481 |
| `AVERAGE` | Mean | → 60.125 |
| `MIN` / `MAX` | Smallest / largest | → 29 / 91 |
| `COUNT` | Cells with **numbers** | → 8 |
| `COUNTA` | **Non-empty** cells | `=COUNTA(A2:A9)` → 8 names |

Text and blanks are ignored by `SUM`/`AVERAGE`/`COUNT`; `COUNTA` counts text. A zero is a value; a blank is not.

## IF, AND, OR

```text
=IF(condition, value_if_true, value_if_false)
=IF(C2>=50, "Pass", "Fail")
=IF(AND(B2>=50, C2>=50), "Pass", "Fail")    both must be true
=IF(OR(B2>=50, C2>=50), "Pass", "Fail")     at least one true
```

Text in double quotes; numbers without. `>=` includes the boundary, `>` does not.

## Cell References

| Reference | Type | Copied down | Copied right |
|---|---|---|---|
| `A1` | Relative | `A2` | `B1` |
| `$A$1` | Absolute | `$A$1` | `$A$1` |
| `$A1` | Mixed — column locked | `$A2` | `$A1` |
| `A$1` | Mixed — row locked | `A$1` | `B$1` |

Tax on prices with one rate in B1: `=A2*$B$1`, filled down. **F4** cycles the `$` while editing.

## Data Tools

| Tool | Remember |
|---|---|
| **Sort** | Changes row order. Data → Sort A→Z / Z→A; Sort dialog → Add Level for two columns. Never sort one selected column alone. |
| **Filter** | Hides non-matching rows (Ctrl + Shift + L). Text, Number and Date Filters. Nothing is deleted. |
| **Excel Table** | Ctrl + T. Auto filters, banded style, grows with new rows, formulas fill the column, Total Row. |
| **Conditional Formatting** | Formats by value, updates itself. Highlight Cells Rules (Greater Than, Less Than, Duplicate Values), Top/Bottom, Color Scales, Data Bars. |
| **Formatting** | Changes display, not value: 0.18 shows as 18%. Ctrl + 1 = Format Cells. |
| **Find / Replace** | Ctrl + F / Ctrl + H. Tick Match entire cell contents before Replace All. |
| **Remove Duplicates** | Data → Remove Duplicates. Keeps the first, deletes the rest — choose columns carefully. |
| **Text to Columns** | Splits one column at a delimiter (space, comma). Overwrites columns to the right. |
| **Freeze Panes** | View → Freeze Panes. Select B2 to keep row 1 and column A visible. |

## Charts

| Need | Chart |
|---|---|
| Compare categories | Column (vertical bars) |
| Many categories or long names | Bar (horizontal bars) |
| Trend over time | Line |
| Share of one whole, few parts | Pie |

Select labels + numbers with headers, then Insert → Charts or **Alt + F1**. Leave total rows out of the selection.

## PivotTables and PivotCharts

```text
Raw data → PivotTable (summary) → PivotChart (picture of the summary)
```

| Area | Does | Sales example |
|---|---|---|
| Rows | Unique values down the side | Product |
| Columns | Unique values across the top | Region |
| Values | Numbers calculated (Sum by default) | Sum of Sales |
| Filters | Limits the whole report | Month = Mar |

| Sum of Sales | North | South | Grand Total |
|---|---|---|---|
| Laptop | 136000 | 157000 | 293000 |
| Mobile | 91000 | 111000 | 202000 |
| Grand Total | 227000 | 268000 | 495000 |

- Create: Insert → PivotTable → New Worksheet → drag fields.
- Change Sum to Count/Average: Value Field Settings.
- Count employees by department: Department in Rows, Name in Values (Count). Average salary: Salary in Values → Average.
- Two fields in Rows → subtotals. Design → Grand Totals / Subtotals.
- Source changed? **Refresh** (right-click → Refresh, Alt + F5). Use an Excel Table as the source so new rows are included.
- PivotChart: PivotTable Analyze → PivotChart. Filtering the chart filters the PivotTable too.

## Errors

| Error | Cause | Example |
|---|---|---|
| `#DIV/0!` | Divide by 0 or an empty cell | `=10/0` |
| `#VALUE!` | Text where a number is needed | `=A1*2` with A1 = `Ten` |
| `#REF!` | Referenced cell was deleted | `=B2*#REF!` |
| `#NAME?` | Misspelled function or text without quotes | `=SUMM(C2:C9)` |
| `#N/A` | Lookup value not found | `VLOOKUP` of a missing ID |
| `#####` | Not an error — column too narrow | Widen the column |

## Shortcuts

| Shortcut | Action | Shortcut | Action |
|---|---|---|---|
| Ctrl + C / X / V | Copy / Cut / Paste | Ctrl + A | Select data block |
| Ctrl + Z / Y | Undo / Redo | Ctrl + Arrow | Jump to data edge |
| Ctrl + S / P | Save / Print | Ctrl + Shift + Arrow | Select to data edge |
| Ctrl + F / H | Find / Replace | F2 | Edit cell |
| Ctrl + T | Create Table | Alt + = | AutoSum |
| Ctrl + Shift + L | Filter on/off | F4 | Toggle `$` |

## Last-Minute Traps

- `=B2+C2/2` is not the average — use `=(B2+C2)/2`.
- `COUNT` on names returns 0 — use `COUNTA`.
- "Less Than 40" does not include 40.
- Copying `=A2*B1` down breaks the rate — lock it: `$B$1`.
- Sorting one column alone separates rows.
- A PivotTable shows old numbers until refreshed.
- Formatting hides decimals; it does not round the stored value.

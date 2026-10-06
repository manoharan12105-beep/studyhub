# Excel Quick Revision

Decision tables and quick drills for the last 15 minutes: which tool, which function, which chart, which PivotTable area — and what a formula returns.

## Which Feature for Which Task

| Task | Use |
|---|---|
| Put the highest marks at the top | Sort, Largest to Smallest |
| Show only one region's rows | Filter (Ctrl + Shift + L) |
| Turn failing marks red automatically | Conditional Formatting → Less Than |
| Find repeated IDs (without deleting) | Conditional Formatting → Duplicate Values |
| Delete repeated rows | Data → Remove Duplicates |
| Change a spelling everywhere | Replace (Ctrl + H) |
| Split "First Last" into two columns | Text to Columns |
| Keep headings visible while scrolling | Freeze Panes |
| Make a list grow, style and filter itself | Excel Table (Ctrl + T) |
| Total / count / average by category | PivotTable |
| A chart that follows a PivotTable | PivotChart |
| Freeze calculated results as numbers | Paste Special → Values |

## Which Function

| Question | Function |
|---|---|
| Total of the column | `SUM` |
| Mean value | `AVERAGE` |
| Lowest / highest | `MIN` / `MAX` |
| How many cells have numbers | `COUNT` |
| How many cells are filled (names, text) | `COUNTA` |
| Show one of two results by a condition | `IF` |
| Condition needs all parts true | `AND` inside `IF` |
| Condition needs any part true | `OR` inside `IF` |

## Which Chart

| Data | Chart |
|---|---|
| Monthly sales trend | Line |
| Laptop vs Mobile totals | Column |
| 12 departments with long names | Bar |
| Each product's share of the total | Pie |

## Which Reference

| Situation | Reference |
|---|---|
| Each row uses its own price | Relative `A2` |
| Every row uses the one tax rate in B1 | Absolute `$B$1` |
| Grid: price column fixed, rows change | `$A2` |
| Grid: rate row fixed, columns change | `B$1` |

## PivotTable Field Placement

| Question | Rows | Columns | Values | Filters |
|---|---|---|---|---|
| Total sales by region | Region | — | Sum of Sales | — |
| Sales by product and region | Product | Region | Sum of Sales | — |
| Employees per department | Department | — | Count of Name | — |
| Average salary per department | Department | — | Average of Salary | — |
| Product sales for March only | Product | — | Sum of Sales | Month = Mar |

## Predict the Result

A1 = 10, B1 = 20, C1 = 0, and B2:B6 = 82, `AB`, 38, *(empty)*, 91.

| Formula | Result |
|---|---|
| `=A1+B1` | 30 |
| `=A1+B1*2` | 50 |
| `=(A1+B1)*2` | 60 |
| `=SUM(A1:B1)` | 30 |
| `=AVERAGE(A1:C1)` | 10 (the 0 counts) |
| `=COUNT(B2:B6)` | 3 |
| `=COUNTA(B2:B6)` | 4 |
| `=IF(A1>=10,"Yes","No")` | Yes |
| `=IF(AND(A1>5,B1>25),"Yes","No")` | No |
| `=IF(OR(A1>5,B1>25),"Yes","No")` | Yes |
| `=B1/C1` | `#DIV/0!` |

## Error Diagnosis

| You see | Check |
|---|---|
| `#DIV/0!` | Is the divisor 0 or empty? |
| `#VALUE!` | Is there text in a cell used with `+ - * /`? |
| `#REF!` | Was a row, column or sheet deleted? (Ctrl + Z) |
| `#NAME?` | Function spelling? Double quotes around text? |
| `#N/A` | Does the looked-up value exist, spelled exactly the same? |
| `#####` | Widen the column — not an error |

## Traps

- Greater Than / Less Than are strict — the boundary is not included.
- `COUNT` ignores text; `COUNTA` counts it.
- Formatting does not change values; Decrease Decimal does not round.
- Filter hides, it does not delete; `SUM` still includes hidden rows.
- Remove Duplicates on the wrong column deletes valid rows.
- PivotTables need Refresh; a plain range does not grow with new rows.
- Filtering a PivotChart filters its PivotTable too.

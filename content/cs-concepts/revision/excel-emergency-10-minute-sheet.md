# Excel Emergency 10-Minute Sheet

Only the highest-value facts. Read once, top to bottom.

## Excel Basics

```text
Workbook   → the file (Sales.xlsx)
Worksheet  → one tab inside it
Cell       → column letter + row number: B5
Range      → first:last — A1:C10 = 30 cells
```

## Formulas

```text
=          → every formula starts with it
+ - * /    → add, subtract, multiply, divide  (^ = power)
( )        → calculated first:  =2+3*4 → 14    =(2+3)*4 → 20
```

## Functions

```text
SUM       → total                     =SUM(B2:B10)
AVERAGE   → mean                      =AVERAGE(B2:B10)
MIN / MAX → smallest / largest        =MAX(B2:B10)
COUNT     → cells with NUMBERS        =COUNT(B2:B10)
COUNTA    → NON-EMPTY cells           =COUNTA(A2:A10)
IF        → =IF(B2>=50,"Pass","Fail")
AND       → all true:   =IF(AND(B2>=50,C2>=50),"Pass","Fail")
OR        → any true:   =IF(OR(B2>=50,C2>=50),"Pass","Fail")
```

## References

```text
A1     → relative: changes when copied
$A$1   → absolute: never changes      =A2*$B$1 (one tax rate)
$A1    → column locked
A$1    → row locked
F4     → cycles through them
```

## Data

```text
Sort                   → changes row order
Filter                 → hides rows (Ctrl+Shift+L), deletes nothing
Table                  → Ctrl+T: filters, style, grows with new rows
Conditional Formatting → colours cells by value, updates itself
```

## Charts

```text
Column → compare categories
Bar    → compare, long names / many items
Line   → trend over time
Pie    → share of one whole
```

## PivotTable

```text
Rows        → labels down the side
Columns     → labels across the top
Values      → numbers calculated (Sum / Count / Average)
Filters     → limits the whole report
Grand Total → overall totals row/column
Refresh     → needed after data changes (Alt+F5)
```

## PivotChart

```text
PivotChart → visualisation of a PivotTable summary; filters both together
```

## Errors

```text
#DIV/0! → divided by 0 or empty cell
#VALUE! → text where a number is needed
#REF!   → referenced cell deleted
#NAME?  → misspelled function / missing quotes
#N/A    → value not found (lookup)
```

## Shortcuts

```text
Ctrl+C → copy        Ctrl+V → paste      Ctrl+Z → undo
Ctrl+F → find        Ctrl+H → replace
F2     → edit cell   Alt+=  → AutoSum
```

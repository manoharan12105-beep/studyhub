# Excel Complete Revision

Module-by-module revision of Excel Fundamentals: what to remember, why it matters, and the mistake to avoid. About 30 minutes. Values refer to the Students, Employees and Sales practice datasets.

## Excel Basics

- **Workbook** = the file; **worksheet** = one tab inside it. One workbook, many sheets.
- **Cell** = column letter + row number (`B5`, never `5B`). **Range** = `first:last` (`A1:C10` = 3 columns × 10 rows = 30 cells).
- **Name Box** shows the active cell's address; **formula bar** shows what the cell really contains.
- **Text** aligns left, **numbers and dates** align right. Dates are stored as day numbers, so they can be subtracted.
- Leading zeros vanish from numbers (`007` → 7): type `'007` or format as Text for IDs and phone numbers.
- **Delete key** clears contents only; **Clear** chooses contents/formats/all; the **Delete command** removes cells and shifts the rest.
- **Copy** keeps the original, **Cut** moves it; **Paste Special → Values** pastes results without formulas.
- **Fill handle:** one number copies; two numbers continue the step; months, weekdays and dates continue the series; formulas adjust their references.

> [!WARNING]
> Typing into a selected cell replaces everything in it. Press F2 to edit part of it.

## Formulas and Functions

- Formulas start with `=`; they show a result and recalculate when referenced cells change.
- Operators `+ - * / ^`; precedence: parentheses → power → multiply/divide → add/subtract, left to right within a level. `=10+20/2` = 20.
- A **function** is a named built-in calculation used inside a formula: `=SUM(C2:C9)`.
- `SUM` 481, `AVERAGE` 60.125, `MIN` 29, `MAX` 91, `COUNT` 8 on the Students marks.
- `COUNT` = cells with numbers; `COUNTA` = non-empty cells. Names → `COUNTA`.
- `SUM`, `AVERAGE` and `COUNT` ignore text and blanks; a 0 is included. Blank ≠ zero.
- `IF(condition, true, false)`; comparisons `= <> > < >= <=`; text in double quotes.
- `AND` = all true; `OR` = at least one true; both sit inside the IF condition.
- One nested IF chooses among three results — test the highest threshold first.

> [!WARNING]
> `=B2+C2/2` divides only C2. The average of two cells is `=(B2+C2)/2` or `=AVERAGE(B2:C2)`.

## Cell References

- Relative `A1` adjusts when copied; absolute `$A$1` never changes; mixed `$A1` locks the column, `A$1` locks the row.
- A single shared input (tax rate, commission %) needs an absolute reference: `=A2*$B$1`.
- Without `$`, copied formulas point at the wrong cells — empty cells give 0, other formula cells give huge numbers.
- Mixed references fill a grid with one formula: `=$A2*B$1` (prices down, rates across).
- References change only when copying or filling; Cut and Paste keeps them.
- **F4** cycles `A1 → $A$1 → A$1 → $A1` while editing.

## Data Handling

- **Formatting** changes display, not the stored value: 0.18 shows as 18%; 1.4 with 0 decimals shows 1, but sums as 1.4.
- Percentage multiplies the display by 100 — format 18 as % and it shows 1800%.
- Avoid merged cells inside lists; they block sorting.
- **Sort** reorders rows; **Filter** hides non-matching rows. Neither deletes data.
- Multi-level sort: Data → Sort → Add Level (Region, then Sales).
- Text months sort alphabetically (Feb, Jan, Mar); real dates sort chronologically.
- Filters on several columns combine with AND. `SUM` still adds hidden rows; a Table's Total Row adds only visible ones.
- **Excel Table** (Ctrl + T): automatic filters, banded style, expands with new rows, calculated columns, Total Row. Best source for charts and PivotTables.
- **Conditional formatting** formats by value and updates automatically: Greater Than, Less Than (strict), Between, Duplicate Values, Top/Bottom, Color Scales, Data Bars.

> [!WARNING]
> Never sort a single selected column — choose **Expand the selection** or rows get separated.

## Visualization

- A chart plots what you select: labels + numbers + headers, no total row.
- **Column** compares categories; **Bar** for many categories or long labels; **Line** for trends over time; **Pie** for parts of one whole (one series, few positive values).
- Alt + F1 inserts a quick chart; the **+** button adds titles, labels and legend.
- Monthly totals Jan 160000 → Feb 163000 → Mar 172000 are a line-chart question; Laptop 59.2% vs Mobile 40.8% is a pie question.

## Data Utilities

- **Ctrl + F** finds; **Ctrl + H** replaces. Options: Match case, Match entire cell contents, Within Workbook.
- Replace All without Match entire cell contents changes text inside other words (`IT` inside `Gita`).
- **Remove Duplicates** keeps the first occurrence and deletes the rest, judged by the ticked columns.
- **Text to Columns** splits at a delimiter or fixed width; it overwrites neighbouring columns.
- **Freeze Panes**: Freeze Top Row, Freeze First Column, or select B2 → Freeze Panes for both.
- Extra spaces make identical-looking values different; `TRIM` removes them.

## PivotTables and PivotCharts

- A PivotTable summarises a list without formulas: Raw data → PivotTable → Summary.
- Source data rules: one header row, no blank rows or columns, one data type per column, consistent spelling.
- **Rows** = labels down the side; **Columns** = labels across the top; **Values** = numbers calculated; **Filters** = limit the whole report.
- Product × Region: Laptop 136000/157000, Mobile 91000/111000; Grand Total 495000.
- **Value Field Settings** switches Sum, Count, Average, Max, Min. Numbers default to Sum, text to Count; blanks or text in a number column can switch it to Count.
- Count of employees by department: Department in Rows, Name in Values → HR 2, IT 3, Sales 3.
- Average salary by department: HR 41500, IT 65000, Sales 46666.67.
- Two fields in Rows produce **subtotals**; Design controls Subtotals and Grand Totals.
- Sort with right-click → Sort; filter with label drop-downs, Value Filters, or the Filters area.
- PivotTables do not update automatically: **Refresh** (Alt + F5). New rows below a plain range need Change Data Source — or use a Table.
- Grouping (dates into months/years, numbers into bands) and Show Values As (% of Grand Total) are awareness-level.
- A **PivotChart** is linked to its PivotTable: same fields, same filters, redraws on refresh. Create with PivotTable Analyze → PivotChart.

## Common Errors

- `#DIV/0!` — divisor 0 or empty; `#VALUE!` — text in arithmetic; `#REF!` — deleted reference; `#NAME?` — misspelled function or text without quotes; `#N/A` — lookup value not found.
- `#####` is not an error: widen the column.
- Errors spread to every formula that uses them; fix the first one.
- An empty cell is 0 in arithmetic: `=C2+D2` works, `=C2/D2` gives `#DIV/0!`.

## Shortcuts

- Copy/Cut/Paste Ctrl + C/X/V; Undo/Redo Ctrl + Z/Y; Save Ctrl + S; Print Ctrl + P.
- Find Ctrl + F; Replace Ctrl + H; select data Ctrl + A.
- Ctrl + Arrow jumps to the data edge; Ctrl + Shift + Arrow selects to it; Ctrl + Home goes to A1.
- F2 edit; Alt + = AutoSum; F4 toggle `$`; Ctrl + ` show formulas.
- Ctrl + T Table; Ctrl + Shift + L filter; Ctrl + 1 Format Cells; Alt + F5 refresh a PivotTable.

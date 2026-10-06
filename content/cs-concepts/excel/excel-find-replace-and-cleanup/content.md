# Find, Replace and Basic Data Cleanup

**Module:** Data Utilities · **Test priority:** Frequently tested

## What Is It?

Real data arrives messy: inconsistent spellings, repeated rows, first and last names in one cell, and lists too long to keep the headings in view. Five tools handle most basic cleanup:

| Tool | Where | Fixes |
|---|---|---|
| **Find** | Ctrl + F | Locating a value |
| **Replace** | Ctrl + H | Changing a value everywhere at once |
| **Remove Duplicates** | Data → Remove Duplicates | Repeated rows |
| **Text to Columns** | Data → Text to Columns | One cell holding several values |
| **Freeze Panes** | View → Freeze Panes | Headings scrolling out of view |

## Find (Ctrl + F)

Type the text and press **Find Next** to jump to each match, or **Find All** to list every match with its sheet and cell address. **Options >>** adds:

- **Within:** Sheet or Workbook.
- **Look in:** Formulas or Values (search the formula text or the displayed result).
- **Match case:** `IT` does not match `it`.
- **Match entire cell contents:** `IT` matches a cell containing exactly `IT`, not `Gita`.

## Replace (Ctrl + H)

Find what → Replace with → **Replace** (one at a time) or **Replace All**.

Example: the Employees list was typed with both `Bangalore` and `Bengaluru`. Replace `Bangalore` with `Bengaluru` → Replace All → one consistent city name, so filters and PivotTables group it correctly.

> [!WARNING]
> Replace All also changes text **inside** longer words. Replacing `IT` with `Information Technology` without **Match entire cell contents** also turns `Gita` into `GInformation Technologya` and the heading `City` into `CInformation Technologyy` (Match case is off by default). Tick Match entire cell contents, or use Find All first to check what will change. **Ctrl + Z** undoes a Replace All.

## Remove Duplicates

**Data → Remove Duplicates** deletes rows that repeat, keeping the first occurrence. You choose which columns decide whether two rows are "the same".

| Emp ID | Name | Department |
|---|---|---|
| E101 | Anil | Sales |
| E102 | Bhavna | IT |
| E103 | Chetan | HR |
| E102 | Bhavna | IT |
| E104 | Deepa | IT |
| E101 | Anil | Sales |
| E105 | Farhan | Sales |

With all columns ticked, Excel reports **2 duplicate values found and removed; 5 unique values remain** — E101 to E105 once each.

> [!CAUTION]
> Remove Duplicates **deletes** rows. If you tick only **Department**, Excel keeps just the first Sales, IT and HR rows and deletes the other 4 employees. Tick the columns that truly identify a record (here Emp ID), and work on a copy or check the result before saving.

To *see* duplicates without deleting them, use [Conditional Formatting → Duplicate Values](../excel-conditional-formatting/content.md).

## Text to Columns

**Data → Text to Columns** splits one column into several.

- **Delimited:** split at a character — comma, space, tab, or another you type.
- **Fixed width:** split at fixed character positions.

Example: column A holds `Asha Rao`. Select A2:A9 → Text to Columns → Delimited → **Space** → Finish → `Asha` in column A and `Rao` in column B.

> [!WARNING]
> The split results overwrite the columns to the right. Insert empty columns first if those columns hold data.

## Freeze Panes

On a long list, scrolling down hides the header row. **View → Freeze Panes** keeps it on screen:

| Option | Keeps visible |
|---|---|
| **Freeze Top Row** | Row 1 |
| **Freeze First Column** | Column A |
| **Freeze Panes** | Every row above and every column left of the active cell — select B2 to freeze row 1 and column A together |

**Unfreeze Panes** (same menu) removes it. Freezing changes only the view, not the data, and does not affect printing.

**Quick check:** You want both the header row and the Name column (column A) to stay visible while scrolling. Which cell do you select before choosing Freeze Panes?

<details>
<summary>Answer</summary>

B2. Freeze Panes freezes everything above the active cell (row 1) and to its left (column A).

</details>

## Common Mistakes

- Replace All without Match entire cell contents, changing parts of other words.
- Remove Duplicates on the wrong columns, deleting valid records.
- Text to Columns overwriting the neighbouring column.
- Extra spaces (`Chennai` vs `Chennai `) make values look identical but count as different in filters, duplicates and PivotTables. `=TRIM(A2)` returns the text without the extra spaces.

## Key Takeaways

- **Ctrl + F** finds; **Ctrl + H** replaces — check options before Replace All.
- Remove Duplicates keeps the first occurrence and deletes the rest, judged by the columns you tick.
- Text to Columns splits one column using a delimiter or fixed width.
- Freeze Panes keeps headings visible; select the cell below and right of what should stay.

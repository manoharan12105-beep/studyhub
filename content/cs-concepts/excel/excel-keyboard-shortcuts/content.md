# Essential Excel Keyboard Shortcuts

**Module:** Shortcuts and Revision · **Test priority:** Frequently tested

## What Is It?

Keyboard shortcuts make timed tests faster and are a common quick-fire interview question. This lesson lists only the shortcuts worth memorising, for **Excel for Windows**. (On a Mac, most use **Cmd** in place of Ctrl.)

## Everyday Editing

| Shortcut | Action |
|---|---|
| **Ctrl + C** | Copy |
| **Ctrl + X** | Cut |
| **Ctrl + V** | Paste |
| **Ctrl + Z** | Undo the last action (press repeatedly to undo more) |
| **Ctrl + Y** | Redo what was undone (or repeat the last action) |
| **Ctrl + S** | Save |
| **Ctrl + P** | Print / print preview |
| **F2** | Edit the active cell (cursor at the end of its content) |
| **Esc** | Cancel the current entry or edit |

## Finding and Selecting

| Shortcut | Action |
|---|---|
| **Ctrl + F** | Find |
| **Ctrl + H** | Find and Replace |
| **Ctrl + A** | Select the current data block; press again to select the whole sheet |
| **Ctrl + Arrow key** | Jump to the last filled cell in that direction (the edge of the data) |
| **Ctrl + Shift + Arrow key** | Select from the active cell to the edge of the data |
| **Ctrl + Home** | Go to cell A1 |

On the Sales sheet (data in A1:D13):

- From A1, **Ctrl + ↓** jumps to A13 — the last record — however long the list is.
- From D2, **Ctrl + Shift + ↓** selects D2:D13, the whole Sales column, in one keystroke.

## Formulas

| Shortcut | Action |
|---|---|
| **Alt + =** | AutoSum: inserts `=SUM(...)` for the numbers above (or to the left) |
| **F4** | While editing a reference: cycle `A1` → `$A$1` → `A$1` → `$A1` |
| **Ctrl + `** | Show formulas instead of results (press again to switch back) |
| **Ctrl + D** | Fill down from the cell above |
| **Ctrl + Enter** | Enter the same value or formula in all selected cells |

Example: select D14 below the Sales column and press **Alt + =**. Excel writes `=SUM(D2:D13)`; press Enter → 495000.

## Data and Formatting

| Shortcut | Action |
|---|---|
| **Ctrl + T** | Create an Excel Table |
| **Ctrl + Shift + L** | Turn filter buttons on or off |
| **Ctrl + 1** | Open Format Cells |
| **Ctrl + B / Ctrl + I / Ctrl + U** | Bold / Italic / Underline |
| **Ctrl + ;** | Insert today's date as a fixed value |
| **Alt + F1** | Insert a chart of the selected data |
| **Alt + F5** | Refresh the selected PivotTable |

**Quick check:** You are in D2 at the top of a 5,000-row Sales column. What is the fastest way to select the whole column of numbers and total it below?

<details>
<summary>Answer</summary>

**Ctrl + Shift + ↓** selects D2 to the last filled cell. Then press **Ctrl + ↓** to move to the bottom, go one cell down, and press **Alt + =** and Enter — AutoSum totals the column above.

</details>

## Common Mistakes

- Pressing Ctrl + Z after saving and closing — undo history does not survive closing the workbook.
- Expecting Ctrl + Arrow to reach the true end of a list that has blank cells — it stops at each gap.
- Confusing Ctrl + F (find only) with Ctrl + H (replace).
- Using F4 outside a formula and wondering why it repeated the last action — that is its other job.

## Key Takeaways

- Core: Ctrl + C / X / V / Z / Y / S / P / F / H / A.
- Navigation: Ctrl + Arrow jumps, Ctrl + Shift + Arrow selects, Ctrl + Home goes to A1.
- Formulas: F2 edit, Alt + = AutoSum, F4 toggles `$`.
- Data: Ctrl + T Table, Ctrl + Shift + L filter, Ctrl + 1 Format Cells.

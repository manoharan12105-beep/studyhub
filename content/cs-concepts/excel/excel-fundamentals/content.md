# Excel Fundamentals

**Module:** Excel Basics · **Test priority:** Core

## What Is It?

**Microsoft Excel** is a spreadsheet program: a grid of cells where you store data, calculate with formulas, and summarise the results as tables, charts and PivotTables. In tests and offices it is used for marks lists, salary sheets, sales reports, attendance and expense tracking.

This module teaches the fundamentals needed for a basic Excel assessment or everyday office work. Menu names and shortcuts are for **Excel for Windows** (Microsoft 365, Excel 2016 and later); Excel for Mac uses the same ideas with some different keys.

## Workbook vs Worksheet

A **workbook** is the Excel file (`Marks.xlsx`). A **worksheet** (or **sheet**) is one grid inside it. One workbook can hold many worksheets, shown as **sheet tabs** at the bottom (`Sheet1`, `Sheet2`, or names you give such as `Students`, `Sales`).

| | Workbook | Worksheet |
|---|---|---|
| What it is | The whole file | One page (grid) in the file |
| Example | `Company-Data.xlsx` | `Employees`, `Sales` |
| Saved as | `.xlsx` file | Part of the workbook |
| Analogy | A notebook | One page of the notebook |

> [!TIP]
> Interview one-liner: "A workbook is the file; worksheets are the tabs inside it."

## Rows, Columns and Cells

- A **column** runs top to bottom and is named by letters: `A`, `B`, … `Z`, `AA`, `AB`, … up to `XFD`.
- A **row** runs left to right and is numbered: `1`, `2`, `3`, … up to 1,048,576.
- A **cell** is the box where a row and a column meet. It holds one value or one formula.

## Cell Address and Active Cell

A **cell address** (also called a **cell reference**) is the column letter followed by the row number.

| Address | Meaning |
|---|---|
| `A1` | Column A, row 1 — the top-left cell |
| `B5` | Column B, row 5 |
| `D12` | Column D, row 12 |

The **active cell** is the cell currently selected, shown with a thick border. Whatever you type goes into the active cell. Its address appears in the Name Box.

> [!WARNING]
> The column always comes first: it is `B5`, never `5B`.

## Range

A **range** is a rectangular group of cells written as `first-cell:last-cell`.

| Range | Cells it contains | Count |
|---|---|---|
| `A1:C1` | A1, B1, C1 | 3 |
| `B2:B10` | B2 to B10 in column B | 9 |
| `A1:C10` | Columns A–C, rows 1–10 | 30 |

Cell vs range: a cell is one box (`B2`); a range is a block of boxes (`B2:B10`). Functions such as `SUM` usually take a range.

**Quick check:** How many cells are in `A1:C10`?

<details>
<summary>Answer</summary>

30 — three columns (A, B, C) × ten rows (1 to 10).

</details>

## The Excel Window

```text
┌──────────────────────────────────────────────────────────────┐
│ Ribbon:  File  Home  Insert  Page Layout  Formulas  Data  View│
├────────────┬─────────────────────────────────────────────────┤
│ Name Box   │ fx  Formula bar                                 │
│   C2       │ =B2*0.18                                        │
├────┬───────┴──┬──────────┬──────────┬────────────────────────┤
│    │    A     │    B     │    C     │  ← column headings     │
│  1 │ Product  │ Price    │ Tax      │                        │
│  2 │ Laptop   │ 50000    │ [ 9000 ] │  ← active cell C2      │
│  3 │ Mobile   │ 30000    │          │                        │
│ ↑ row numbers                                                │
├──────────────────────────────────────────────────────────────┤
│ Sheet tabs:  [ Students ]  [ Employees ]  [ Sales ]  (+)     │
└──────────────────────────────────────────────────────────────┘
```

| Part | What it does |
|---|---|
| **Ribbon** | The menu tabs at the top (Home, Insert, Formulas, Data, View). Each tab groups related commands. |
| **Name Box** | Left of the formula bar. Shows the active cell's address; type an address (`D50`) and press Enter to jump there. |
| **Formula bar** | Shows the real content of the active cell — the formula, not only its result. You can edit there. |
| **Column headings / row numbers** | Click one to select the whole column or row. |
| **Sheet tabs** | Switch between worksheets; right-click to rename, insert, delete or colour a sheet. |
| **Status bar** | At the bottom. Shows Sum, Average and Count of the selected cells without writing a formula. |

> [!TIP]
> Select some numbers and look at the status bar: Excel shows their Average, Count and Sum instantly. Useful to check a formula's answer.

## Practice Datasets

These three small datasets are used throughout the module. Each starts in cell `A1` of its own worksheet, with headings in row 1 and data from row 2.

### Students

| | A | B | C | D |
|---|---|---|---|---|
| **1** | Name | Department | Marks | Attendance |
| **2** | Asha | CSE | 82 | 95% |
| **3** | Ravi | ECE | 45 | 78% |
| **4** | Meena | CSE | 38 | 88% |
| **5** | Karthik | MECH | 67 | 72% |
| **6** | Divya | ECE | 91 | 98% |
| **7** | Arun | MECH | 55 | 64% |
| **8** | Priya | CSE | 74 | 90% |
| **9** | Vijay | ECE | 29 | 70% |

### Employees

| | A | B | C | D | E |
|---|---|---|---|---|---|
| **1** | Emp ID | Name | Department | Salary | City |
| **2** | E101 | Anil | Sales | 42000 | Chennai |
| **3** | E102 | Bhavna | IT | 65000 | Bengaluru |
| **4** | E103 | Chetan | HR | 38000 | Chennai |
| **5** | E104 | Deepa | IT | 72000 | Hyderabad |
| **6** | E105 | Farhan | Sales | 51000 | Bengaluru |
| **7** | E106 | Gita | HR | 45000 | Hyderabad |
| **8** | E107 | Harish | IT | 58000 | Chennai |
| **9** | E108 | Isha | Sales | 47000 | Chennai |

### Sales

| | A | B | C | D |
|---|---|---|---|---|
| **1** | Product | Region | Month | Sales |
| **2** | Laptop | South | Jan | 50000 |
| **3** | Mobile | North | Jan | 30000 |
| **4** | Laptop | North | Jan | 45000 |
| **5** | Mobile | South | Jan | 35000 |
| **6** | Laptop | South | Feb | 52000 |
| **7** | Mobile | North | Feb | 28000 |
| **8** | Laptop | North | Feb | 47000 |
| **9** | Mobile | South | Feb | 36000 |
| **10** | Laptop | South | Mar | 55000 |
| **11** | Mobile | North | Mar | 33000 |
| **12** | Laptop | North | Mar | 44000 |
| **13** | Mobile | South | Mar | 40000 |

> [!TIP]
> Type one of these into Excel and follow along. Practising on real cells is the fastest way to remember menu locations.

## Common Mistakes

- Calling a worksheet a "workbook" (or the reverse) in an interview.
- Writing the row before the column (`5B` instead of `B5`).
- Reading the value in the cell and assuming that is all it contains — check the formula bar to see whether it is a typed value or a formula.

## Key Takeaways

- Workbook = file; worksheet = one tab in it.
- Columns are letters, rows are numbers, a cell is where they meet: `B5`.
- A range is `first:last`, e.g. `A1:C10` (30 cells).
- Name Box = address of the active cell; formula bar = what the cell really contains.

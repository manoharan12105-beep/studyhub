# Essential Excel Functions

**Module:** Formulas and Functions · **Test priority:** Core

## What Is It?

A **function** is a built-in, named calculation such as `SUM` or `AVERAGE`. You use a function inside a formula:

```text
=FUNCTION(arguments)
=SUM(C2:C9)
```

- The function name is followed by parentheses.
- The **arguments** go inside — usually a range. Several arguments are separated by commas: `=SUM(C2:C5, C8:C9)`.
- **Formula vs function:** a formula is anything starting with `=`; a function is a ready-made calculation used inside a formula. `=C2+C3` is a formula without a function; `=SUM(C2:C3)` is a formula that uses the `SUM` function.

> [!NOTE]
> In some regional settings Excel separates arguments with a semicolon (`=SUM(C2:C5; C8:C9)`). The idea is the same.

## The Six Functions

Examples use the Students sheet: marks in C2:C9 are 82, 45, 38, 67, 91, 55, 74, 29.

| Function | Purpose | Example | Result |
|---|---|---|---|
| `SUM` | Adds numbers | `=SUM(C2:C9)` | 481 |
| `AVERAGE` | Arithmetic mean | `=AVERAGE(C2:C9)` | 60.125 |
| `MIN` | Smallest number | `=MIN(C2:C9)` | 29 |
| `MAX` | Largest number | `=MAX(C2:C9)` | 91 |
| `COUNT` | How many cells contain **numbers** | `=COUNT(C2:C9)` | 8 |
| `COUNTA` | How many cells are **not empty** | `=COUNTA(A2:A9)` | 8 |

The same functions on the Employees sheet (salaries in D2:D9):

| Question | Formula | Result |
|---|---|---|
| Total salary bill | `=SUM(D2:D9)` | 418000 |
| Average salary | `=AVERAGE(D2:D9)` | 52250 |
| Lowest salary | `=MIN(D2:D9)` | 38000 |
| Highest salary | `=MAX(D2:D9)` | 72000 |

> [!TIP]
> **AutoSum:** select the cell below a column of numbers and press **Alt + =**. Excel writes `=SUM(...)` with the range above; press Enter to accept. The arrow next to AutoSum on the Home tab also offers Average, Count Numbers, Max and Min.

## COUNT vs COUNTA

This is the most-asked function question. `COUNT` counts **numbers only** (dates count too, because they are numbers). `COUNTA` counts **every non-empty cell** — numbers, text, dates and errors.

An attendance test where absent students were marked `AB`:

| | A | B |
|---|---|---|
| **1** | Name | Score |
| **2** | Asha | 82 |
| **3** | Ravi | AB |
| **4** | Meena | 38 |
| **5** | Karthik | *(empty)* |
| **6** | Divya | 91 |

| Formula | Result | Why |
|---|---|---|
| `=COUNT(B2:B6)` | 3 | Only 82, 38 and 91 are numbers |
| `=COUNTA(B2:B6)` | 4 | 82, AB, 38 and 91 are not empty |
| `=COUNTA(A2:A6)` | 5 | Five names |
| `=AVERAGE(B2:B6)` | 70.33… | (82 + 38 + 91) ÷ 3 — text and empty cells are ignored |

Use `COUNT` to ask "how many students have a score?" and `COUNTA` to ask "how many entries are filled in?" — or, on a name column, "how many students are listed?".

**Quick check:** In the table above, how many students have no numeric score?

<details>
<summary>Answer</summary>

2 (Ravi and Karthik). Total students `=COUNTA(A2:A6)` = 5, minus students with a number `=COUNT(B2:B6)` = 3.

</details>

## How Functions Treat Blanks, Text and Zero

| Cell contains | `SUM` | `AVERAGE` | `COUNT` | `COUNTA` |
|---|---|---|---|---|
| A number, including `0` | Adds it | Includes it | Counts it | Counts it |
| Text (`AB`, `Absent`) | Ignores | Ignores | Ignores | Counts it |
| Empty | Ignores | Ignores | Ignores | Ignores |

> [!WARNING]
> A blank and a zero are different. If an absent student is entered as `0`, `AVERAGE` includes the 0 and the average drops; if the cell is left empty, it is ignored. Decide which you mean before filling the column.

## Common Mistakes

- Using `COUNT` on a column of names — it returns 0, because names are text. Use `COUNTA`.
- Including the header row in the range (`=SUM(C1:C9)`); `SUM` ignores the text header, but `COUNTA` counts it, giving one too many.
- Typing numbers as text, so `SUM` silently skips them.
- Writing `=SUM(C2+C9)` — that adds only two cells. A range uses a colon: `=SUM(C2:C9)`.

## Key Takeaways

- Syntax: `=FUNCTION(range)`, e.g. `=SUM(C2:C9)`.
- `SUM`, `AVERAGE`, `MIN`, `MAX` work on numbers and ignore text and blanks.
- `COUNT` = cells with numbers; `COUNTA` = non-empty cells.
- A zero is a value; a blank is nothing — they give different averages.
- **Alt + =** inserts `SUM` instantly.

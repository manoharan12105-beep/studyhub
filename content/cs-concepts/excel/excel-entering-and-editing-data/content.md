# Entering and Editing Data

**Module:** Excel Basics · **Test priority:** Core

## What Is It?

Every Excel task starts with typing data into cells and correcting it. Excel decides what *kind* of value you typed — text, number or date — and that decides whether it can be calculated, sorted by value or charted.

## Text, Numbers and Dates

| Type | Examples | Default alignment | Can be calculated? |
|---|---|---|---|
| **Text** | `Asha`, `CSE`, `E101` | Left | No |
| **Number** | `82`, `42000`, `18%`, `3.5` | Right | Yes |
| **Date** | `15-Aug-2025`, `1/3/2025` | Right | Yes (a date is stored as a number) |

Excel stores a **date** as a serial number — the count of days since 1 January 1900 — and only *displays* it as a date. That is why you can subtract two dates to get the number of days between them.

> [!TIP]
> Alignment is a quick health check. A "number" sitting on the **left** of the cell (with default formatting) is probably stored as text and will not add up in `SUM`.

**Quick check:** You type `007` as an employee code and Excel shows `7`. Why, and how do you keep the zeros?

<details>
<summary>Answer</summary>

Excel recognised `007` as the number 7 and dropped the leading zeros. Type `'007` (an apostrophe first), or format the cells as **Text** before typing. Codes, phone numbers and IDs are labels, not quantities, so storing them as text is correct.

</details>

## Entering and Editing Cells

| Action | How |
|---|---|
| Enter a value | Select the cell, type, press **Enter** (moves down) or **Tab** (moves right) |
| Cancel typing | **Esc** — the cell keeps its old content |
| Replace a value | Select the cell and type over it |
| Edit part of a value | **F2**, double-click the cell, or click in the formula bar |
| Same value in many cells | Select the cells, type, press **Ctrl + Enter** |

> [!WARNING]
> Typing into a selected cell **replaces** everything in it. To correct one character, press **F2** first.

## Delete vs Clear

Three different commands remove things, and tests ask about the difference.

| Command | What it removes | Do other cells move? |
|---|---|---|
| **Delete key** | Contents only — formatting stays | No |
| **Home → Clear** | Your choice: Clear All, Clear Formats, Clear Contents, Clear Comments and Notes, Clear Hyperlinks | No |
| **Home → Delete** (or right-click → Delete) | The cells, rows or columns themselves | Yes — cells shift up or left to fill the gap |

Example: row 4 (Meena) in the Students sheet.

- Select A4:D4 and press **Delete** → the four cells become empty; row 4 stays as a blank row.
- Right-click row number 4 → **Delete** → the row disappears and Karthik moves up from row 5 to row 4.

> [!NOTE]
> After pressing Delete on a cell formatted as currency, a new number typed there is still shown as currency — the format was not removed. Use **Clear All** to remove both.

## Copy, Cut and Paste

| Action | Shortcut | Result |
|---|---|---|
| **Copy** | Ctrl + C | Original stays; a copy is pasted |
| **Cut** | Ctrl + X | Original is moved to the paste location |
| **Paste** | Ctrl + V | Pastes the copied/cut cells |
| **Paste Special → Values** | Ctrl + Alt + V, then V, Enter | Pastes only results, not formulas |

After Copy, a moving dashed border ("marching ants") marks the copied cells; **Esc** removes it.

**Copying a formula** adjusts its cell references (`=B2*0.18` copied one row down becomes `=B3*0.18`); **moving** a formula with Cut keeps it pointing at the same cells. [Cell References](../excel-cell-references/content.md) explains this in detail.

> [!TIP]
> Paste Values is the standard way to "freeze" calculated results before sending a sheet, so they no longer depend on other cells.

## AutoFill and the Fill Handle

The **fill handle** is the small square at the bottom-right corner of the selected cell. Dragging it is called **AutoFill**: Excel continues a pattern or copies the value.

| You select | Drag down 3 cells | Why |
|---|---|---|
| `5` | `5, 5, 5` | One number is copied |
| `1`, `2` (two cells) | `3, 4, 5` | Two numbers define a step of 1 |
| `10`, `20` | `30, 40, 50` | Step of 10 |
| `Jan` | `Feb, Mar, Apr` | Built-in month list |
| `Mon` | `Tue, Wed, Thu` | Built-in day list |
| `Item 1` | `Item 2, Item 3, Item 4` | Text + number: the number increases |
| `01-Jan-2025` | `02-Jan-2025, 03-Jan-2025, 04-Jan-2025` | Dates increase by one day |
| `=B2*0.18` | `=B3*0.18, =B4*0.18, =B5*0.18` | Formula copied with references adjusted |

Useful fill shortcuts:

- **Double-click** the fill handle: fills down as far as the neighbouring column has data — fast for long lists.
- **Ctrl + D** fills the selected cells down from the top cell; **Ctrl + R** fills right.
- After a drag, the **Auto Fill Options** button lets you switch between *Copy Cells* and *Fill Series*.

**Quick check:** You type `1` in A2 and drag the fill handle to A6. What appears?

<details>
<summary>Answer</summary>

`1` in every cell (A2:A6 all show 1) — a single number is copied. To get 1, 2, 3, 4, 5, type `1` and `2` in A2 and A3, select both, then drag; or hold **Ctrl** while dragging a single number.

</details>

## Common Mistakes

- Typing over a cell to fix one character instead of pressing **F2**.
- Expecting the Delete key to remove formatting.
- Deleting rows when only the contents should be cleared — every row below moves up.
- Entering IDs or phone numbers as numbers, which drops leading zeros. (Excel also keeps only 15 significant digits, so a 16-digit card number changes its last digit.)

## Key Takeaways

- Text aligns left, numbers and dates align right; dates are stored as numbers.
- Delete key = contents only; Clear = choose what to clear; Delete command = removes cells and shifts others.
- Copy keeps the original, Cut moves it; Paste Values pastes results without formulas.
- Fill handle: one number copies, two numbers continue the step, months/days/dates continue the series, formulas adjust their references.

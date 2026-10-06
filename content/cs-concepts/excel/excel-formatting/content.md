# Formatting

**Module:** Data Handling · **Test priority:** Frequently tested

## What Is It?

**Formatting** changes how cells *look* — font, colour, borders, alignment, and how numbers are displayed. It makes a sheet readable and professional.

> [!IMPORTANT]
> Formatting changes how a value is **displayed**, not the value stored in the cell. `0.18` formatted as Percentage shows `18%`, but formulas still use 0.18. Check the formula bar to see the stored value.

Most formatting is on the **Home** tab. **Ctrl + 1** opens the full **Format Cells** dialog (Number, Alignment, Font, Border, Fill tabs).

## Font and Style

| Format | Where | Shortcut |
|---|---|---|
| Font and font size | Home → Font group | — |
| **Bold** | Home → B | Ctrl + B |
| *Italic* | Home → I | Ctrl + I |
| Underline | Home → U | Ctrl + U |
| Font colour | Home → A (with colour bar) | — |
| **Fill colour** (cell background) | Home → paint bucket | — |
| **Borders** | Home → Borders drop-down (All Borders, Outside Borders, Thick Box Border…) | — |

A typical report header: bold, a light fill colour, and a bottom border; data cells with All Borders.

> [!NOTE]
> The grey gridlines on screen are not borders — they do not print by default. Add borders when a table must show lines on paper or in a PDF.

## Alignment

| Option | Use |
|---|---|
| Left / Center / Right | Horizontal position in the cell |
| Top / Middle / Bottom | Vertical position |
| **Wrap Text** | Shows long text on several lines inside the cell |
| **Merge & Center** | Joins several cells into one and centres the content — e.g. a title across A1:D1 |

> [!WARNING]
> Avoid merged cells inside a data list. They prevent sorting and cause errors when selecting or filtering. Merge only titles above the data.

## Number Formats

Home → Number group (the drop-down shows **General** by default). The same stored value, shown with different formats:

| Stored value | Format | Displayed as |
|---|---|---|
| `52250` | General | 52250 |
| `52250` | Number, 2 decimals, thousands separator | 52,250.00 |
| `52250` | Currency | ₹52,250.00 (symbol from your regional settings) |
| `0.18` | Percentage | 18% |
| `0.755` | Percentage, 1 decimal | 75.5% |
| `45884` | Short Date | 15-08-2025 (order depends on regional settings) |
| `45884` | Long Date | Friday, 15 August 2025 |

**Increase Decimal / Decrease Decimal** buttons (Home → Number) show more or fewer decimal places.

## Display vs Stored Value

Three cells each contain `1.4`, formatted with 0 decimal places. They show `1`, `1` and `1`, but `=SUM` of them shows `4` — because Excel adds the stored values (4.2) and then displays the result with 0 decimals.

| Cell | Stored | Displayed (0 decimals) |
|---|---|---|
| A1 | 1.4 | 1 |
| A2 | 1.4 | 1 |
| A3 | 1.4 | 1 |
| A4 `=SUM(A1:A3)` | 4.2 | 4 |

Decreasing decimals **hides** digits; it does not round the value used in calculations. (Rounding the stored value needs the `ROUND` function, which is beyond this module.)

**Quick check:** A cell contains `18`. You apply Percentage format. What does it show?

<details>
<summary>Answer</summary>

`1800%` — Percentage format multiplies the display by 100, and 18 = 1800%. Enter the rate as `0.18`, or type `18%` directly. (Typing `18` into a cell that was *already* formatted as Percentage is converted to 18% automatically.)

</details>

## Format Painter

**Format Painter** (the paintbrush on the Home tab) copies only the formatting of one cell to others. Select the formatted cell → click Format Painter → click or drag over the target cells. Double-click it to apply to several places; press Esc to stop.

## Common Mistakes

- Thinking Decrease Decimal rounds the value — totals then look "wrong by 1".
- Applying Percentage to whole numbers (18 → 1800%).
- Typing the currency symbol or commas as text (`Rs. 42,000`) — the cell becomes text and cannot be added. Type `42000` and apply Currency format.
- Merging cells inside a list, which blocks sorting.

## Key Takeaways

- Formatting changes the display, not the stored value.
- Font, fill, borders and alignment: Home tab; full options: **Ctrl + 1**.
- Number formats: General, Number, Currency, Percentage, Date; adjust decimals with the Increase/Decrease Decimal buttons.
- Percentage = value × 100 with a % sign: store 18% as 0.18.
- Format Painter copies formatting only.

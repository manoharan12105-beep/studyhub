# Cell References

**Module:** Formulas and Functions · **Test priority:** Core

## What Is It?

A **cell reference** is a cell address used inside a formula, such as `A2` in `=A2*0.18`. When you **copy** a formula to another cell, Excel adjusts its references — and the dollar sign `$` controls which parts are allowed to change.

| Reference | Type | What stays fixed when copied |
|---|---|---|
| `A1` | **Relative** | Nothing — column and row both adjust |
| `$A$1` | **Absolute** | Both column and row |
| `$A1` | **Mixed** | The column (A) |
| `A$1` | **Mixed** | The row (1) |

Read `$` as "lock the next part". `$A` locks the column, `$1` locks the row.

## Relative References

A relative reference means "the cell at this position relative to me". Copy `=A2+B2` from C2 down to C3 and it becomes `=A3+B3` — still "the two cells to my left, on my row". This is what you want for row-by-row calculations, and it is why the fill handle works.

| Cell | Formula after copying down | Meaning |
|---|---|---|
| C2 | `=A2+B2` | Row 2 |
| C3 | `=A3+B3` | Row 3 |
| C4 | `=A4+B4` | Row 4 |

## Absolute References: Price × Tax Rate

Prices are in column A. The tax rate, 18%, is typed **once** in B1. Column B should show the tax for each price.

| | A | B |
|---|---|---|
| **1** | Price | 18% |
| **2** | 1000 | `=A2*$B$1` |
| **3** | 2500 | |
| **4** | 400 | |
| **5** | 1200 | |

Copy B2 down to B5:

| Cell | Formula | Result |
|---|---|---|
| B2 | `=A2*$B$1` | 180 |
| B3 | `=A3*$B$1` | 450 |
| B4 | `=A4*$B$1` | 72 |
| B5 | `=A5*$B$1` | 216 |

`A2` is relative, so each row uses its own price. `$B$1` is absolute, so every row keeps using the single tax rate in B1.

**What goes wrong without `$`:** with `=A2*B1` in B2, copying down produces `=A3*B2`, `=A4*B3`, … Each row multiplies its price by the *tax cell above it* instead of the rate:

| Cell | Formula | Result |
|---|---|---|
| B2 | `=A2*B1` | 180 (correct by luck) |
| B3 | `=A3*B2` | 450000 |
| B4 | `=A4*B3` | 180000000 |

Only the first row is right. The fix is to lock the rate: `$B$1`.

> [!TIP]
> While typing or editing a reference, press **F4** to cycle through `B1` → `$B$1` → `B$1` → `$B1` → `B1`.

**Quick check:** Why does the tax rate need `$B$1` while the price stays `A2`?

<details>
<summary>Answer</summary>

Every row has its own price, so the price reference must move down with the formula (relative). There is only one tax rate, so its reference must not move (absolute). Without the `$`, copied formulas point at the wrong cells.

</details>

## Mixed References

A mixed reference locks only one part. It is needed when a formula is copied **both down and across** — for example, a grid of discount amounts for several prices (rows) and several discount rates (columns).

| | A | B | C | D |
|---|---|---|---|---|
| **1** | Price | 5% | 10% | 15% |
| **2** | 1000 | `=$A2*B$1` | | |
| **3** | 2000 | | | |
| **4** | 3000 | | | |

Fill B2 across to D2 and down to row 4:

| | B (5%) | C (10%) | D (15%) |
|---|---|---|---|
| **2** (1000) | `=$A2*B$1` → 50 | `=$A2*C$1` → 100 | `=$A2*D$1` → 150 |
| **3** (2000) | `=$A3*B$1` → 100 | `=$A3*C$1` → 200 | `=$A3*D$1` → 300 |
| **4** (3000) | `=$A4*B$1` → 150 | `=$A4*C$1` → 300 | `=$A4*D$1` → 450 |

- `$A2`: the column is locked to A (prices), the row moves — each row uses its own price.
- `B$1`: the row is locked to 1 (rates), the column moves — each column uses its own rate.

## Summary: What Changes When Copied

A formula in C2 refers to `A1` in each of the four styles. This is what the reference becomes when the formula is copied **one cell down** (to C3) and **one cell right** (to D2):

| Original | Copied down (C3) | Copied right (D2) |
|---|---|---|
| `A1` | `A2` | `B1` |
| `$A$1` | `$A$1` | `$A$1` |
| `$A1` | `$A2` | `$A1` |
| `A$1` | `A$1` | `B$1` |

> [!NOTE]
> References change only when a formula is **copied** (or filled). **Moving** a formula with Cut and Paste keeps its references exactly as they were.

## Common Mistakes

- Forgetting `$` on a single shared value (tax rate, commission %, exchange rate), so copied rows show 0 or huge numbers.
- Adding `$` everywhere "to be safe" — then the price reference does not move either, and every row shows the first row's answer.
- Locking the wrong part in a grid (`A$2` instead of `$A2`).
- Typing `$` before the number only (`A$1`) when the column must also stay fixed.

## Key Takeaways

- Relative `A1` moves with the formula; absolute `$A$1` never moves.
- `$A1` locks the column; `A$1` locks the row.
- Use absolute references for one fixed input (rate, target, constant) used by many rows.
- **F4** cycles the reference types while editing.

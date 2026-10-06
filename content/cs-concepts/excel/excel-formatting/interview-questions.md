# Formatting — Interview Questions

## Beginner

### Q1. Does formatting a number change its value?

<details>
<summary>Answer</summary>

No. Formatting changes only how the value is displayed. `0.18` with Percentage format shows `18%`, and `1.4` with zero decimals shows `1`, but formulas still use 0.18 and 1.4. That is why a total of three cells showing `1` can show `4` — the stored values add up to 4.2. The formula bar shows the stored value.

</details>

## Intermediate

### Q2. Why should you avoid merged cells in a data list?

<details>
<summary>Answer</summary>

Merged cells break the one-value-per-cell grid that sorting, filtering, copying and PivotTables rely on. Excel refuses to sort a range containing merged cells of different sizes, and selections jump unexpectedly. Merge only titles above the data, or use Center Across Selection (Format Cells → Alignment) for the same look without merging.

</details>

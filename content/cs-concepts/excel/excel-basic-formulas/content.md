# Basic Excel Formulas

**Module:** Formulas and Functions · **Test priority:** Core

## What Is It?

A **formula** is an instruction that tells Excel to calculate a value. Every formula starts with an equals sign `=`. The cell shows the **result**; the formula bar shows the **formula**.

```text
Cell A1: 10        Cell B1: 20        Cell C1: =A1+B1

C1 shows 30. The formula bar shows =A1+B1.
```

Because the formula refers to the cells A1 and B1 rather than the numbers 10 and 20, changing A1 to 15 makes C1 show 35 automatically. This is the main reason to use cell references in formulas.

## Arithmetic Operators

Examples with `A1 = 10` and `B1 = 4`:

| Operation | Operator | Formula | Result |
|---|---|---|---|
| Addition | `+` | `=A1+B1` | 14 |
| Subtraction | `-` | `=A1-B1` | 6 |
| Multiplication | `*` | `=A1*B1` | 40 |
| Division | `/` | `=A1/B1` | 2.5 |
| Power | `^` | `=B1^2` | 16 |
| Parentheses | `( )` | `=(A1+B1)*2` | 28 |

> [!WARNING]
> Multiplication is `*`, not `x` or `×`. `=A1xB1` is not a valid formula — Excel returns `#NAME?`.

## Operator Precedence

When a formula has several operators, Excel does not simply work left to right. It follows an order called **operator precedence**:

| Order | Operator | Meaning |
|---|---|---|
| 1 | `( )` | Parentheses first |
| 2 | `^` | Power |
| 3 | `*` and `/` | Multiply and divide, left to right |
| 4 | `+` and `-` | Add and subtract, left to right |

| Formula | Working | Result |
|---|---|---|
| `=2+3*4` | 3 × 4 = 12, then 2 + 12 | 14 |
| `=(2+3)*4` | 2 + 3 = 5, then 5 × 4 | 20 |
| `=10+20/2` | 20 ÷ 2 = 10, then 10 + 10 | 20 |
| `=(10+20)/2` | 10 + 20 = 30, then 30 ÷ 2 | 15 |
| `=10-2-3` | Left to right: 8, then 5 | 5 |

> [!IMPORTANT]
> To average two marks by hand you need `=(B2+C2)/2`. Without the parentheses, `=B2+C2/2` divides only C2 by 2.

**Quick check:** A1 = 10 and B1 = 20. What does `=A1+B1*2` show?

<details>
<summary>Answer</summary>

50. Multiplication comes first: 20 × 2 = 40, then 10 + 40 = 50. To double the total, write `=(A1+B1)*2`, which gives 60.

</details>

## Formula vs Value

| | Value (constant) | Formula |
|---|---|---|
| What you type | `30` | `=A1+B1` |
| Starts with `=` | No | Yes |
| Changes when other cells change | No | Yes |
| Formula bar shows | `30` | `=A1+B1` |

If you forget the `=`, Excel stores what you typed as text: typing `A1+B1` simply shows the characters `A1+B1`.

A formula can also mix references and constants, such as `=B2*0.18` (18% tax on the price in B2). Typing the result by hand (`9000`) works today but does not update when the price changes — this is a common reason for wrong totals in real sheets.

> [!TIP]
> Press **Ctrl + `** (the key left of 1) to show formulas instead of results in every cell. Press it again to switch back. Useful for checking someone else's sheet.

## Practical Examples

Students sheet, with marks out of 100 in column C:

| Need | Formula in E2 | Result for Asha (C2 = 82) |
|---|---|---|
| Marks out of 50 | `=C2/2` | 41 |
| Marks after a 5-mark grace | `=C2+5` | 87 |
| Shortfall from 100 | `=100-C2` | 18 |
| Fraction of 100 | `=C2/100` | 0.82 (shown as 82% with Percentage format) |

Expense sheet: with quantity in B2 (`3`) and unit price in C2 (`250`), the amount is `=B2*C2` → 750.

## Common Mistakes

- Forgetting the `=` — the "formula" becomes text.
- Using `x` for multiplication instead of `*`.
- Missing parentheses: `=B2+C2/2` instead of `=(B2+C2)/2`.
- Typing calculated numbers by hand instead of formulas, so they do not update.
- Pressing Enter on a formula that points to a cell you did not intend — always check the coloured boxes Excel draws around referenced cells while editing.

## Key Takeaways

- Every formula starts with `=`; the cell shows the result, the formula bar shows the formula.
- Operators: `+ - * / ^`; precedence: parentheses → power → multiply/divide → add/subtract.
- Use cell references so results update when the data changes.
- Formula = calculated and live; value = fixed constant.

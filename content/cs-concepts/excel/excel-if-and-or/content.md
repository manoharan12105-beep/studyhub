# IF, AND and OR

**Module:** Formulas and Functions · **Test priority:** Core

## What Is It?

`IF` lets a cell make a decision: it checks a **condition** and shows one result when the condition is true and another when it is false. `AND` and `OR` combine several conditions into one.

```text
=IF(condition, result_if_true, result_if_false)
=IF(C2>=50, "Pass", "Fail")
```

## Comparison Operators

A condition compares two things and is either `TRUE` or `FALSE`.

| Operator | Meaning | Example | TRUE when |
|---|---|---|---|
| `=` | Equal to | `B2="CSE"` | B2 is CSE |
| `<>` | Not equal to | `B2<>"CSE"` | B2 is anything except CSE |
| `>` | Greater than | `C2>50` | C2 is 51, 60, … (not 50) |
| `<` | Less than | `C2<40` | C2 is below 40 |
| `>=` | Greater than or equal to | `C2>=50` | C2 is 50 or more |
| `<=` | Less than or equal to | `C2<=40` | C2 is 40 or less |

## IF

The three parts:

| Part | In `=IF(C2>=50,"Pass","Fail")` | Meaning |
|---|---|---|
| **Condition** (logical test) | `C2>=50` | Is the mark 50 or more? |
| **True result** | `"Pass"` | Shown when the condition is TRUE |
| **False result** | `"Fail"` | Shown when the condition is FALSE |

Filled down the Students sheet (marks in column C):

| Name | Marks | `=IF(C2>=50,"Pass","Fail")` |
|---|---|---|
| Asha | 82 | Pass |
| Ravi | 45 | Fail |
| Meena | 38 | Fail |
| Karthik | 67 | Pass |
| Divya | 91 | Pass |
| Arun | 55 | Pass |
| Priya | 74 | Pass |
| Vijay | 29 | Fail |

More everyday uses:

| Need | Formula |
|---|---|
| Attendance eligibility (column D) | `=IF(D2>=75%,"Eligible","Not eligible")` |
| Salary band (Employees, column D) | `=IF(D2>50000,"High","Standard")` |
| Late fee of 500 when unpaid (column F) | `=IF(F2="Unpaid",500,0)` |

> [!IMPORTANT]
> Text results and text you compare against go in **double quotes** (`"Pass"`, `"CSE"`). Numbers do not (`50`, `500`). `TRUE`/`FALSE` and cell references never need quotes.

## AND and OR

`AND` and `OR` take several conditions and return a single `TRUE` or `FALSE`, so they fit into the condition part of `IF`.

| Function | Returns TRUE when | Example |
|---|---|---|
| `AND(cond1, cond2, …)` | **All** conditions are true | Passed theory **and** practical |
| `OR(cond1, cond2, …)` | **At least one** condition is true | Passed theory **or** practical |

Theory marks in B, practical marks in C:

| Name | Theory (B) | Practical (C) | `=IF(AND(B2>=50,C2>=50),"Pass","Fail")` | `=IF(OR(B2>=50,C2>=50),"Pass","Fail")` |
|---|---|---|---|---|
| Asha | 72 | 81 | Pass | Pass |
| Ravi | 48 | 66 | Fail | Pass |
| Meena | 55 | 42 | Fail | Pass |
| Vijay | 35 | 40 | Fail | Fail |

On the Students sheet, a student is eligible for a prize only with marks of at least 50 **and** attendance of at least 75%:

```text
=IF(AND(C2>=50, D2>=75%), "Eligible", "Not eligible")
```

Asha (82, 95%), Divya (91, 98%) and Priya (74, 90%) are eligible; Karthik (67, 72%) and Arun (55, 64%) fail the attendance condition.

**Quick check:** Ravi has Theory 48 and Practical 66. What do the `AND` and `OR` versions above return for him, and why?

<details>
<summary>Answer</summary>

`AND` → Fail, because the theory condition (48 ≥ 50) is false and `AND` needs both. `OR` → Pass, because the practical condition (66 ≥ 50) is true and `OR` needs only one.

</details>

## One Level of Nesting

An `IF` can be placed inside another `IF` to choose between three results:

```text
=IF(C2>=75, "Distinction", IF(C2>=50, "Pass", "Fail"))
```

Excel tests the conditions in order: 82 → Distinction, 67 → Pass, 38 → Fail. Put the highest threshold first; with `C2>=50` first, an 82 would stop at "Pass". For a basic test, one level of nesting is usually enough.

## Common Mistakes

- Missing quotes around text: `=IF(C2>=50,Pass,Fail)` returns `#NAME?`, because Excel looks for something named Pass.
- Quotes around numbers: `C2>="50"` compares a number with the *text* "50" and is never true for a number, so every student gets the false result.
- `>` when `>=` is meant — a mark of exactly 50 fails `C2>50`.
- Writing `B2 AND C2>=50` like an English sentence. Excel needs `AND(B2>=50, C2>=50)` with a full condition for each cell.

## Key Takeaways

- `=IF(condition, true_result, false_result)`.
- `AND` = all conditions true; `OR` = at least one true. Both go inside the condition of `IF`.
- Text in double quotes; numbers and references without.
- Watch the boundary: `>=` includes the value, `>` does not.

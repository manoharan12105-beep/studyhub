# IF, AND and OR — Interview Questions

## Beginner

### Q1. What does the `IF` function do? Explain its parts.

<details>
<summary>Answer</summary>

`IF` tests a condition and returns one value if it is true and another if it is false: `=IF(condition, value_if_true, value_if_false)`. For example, `=IF(C2>=50,"Pass","Fail")` shows Pass for marks of 50 or more and Fail otherwise. The condition uses comparison operators such as `>=`, `<`, `=` and `<>`.

</details>

### Q2. What are `AND` and `OR` used for?

<details>
<summary>Answer</summary>

They combine conditions. `AND` returns TRUE only when every condition is true; `OR` returns TRUE when at least one is true. They are usually placed inside `IF`: `=IF(AND(B2>=50,C2>=50),"Pass","Fail")` needs both subjects passed, while the `OR` version needs only one.

</details>

## Intermediate

### Q3. A formula `=IF(C2>=50,Pass,Fail)` shows `#NAME?`. Why?

<details>
<summary>Answer</summary>

Text results must be in double quotes. Without them, Excel treats `Pass` and `Fail` as names of something defined in the workbook, cannot find them, and returns `#NAME?`. The fix is `=IF(C2>=50,"Pass","Fail")`.

</details>

# IF, AND and OR — Practice

### P1. Pass or fail

**Difficulty:** Easy · **Type:** Formula · **Concepts:** IF

B2 = 50. What does `=IF(B2>=50,"Pass","Fail")` return?

- A) Pass
- B) Fail
- C) TRUE
- D) 50

<details>
<summary>Answer</summary>

**Answer:** A) Pass

50 ≥ 50 is true, so the true result is shown. With `B2>50` the answer would be Fail.

</details>

### P2. Both subjects

**Difficulty:** Easy · **Type:** Formula · **Concepts:** AND

B2 = 70 and C2 = 45. What does `=IF(AND(B2>=50,C2>=50),"Pass","Fail")` return?

- A) Pass
- B) Fail
- C) `#VALUE!`
- D) FALSE

<details>
<summary>Answer</summary>

**Answer:** B) Fail

`AND` needs both conditions; C2 ≥ 50 is false, so `AND` is FALSE and `IF` returns its false result, "Fail".

</details>

### P3. Either subject

**Difficulty:** Easy · **Type:** Formula · **Concepts:** OR

B2 = 70 and C2 = 45. What does `=IF(OR(B2>=50,C2>=50),"Pass","Fail")` return?

- A) Pass
- B) Fail
- C) TRUE
- D) 115

<details>
<summary>Answer</summary>

**Answer:** A) Pass

`OR` needs at least one true condition; B2 ≥ 50 is true.

</details>

### P4. Write the formula

**Difficulty:** Medium · **Type:** Formula · **Concepts:** IF, AND

On the Employees sheet (Department in C, Salary in D), write a formula for F2 that shows `Review` when the employee is in IT **and** earns less than 60000, and is empty otherwise.

<details>
<summary>Answer</summary>

```text
=IF(AND(C2="IT", D2<60000), "Review", "")
```

`""` (two quotes with nothing between) returns an empty-looking text result. For the dataset, only Harish (IT, 58000) shows Review.

</details>

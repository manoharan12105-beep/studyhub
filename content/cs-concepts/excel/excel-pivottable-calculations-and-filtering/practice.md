# PivotTable Calculations and Filtering — Practice

### P1. Average instead of sum

**Difficulty:** Easy · **Type:** PivotTable · **Concepts:** value field settings

Your PivotTable shows Sum of Salary by department. Where do you change it to Average?

- A) Design → Grand Totals
- B) Value Field Settings → Summarize value field by
- C) Data → Sort
- D) Home → Number Format

<details>
<summary>Answer</summary>

**Answer:** B) Value Field Settings → Summarize value field by

It switches the calculation between Sum, Count, Average, Max, Min and others.

</details>

### P2. Data changed

**Difficulty:** Easy · **Type:** PivotTable · **Concepts:** refresh

You corrected several sales figures in the source data, but the PivotTable still shows the old totals. What should you do?

- A) Delete and recreate the PivotTable
- B) Type the new totals into the PivotTable
- C) Refresh the PivotTable
- D) Save and reopen the file

<details>
<summary>Answer</summary>

**Answer:** C) Refresh the PivotTable

PivotTables update only when refreshed (right-click → Refresh, or Alt + F5).

</details>

### P3. Average marks

**Difficulty:** Medium · **Type:** PivotTable · **Concepts:** average, result interpretation

Students sheet: CSE marks 82, 38, 74; ECE marks 45, 91, 29; MECH marks 67, 55. A PivotTable has Department in Rows and Average of Marks in Values. Which department has the highest average, and what is it?

- A) ECE, 55
- B) MECH, 61
- C) CSE, 64.67
- D) CSE, 194

<details>
<summary>Answer</summary>

**Answer:** C) CSE, 64.67

CSE: 194 ÷ 3 = 64.67; ECE: 165 ÷ 3 = 55; MECH: 122 ÷ 2 = 61. 194 is CSE's sum, not its average.

</details>

### P4. Subtotals

**Difficulty:** Medium · **Type:** PivotTable · **Concepts:** subtotal, rows area

Region and Product are both in Rows (Region first). The PivotTable shows North with Laptop 136000 and Mobile 91000. What value appears on the North row itself, and what is it called?

<details>
<summary>Answer</summary>

227000 — the **subtotal** for North (136000 + 91000). The outer field in Rows gets a subtotal for each of its items; Design → Subtotals controls where it appears or hides it.

</details>

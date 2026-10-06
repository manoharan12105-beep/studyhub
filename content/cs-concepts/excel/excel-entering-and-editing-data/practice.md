# Entering and Editing Data — Practice

### P1. Continue the series

**Difficulty:** Easy · **Type:** Scenario · **Concepts:** AutoFill

A2 contains `Jan`. You drag the fill handle from A2 down to A5. What do A3, A4 and A5 show?

- A) Jan, Jan, Jan
- B) Feb, Mar, Apr
- C) Jan1, Jan2, Jan3
- D) Nothing — text cannot be filled

<details>
<summary>Answer</summary>

**Answer:** B) Feb, Mar, Apr

Month names are a built-in list, so AutoFill continues the series.

</details>

### P2. Keep the formatting

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** Delete vs Clear

You want to empty the Salary cells D2:D9 but keep their currency formatting for new values. What should you do?

- A) Select D2:D9 and press Delete
- B) Home → Clear → Clear All
- C) Right-click column D → Delete
- D) Home → Clear → Clear Formats

<details>
<summary>Answer</summary>

**Answer:** A) Select D2:D9 and press Delete

The Delete key removes contents only. Clear All would also remove the currency format; deleting column D removes the column itself; Clear Formats keeps the numbers and removes the format — the opposite of what is needed.

</details>

### P3. Results without formulas

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** Paste Special

Column E contains tax formulas such as `=D2*0.18`. You must send only the calculated amounts to a colleague, without formulas. What do you do?

<details>
<summary>Answer</summary>

Copy the range (Ctrl + C), then use **Paste Special → Values** (Ctrl + Alt + V, V, Enter) — either onto the same cells or into a new sheet. The cells then contain fixed numbers, so they no longer change or break if the source cells are missing.

</details>

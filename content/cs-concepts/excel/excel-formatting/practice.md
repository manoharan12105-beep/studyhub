# Formatting — Practice

### P1. Show as percentage

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** number format

A cell contains `0.75`. Which format makes it show `75%`?

- A) Currency
- B) Percentage
- C) Short Date
- D) Text

<details>
<summary>Answer</summary>

**Answer:** B) Percentage

Percentage format displays the value × 100 with a % sign. The stored value stays 0.75.

</details>

### P2. The "wrong" total

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** display vs value

B2:B4 each show `2`, but `=SUM(B2:B4)` shows `7`. Nothing is broken. What is the most likely explanation?

- A) SUM has a bug
- B) The cells store decimals (such as 2.4) and are formatted with 0 decimal places
- C) The cells are formatted as text
- D) Automatic calculation is turned off

<details>
<summary>Answer</summary>

**Answer:** B) The cells store decimals (such as 2.4) and are formatted with 0 decimal places

2.4 + 2.4 + 2.4 = 7.2, displayed as 7. Increase decimals to see the stored values.

</details>

### P3. Copy the look

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** Format Painter

You have formatted A1 (bold, blue fill, border). You want B1:F1 to look the same without changing their contents. What do you use?

- A) Copy and Paste
- B) Format Painter
- C) Merge & Center
- D) AutoFill

<details>
<summary>Answer</summary>

**Answer:** B) Format Painter

It copies only the formatting. Copy and Paste would also overwrite the contents.

</details>

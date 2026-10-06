# Sort and Filter — Interview Questions

## Beginner

### Q1. What is the difference between sorting and filtering?

<details>
<summary>Answer</summary>

Sorting changes the order of the rows — for example, largest sales first — and every row stays visible. Filtering hides the rows that do not meet a condition — for example, only the North region — without changing the order. Neither deletes data: clearing a filter shows all rows again, and a sort can be redone in a different order.

</details>

### Q2. How do you sort by more than one column?

<details>
<summary>Answer</summary>

Use Data → Sort, choose the first column and order, then **Add Level** for the next one. For example, sort by Region A to Z, then by Sales Largest to Smallest: all North rows come first, ordered by sales, then all South rows. The second level only orders rows that are equal on the first.

</details>

## Intermediate

### Q3. What goes wrong if you select only one column and sort it?

<details>
<summary>Answer</summary>

If you continue with the current selection, only that column is reordered; the other columns stay where they were, so values are separated from their rows (a sales figure ends up next to the wrong product). Excel warns with a Sort Warning — choose **Expand the selection**. The safe habit is to click one cell in the column and sort, letting Excel detect the whole list.

</details>

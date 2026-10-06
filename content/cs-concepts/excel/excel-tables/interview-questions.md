# Excel Tables — Interview Questions

## Beginner

### Q1. What is an Excel Table, and how is it different from a normal range?

<details>
<summary>Answer</summary>

An Excel Table (Insert → Table, or Ctrl + T) is a range that Excel manages as one named object. Compared with a normal range it has automatic filter buttons on the headers, a consistent banded style, automatic expansion when you add rows or columns next to it, formulas that fill the whole column, and an optional Total Row. A normal range has none of these unless you set them up by hand.

</details>

## Intermediate

### Q2. Why is a Table a good source for a PivotTable or chart?

<details>
<summary>Answer</summary>

Because the Table grows when new rows are added. A PivotTable built on a Table picks up the new rows the next time it is refreshed, and a chart built on a Table updates automatically. With a fixed range such as `A1:D13`, new rows below it are silently left out until someone changes the source range.

</details>

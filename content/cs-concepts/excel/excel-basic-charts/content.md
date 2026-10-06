# Basic Charts

**Module:** Visualization · **Test priority:** Core

## What Is It?

A **chart** draws numbers as a picture so that comparisons, trends and shares can be seen at a glance. Excel builds a chart from the cells you select, and the chart updates when those cells change.

The skill tests check is **choosing the right chart type** for the question.

## Selecting the Data

A chart plots exactly what you select, so first prepare a small summary with **labels** in one column and **numbers** next to it, including the header row. From the Sales sheet:

| Month | Total Sales |
|---|---|
| Jan | 160000 |
| Feb | 163000 |
| Mar | 172000 |

| Product | Total Sales |
|---|---|
| Laptop | 293000 |
| Mobile | 202000 |

(These totals come from `SUM` formulas or, faster, a [PivotTable](../excel-pivottable-fundamentals/content.md).)

Then:

1. Select the labels and numbers with their headers (e.g. A1:B4).
2. **Insert → Charts** and pick a type, or **Insert → Recommended Charts** to let Excel suggest one.
3. Shortcut: **Alt + F1** inserts the default chart (a column chart) on the same sheet.

Once the chart is selected, the **+** button beside it adds or removes **Chart Elements** — chart title, axis titles, data labels and legend — and the **Chart Design** tab has Change Chart Type and Switch Row/Column.

> [!WARNING]
> Do not include a total row in the selection. A "Total" bar or slice next to the parts that make it up distorts the chart.

## Choosing a Chart Type

| Chart | Looks like | Best for | Sales example |
|---|---|---|---|
| **Column** | Vertical bars | Comparing a few categories | Total sales by product (Laptop vs Mobile) |
| **Bar** | Horizontal bars | Comparing categories, especially many or with long names | Total salary by department; sales by region |
| **Line** | Points joined by a line | Trend over time (months, years) | Monthly sales Jan → Mar |
| **Pie** | Slices of a circle | Parts of one whole, few categories | Each product's share of total sales |

### Column Chart

Compares values across categories with vertical bars. Laptop (293000) vs Mobile (202000) is instantly visible. It is the default and the safest general choice for comparisons.

### Bar Chart

The same idea turned sideways. Horizontal bars leave room for long labels and many categories, so use it for comparisons such as department totals or a list of 10 cities.

### Line Chart

Joins values in time order, so the **slope** shows the trend. Monthly sales of 160000 → 163000 → 172000 show steady growth. Use it whenever the horizontal axis is time.

### Pie Chart

Shows how one total is split. Laptop is 293000 ÷ 495000 ≈ 59.2% and Mobile ≈ 40.8% of total sales. Add **Data Labels** with percentages to make it readable.

A pie chart is appropriate only when:

- there is **one** series of numbers,
- the parts add up to a meaningful whole,
- there are only a few categories (about 5 or fewer),
- all values are positive.

**Quick check:** Your manager asks "How did sales change from January to March?" Which chart do you use?

<details>
<summary>Answer</summary>

A line chart — the question is about change over time, and the slope of the line shows the trend. A pie chart cannot show a trend.

</details>

## Common Mistakes

- Using a pie chart for monthly trends or for comparing many categories.
- Including the header in the wrong place or the total row, so Excel plots the total as another category.
- Charting raw transactions (12 rows) when the question needs totals — summarise first.
- Leaving the default title "Chart Title" or no axis meaning on a report chart.

## Key Takeaways

- Select labels + numbers (with headers), then Insert → Charts or **Alt + F1**.
- Column/Bar = compare categories (Bar for long labels or many items).
- Line = trend over time.
- Pie = share of one whole, few categories, one series.

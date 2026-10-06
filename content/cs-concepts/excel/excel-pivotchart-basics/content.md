# PivotChart Basics

**Module:** PivotTables · **Test priority:** Frequently tested

## What Is It?

A **PivotChart** is a chart connected to a PivotTable. It draws whatever the PivotTable currently summarises, and it changes whenever the PivotTable changes.

```text
Raw data (Sales sheet, 12 rows)
        ↓
PivotTable (Sum of Sales by Product and Region)
        ↓
PivotChart (the same summary as a column chart)
```

## Why PivotCharts Are Useful

- **No separate summary to build.** An ordinary chart needs a small table of totals first; a PivotChart uses the PivotTable's totals directly.
- **Stays in sync.** Rearranging, filtering or refreshing the PivotTable redraws the chart.
- **Interactive.** Field buttons on the chart filter it directly — useful in meetings ("show only South").

## PivotTable vs PivotChart vs Normal Chart

| | PivotTable | PivotChart | Normal chart |
|---|---|---|---|
| Shows | Numbers in a grid | A picture of the PivotTable | A picture of fixed cells |
| Data comes from | Source list, summarised | Its PivotTable | The cells you selected |
| Filter by | Label drop-downs, Filters area | Field buttons on the chart, or the PivotTable | Change the selected cells |
| Updates when | You refresh | Its PivotTable changes or refreshes | The selected cells change |

A PivotChart always has a PivotTable behind it; creating a PivotChart from raw data with Insert → PivotChart creates both.

## Creating a Basic PivotChart

1. Build the PivotTable: Product in Rows, Region in Columns, Sum of Sales in Values.
2. Click inside the PivotTable → **PivotTable Analyze → PivotChart**.
3. Choose **Column → Clustered Column** → OK.

The chart shows Laptop and Mobile on the horizontal axis, with one bar per region (a North bar and a South bar for each product) and a legend for North and South:

| Sum of Sales | North | South |
|---|---|---|
| Laptop | 136000 | 157000 |
| Mobile | 91000 | 111000 |

## Filtering a PivotChart

The chart shows **field buttons** — drop-downs labelled with the field names (Product, Region, and any field in Filters). Open one and untick items exactly as in the PivotTable.

Example: open the **Region** button and keep only **South**. The chart now shows only the South bars (Laptop 157000, Mobile 111000) — and the PivotTable is filtered to South as well, because they share the same filter.

## How the PivotChart Follows the PivotTable

| You change the PivotTable | The PivotChart |
|---|---|
| Swap Region from Columns to Rows | Redraws with the new layout |
| Put Month in Filters and choose Mar | Shows March only (Laptop 99000, Mobile 73000 when Region is removed from Columns) |
| Change Sum to Average in Value Field Settings | Plots averages |
| Edit source data and **Refresh** | Redraws with the new numbers |

**Quick check:** You filter the PivotChart's Product button to Laptop only. What happens to the PivotTable?

<details>
<summary>Answer</summary>

It is filtered to Laptop too. A PivotChart and its PivotTable share fields and filters, so a change in either one appears in both.

</details>

## Choosing a Suitable Chart Type

The rules from [Basic Charts](../excel-basic-charts/content.md) still apply. Choose the PivotTable layout to match the chart:

| Question | PivotTable layout | Chart |
|---|---|---|
| Compare products across regions | Product in Rows, Region in Columns | Clustered Column |
| Monthly sales trend | Month in Rows, Sum of Sales in Values | Line |
| Share of total sales by product | Product in Rows, Sum of Sales in Values, nothing in Columns | Pie |
| Employees per department | Department in Rows, Count of Name in Values | Column or Bar |

A pie chart can show only one series, so remove any field from Columns before choosing Pie. Some chart types, such as Scatter, are not available for PivotCharts.

## Common Mistakes

- Choosing Pie while a field sits in Columns — only the first series is drawn.
- Forgetting that filtering the chart also filters the PivotTable (and the other way round).
- Expecting new source data to appear without refreshing the PivotTable.
- Deleting the PivotTable while keeping the chart — the chart loses its connection and stops updating.

## Key Takeaways

- A PivotChart is a chart linked to a PivotTable: raw data → PivotTable → PivotChart.
- Create it with PivotTable Analyze → PivotChart.
- Field buttons on the chart filter both the chart and the PivotTable.
- Pick the layout that fits the chart: categories in Rows for column/bar, months in Rows for line, one series for pie.

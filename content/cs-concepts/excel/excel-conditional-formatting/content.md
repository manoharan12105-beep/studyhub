# Conditional Formatting

**Module:** Data Handling · **Test priority:** Core

## What Is It?

**Conditional formatting** formats cells automatically **based on their values** — for example, marks below 40 turn red. When a value changes, the formatting updates by itself, which is the difference from colouring cells by hand.

Find it at **Home → Conditional Formatting**. Select the cells first, then choose a rule.

## When It Is Useful

- Spotting problems quickly: failing marks, low attendance, overdue dates.
- Spotting extremes: the highest and lowest sales.
- Catching data-entry errors: duplicate employee IDs.
- Showing patterns in numbers at a glance: colour scales and data bars.

## Highlight Cells Rules

Home → Conditional Formatting → **Highlight Cells Rules**:

| Rule | Example | Highlights |
|---|---|---|
| **Greater Than** | Salary (Employees D2:D9) > 50000 | 65000, 72000, 51000, 58000 |
| **Less Than** | Marks (Students C2:C9) < 40 | 38 (Meena), 29 (Vijay) |
| **Between** | Marks between 40 and 60 | 45, 55 |
| **Equal To** | Department = `CSE` | The three CSE cells |
| **Text that Contains** | City contains `bad` | Hyderabad (twice) |
| **A Date Occurring** | Due dates: Yesterday, This Week, Last Month… | Matching dates |
| **Duplicate Values** | Repeated employee IDs | Every copy of a repeated value |

Each rule opens a small dialog: type the value (or click a cell holding it) and pick a format such as **Light Red Fill with Dark Red Text**.

> [!WARNING]
> "Greater Than" and "Less Than" are strict. Marks **Less Than 40** does not highlight a mark of exactly 40. Use **Between** or a custom rule if the boundary should be included.

### Duplicate Values

An ID column after a copy-paste error:

| Emp ID |
|---|
| E101 |
| E102 |
| E103 |
| E102 |
| E104 |

Select the column → Highlight Cells Rules → **Duplicate Values** → both `E102` cells are highlighted. This only *marks* duplicates; [Remove Duplicates](../excel-find-replace-and-cleanup/content.md) deletes them.

**Quick check:** A rule highlights Marks Less Than 40 in red. You correct Meena's mark from 38 to 48. What happens to the red fill?

<details>
<summary>Answer</summary>

It disappears automatically — 48 no longer meets the rule. Conditional formatting re-checks the values every time they change; manual colouring would stay red until someone removed it.

</details>

## Top/Bottom Rules

**Top 10 Items**, **Top 10%**, **Bottom 10 Items**, **Above Average**, **Below Average**. The number is adjustable: Top **3** Items on the Sales column highlights 55000, 52000 and 50000.

## Color Scales and Data Bars

These show the size of every value, not just whether it meets one condition.

| Type | What it shows | Example on Sales (D2:D13) |
|---|---|---|
| **Color Scales** | Each cell shaded on a colour gradient | Green–Yellow–Red: 55000 darkest green, 28000 darkest red |
| **Data Bars** | A bar inside each cell, longer for larger values | 55000 has the longest bar |
| **Icon Sets** | Arrows, traffic lights or flags by value range | Awareness only |

## Managing Rules

- **Clear Rules → Clear Rules from Selected Cells / Entire Sheet** removes conditional formats.
- **Manage Rules** lists, edits and deletes rules.
- Pressing **Delete** on a cell does **not** remove its conditional formatting — only its value.

## Common Mistakes

- Selecting the wrong range (or the header) before adding a rule.
- Forgetting that Greater Than / Less Than exclude the boundary value.
- Colouring cells by hand and calling it conditional formatting — manual colours do not update.
- Adding many overlapping rules over time; check Manage Rules when colours look wrong.

## Key Takeaways

- Conditional formatting formats cells by their values and updates automatically.
- Highlight Cells Rules: Greater Than, Less Than, Between, Equal To, Text that Contains, Duplicate Values.
- Top/Bottom Rules find extremes; Color Scales and Data Bars show every value's size.
- Duplicate Values highlights; Remove Duplicates deletes.

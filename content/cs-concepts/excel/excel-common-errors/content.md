# Common Excel Errors

**Module:** Common Errors · **Test priority:** Core

## What Is It?

When a formula cannot produce a valid result, Excel shows an **error value** that starts with `#`. Each error names a different problem, so recognising it tells you where to look.

| Error | Meaning in one line |
|---|---|
| `#DIV/0!` | Division by zero or by an empty cell |
| `#VALUE!` | Wrong type of value, usually text where a number is needed |
| `#REF!` | The formula refers to a cell that no longer exists |
| `#NAME?` | Excel does not recognise a name in the formula |
| `#N/A` | A value was looked for and not found |

Click the error cell: a small warning icon appears beside it, and its menu explains the error and offers help.

## #DIV/0!

| | |
|---|---|
| **Example** | `=10/0` → `#DIV/0!` |
| **Why** | The divisor is 0 or an **empty** cell (Excel treats empty as 0 in arithmetic). `=AVERAGE` of a range with no numbers also gives `#DIV/0!`. |
| **Fix** | Enter the missing divisor, or test it first: `=IF(D2=0,"",C2/D2)` shows an empty result until D2 has a value. |

Typical case: Marks per hour `=C2/D2` where some students have no hours entered yet.

## #VALUE!

| | |
|---|---|
| **Example** | A1 contains the text `Ten`; `=A1*2` → `#VALUE!` |
| **Why** | An arithmetic operator received text it cannot turn into a number — text typed into a number column, a stray space, or `N/A` typed by hand. |
| **Fix** | Replace the text with a number, or correct the data type (see [Entering and Editing Data](../excel-entering-and-editing-data/content.md)). |

Note the difference: with `Ten` in A1 and `5` in A2, `=A1+A2` returns `#VALUE!`, but `=SUM(A1:A2)` returns 5, because `SUM` ignores text in a range. No error does not always mean a correct total.

## #REF!

| | |
|---|---|
| **Example** | D2 contains `=B2*C2`. You delete column C. D2 (now C2) shows `=B2*#REF!` → `#REF!` |
| **Why** | The formula pointed to a cell that was deleted (a row, column or sheet removed), or a copied formula moved off the edge of the sheet. |
| **Fix** | Press **Ctrl + Z** straight away to undo the deletion; otherwise rewrite the formula with the correct reference. **Clear** contents instead of deleting cells that formulas use. |

## #NAME?

| | |
|---|---|
| **Example** | `=SUMM(C2:C9)` → `#NAME?` |
| **Why** | A misspelled function name (`=SUMM`, `=AVERGE`) or text without double quotes (`=IF(C2>=50,Pass,Fail)`), so Excel looks for a name that does not exist. |
| **Fix** | Correct the spelling — typing a function name shows a suggestion list to pick from; put text in double quotes. |

## #N/A

| | |
|---|---|
| **Example** | `=VLOOKUP("E999",A2:E9,4,FALSE)` on the Employees sheet → `#N/A` |
| **Why** | A lookup function (`VLOOKUP`, `XLOOKUP`, `MATCH`) could not find the value — the ID does not exist, is spelled differently, or has an extra space. |
| **Fix** | Check that the value really exists and matches exactly (spaces, spelling, number stored as text). If "not found" is a valid outcome, decide what to show instead. |

Lookup functions are beyond this module; recognise that `#N/A` means "not found".

> [!NOTE]
> `#####` is **not** an error. It means the column is too narrow to display the number or date. Double-click the right edge of the column heading to widen it.

**Quick check:** C2 = 500 and D2 is empty. What does `=C2/D2` show, and what does `=C2+D2` show?

<details>
<summary>Answer</summary>

`=C2/D2` → `#DIV/0!`, because the empty cell counts as 0 in the division. `=C2+D2` → 500, because adding 0 is fine.

</details>

## Error vs Blank vs Zero

| Cell shows | What it means | Effect on `=SUM` of the column |
|---|---|---|
| *(blank)* | Nothing entered | Ignored |
| `0` | A real value of zero | Adds 0; counted by `COUNT` and `AVERAGE` |
| `#DIV/0!` (any error) | A formula failed | `SUM` returns the same error |

Errors **spread**: if one cell in C2:C9 shows `#DIV/0!`, `=SUM(C2:C9)` also shows `#DIV/0!`. Fix the first error in the chain and the others disappear.

> [!TIP]
> Do not hide errors by typing over them. Find the cause — the error is telling you something is wrong with the data or the formula.

## Common Mistakes

- Deleting rows or columns that other formulas use, creating `#REF!`.
- Typing `N/A` or `-` into number columns, causing `#VALUE!` later.
- Treating `#####` as an error.
- Assuming a formula with no error is correct — `SUM` silently skips text values.

## Key Takeaways

- `#DIV/0!` divide by zero/empty · `#VALUE!` wrong type · `#REF!` deleted reference · `#NAME?` unknown name or missing quotes · `#N/A` not found.
- Blank = nothing; 0 = a value; error = a failed formula, and errors spread to formulas that use them.
- `#####` = column too narrow.
- Ctrl + Z immediately after a deletion is the quickest `#REF!` fix.

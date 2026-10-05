# awk — Interview Questions

## Beginner

### Q1. How do you print the first column of a file with awk?

<details>
<summary>Answer</summary>

`awk '{print $1}' file`. By default fields are separated by runs of whitespace; use `-F,` (or another separator) for CSV and similar files.

</details>

### Q2. What are `NR` and `NF`?

<details>
<summary>Answer</summary>

`NR` is the current record (line) number across all input; `NF` is the number of fields in the current record. `$NF` is the last field and `$(NF-1)` the one before it. `FNR` is the line number within the current file.

</details>

### Q3. How do you sum a column with awk?

<details>
<summary>Answer</summary>

`awk '{sum += $3} END {print sum}' file` — accumulate in the main action, print in `END`. Add `NR > 1` as a pattern to skip a header, and `-F,` for CSV.

</details>

### Q4. What are `BEGIN` and `END` blocks?

<details>
<summary>Answer</summary>

`BEGIN { … }` runs once before any input is read (print headers, set `FS`/`OFS`, initialise variables). `END { … }` runs once after all input (print totals, averages, arrays).

</details>

## Intermediate

### Q5. Print the lines where the third column is greater than 100.

<details>
<summary>Answer</summary>

`awk '$3 > 100' file` — a pattern without an action prints the line. If the file has a header, add `NR > 1 &&`, because a non-numeric field is compared as a string.

</details>

### Q6. How do you count occurrences of each value in a column?

<details>
<summary>Answer</summary>

With an associative array: `awk '{count[$1]++} END {for (k in count) print k, count[k]}' file | sort -k2 -nr`. The equivalent pipeline is `awk '{print $1}' file | sort | uniq -c | sort -rn`.

</details>

### Q7. Why use awk instead of `cut` on `ps` or `df` output?

<details>
<summary>Answer</summary>

Those commands align columns with varying numbers of spaces. `cut -d' '` treats every single space as a separator and produces empty or shifted fields; awk's default splitting treats any run of whitespace as one separator and ignores leading spaces, so `$2` is reliably the second column.

</details>

### Q8. How do you pass a shell variable into an awk program?

<details>
<summary>Answer</summary>

`awk -v threshold="$limit" '$3 > threshold' file`. Embedding it with double quotes (`awk "\$3 > $limit"`) is fragile and can break or inject code if the value contains special characters.

</details>

### Q9. Print the last field of every line.

<details>
<summary>Answer</summary>

`awk '{print $NF}' file`. `NF` holds the number of fields, so `$NF` refers to the last one, whatever the line length.

</details>

## Advanced

### Q10. Compute the average response time per endpoint from a log where field 7 is the path and the last field is the time in ms.

<details>
<summary>Answer</summary>

```bash
# Illustrative
awk '{sum[$7] += $NF; n[$7]++}
     END {for (p in sum) printf "%-30s %8.1f ms\n", p, sum[p] / n[p]}' access.log | sort -k2 -nr
```

Two arrays keyed by path accumulate totals and counts; `END` prints the averages, sorted slowest first.

</details>

### Q11. How do you remove duplicate lines while preserving order?

<details>
<summary>Answer</summary>

`awk '!seen[$0]++' file`. For each line, `seen[$0]++` returns the previous count (0 the first time), so `!` is true only for the first occurrence. Unlike `sort -u`, the original order is kept.

</details>

### Q12. How would you join two files on a common key with awk?

<details>
<summary>Answer</summary>

```bash
# Illustrative: users.txt "id name", orders.txt "id amount"
awk 'NR == FNR {name[$1] = $2; next} $1 in name {print $1, name[$1], $2}' users.txt orders.txt
```

While reading the first file `NR == FNR`; it is loaded into an array and `next` skips the rest. For the second file, lines whose key exists in the array are printed with the joined value. (`join` does the same for sorted files.)

</details>

# awk: Fields, Patterns and Reports

**Module:** find, sed and awk · **Interview priority:** Core

## What Is It?

`awk` is a small programming language for processing text organised in **records** (lines) and **fields** (columns). For every line of input it checks **patterns** and runs the matching **actions**:

```text
awk 'pattern { action }' file

awk -F, '$4 > 60000 { print $2, $4 }' employees.csv
     │   └──┬─────┘   └──────┬──────┘
     │   pattern (condition)  action: runs for lines where the pattern is true
     field separator: comma
```

- A missing pattern means "every line"; a missing action means "print the line".
- `BEGIN { … }` runs before the first line, `END { … }` after the last — for headers, totals and averages.

## Why It Matters

- It handles whitespace-aligned output (`ps`, `df`, `ls -l`, logs) where `cut` fails.
- It filters **and** computes: sums, averages, counts per group, maximums — reports that would otherwise need a script.
- Interviewers love awk one-liners: print a column, sum a column, count by value, filter by a numeric condition.

## Core Concept

### Records and fields

| Variable | Meaning |
|----------|---------|
| `$0` | The whole current line (record) |
| `$1`, `$2`, … | Fields 1, 2, … |
| `NF` | Number of fields on this line; `$NF` is the **last** field, `$(NF-1)` the second last |
| `NR` | Number of the current record (line) across all input |
| `FNR` | Record number within the current file |
| `FS` | Input field separator (default: runs of spaces/tabs; `-F,` sets it) |
| `OFS` | Output field separator used between `print` arguments (default: one space) |
| `FILENAME` | Name of the current input file |

By default, awk splits on **any run of whitespace** and ignores leading spaces — exactly what aligned command output needs.

### Patterns

| Pattern | Selects lines where |
|---------|---------------------|
| `/regex/` | The line matches the regex |
| `$3 == "ERROR"` | Field 3 equals the string |
| `$4 > 60000` | Field 4 is numerically greater |
| `$1 ~ /^192\./` | Field 1 matches a regex (`!~` = does not match) |
| `NR > 1` | Line number greater than 1 (skip a header) |
| `NR == 3`, `NR >= 2 && NR <= 4` | Specific lines or ranges |
| `/start/, /end/` | From a line matching `start` to one matching `end` |
| `BEGIN` / `END` | Before input / after input |

Combine with `&&`, `||`, `!`.

### Actions

Statements look like C: `print`, `printf`, assignments, `if`/`else`, `for`, `while`. Variables need no declaration and start as 0 or empty. **Associative arrays** (`count[$3]++`) group values by key.

| Statement | Does |
|-----------|------|
| `print $1, $3` | Print fields separated by `OFS` |
| `print $1 $3` | Print fields concatenated (no space) |
| `printf "%-10s %5d\n", $1, $2` | Formatted output (no automatic newline) |
| `sum += $4` | Accumulate |
| `count[$3]++` | Count per key |
| `for (k in arr) print k, arr[k]` | Loop over an array (order is unspecified) |

Useful functions: `length()`, `toupper()`, `tolower()`, `substr(s, start, len)`, `split(s, arr, sep)`, `sub(/re/, "new")`, `gsub(/re/, "new")`, `int()`.

## Commands

### Print fields

```bash
awk '{print $1}' access.log | head -n 3
awk '{print $3, $4}' app.log | head -n 3
```

**Output:**

```text
192.168.1.10
192.168.1.11
192.168.1.10
INFO [main]
INFO [main]
WARN [db]
```

Remember `app.log` has two spaces after `INFO` — awk does not care, because it splits on runs of whitespace (`cut -d' '` would give empty fields).

Line numbers, field counts and the last field:

```bash
awk '{print NR": "$0}' list1.txt
awk '{print NF, $NF}' notes.txt
```

**Output:**

```text
1: apple
2: banana
3: cherry
4: mango
4 kernel.
5 linux.
4 commands.
5 shell.
7 software.
```

### A different separator: `-F`

```bash
awk -F, 'NR > 1 {print $2, $4}' employees.csv | head -n 3
```

**Output:**

```text
asha 85000
ravi 52000
meena 92000
```

`-F=` for `key=value` files, `-F:` for `/etc/passwd`, `-F'\t'` for TSV. A regex works too: `-F'[][]'` splits on `[` or `]`.

### Filter with patterns

```bash
awk '/ERROR/ {print $2, $4}' app.log
awk '$9 == 404 {print $1, $7}' access.log
awk -F, 'NR > 1 && $3 == "sales" {print $2}' employees.csv
```

**Output:**

```text
09:15:42 [db]
10:30:00 [payment]
10:30:01 [payment]
192.168.1.12 /missing.html
192.168.1.11 /favicon.ico
ravi
fatima
karan
```

Numeric conditions — and why `NR > 1` matters:

```bash
awk -F, '$4 > 60000 {print $2, $4}' employees.csv
```

**Output:**

```text
name salary
asha 85000
meena 92000
fatima 61000
arjun 78000
```

The header slipped through: `"salary"` is not a number, so awk compared it **as a string** with `"60000"`, and `"s"` sorts after `"6"`. Add `NR > 1` to skip the header.

### Calculate: sums, averages, maximums

```bash
awk -F, 'NR > 1 {sum += $4} END {print "total:", sum}' employees.csv
awk -F, 'NR > 1 {sum += $4; n++} END {printf "average: %.2f\n", sum / n}' employees.csv
awk -F, 'NR > 1 && $4 > max {max = $4; who = $2} END {print who, max}' employees.csv
```

**Output:**

```text
total: 511000
average: 63875.00
meena 92000
```

Total bytes served from the access log:

```bash
awk '{bytes += $10} END {print bytes " bytes in " NR " requests"}' access.log
```

**Output:**

```text
9798 bytes in 10 requests
```

### Group with associative arrays

Count per department:

```bash
awk -F, 'NR > 1 {count[$3]++} END {for (d in count) print d, count[d]}' employees.csv | sort
```

**Output:**

```text
engineering 3
hr 2
sales 3
```

Average salary per department, formatted:

```bash
awk -F, 'NR > 1 {total[$3] += $4; n[$3]++}
         END {for (d in total) printf "%-12s %8.1f\n", d, total[d] / n[d]}' employees.csv | sort
```

**Output:**

```text
engineering   85000.0
hr            49000.0
sales         52666.7
```

`for (k in arr)` visits keys in no particular order — pipe into `sort` for stable output. Unlike bash arithmetic, awk uses floating point, so averages keep their decimals.

Requests per HTTP status, without `sort | uniq -c`:

```bash
awk '{status[$9]++} END {for (s in status) print s, status[s]}' access.log | sort
```

**Output:**

```text
200 6
302 1
404 2
500 1
```

### BEGIN, END and formatting

```bash
awk 'BEGIN {print "IP              STATUS"} {printf "%-15s %s\n", $1, $9} END {print "---", NR, "rows"}' access.log | head -n 4
```

**Output:**

```text
IP              STATUS
192.168.1.10    200
192.168.1.11    200
192.168.1.10    302
```

Changing the output separator:

```bash
awk -F, 'BEGIN {OFS=" | "} NR > 1 {print $2, $5}' employees.csv | head -n 3
```

**Output:**

```text
asha | chennai
ravi | mumbai
meena | bengaluru
```

### Shell variables into awk: `-v`

```bash
awk -v limit=50000 -F, 'NR > 1 && $4 < limit {print $2}' employees.csv
```

**Output:**

```text
john
karan
```

Never splice shell variables into the awk program text with double quotes; pass them with `-v`.

## Examples

### Config file to "key -> value"

```bash
awk -F= '!/^#/ {print $1 " -> " $2}' config/app.conf
```

**Output:**

```text
app.name -> inventory
app.port -> 8080
app.env -> dev
db.host -> localhost
db.port -> 5432
log.level -> INFO
```

### Count log lines per component

```bash
awk -F'[][]' '{print $2}' app.log | sort | uniq -c
```

**Output:**

```text
      4 db
      3 http
      3 main
      2 payment
```

### Remove duplicates but keep the original order

```bash
awk '!seen[$0]++' fruits.txt
```

**Output:**

```text
banana
apple
cherry
mango
```

`seen[$0]++` is 0 (false) the first time a line appears and positive afterwards; `!` prints only first occurrences. `sort -u` would reorder the lines.

### Real command output

```bash
# Illustrative
df -h | awk 'NR > 1 && int($5) > 80 {print $6, $5}'          # filesystems above 80 %
ps aux | awk '$3 > 50 {print $2, $3, $11}'                     # processes above 50 % CPU
awk -F: '$3 >= 1000 && $3 < 65534 {print $1}' /etc/passwd      # human users
ls -l | awk 'NR > 1 {sum += $5} END {print sum " bytes"}'      # total size of listed files
```

## Comparison

### awk vs cut

| | `cut` | `awk` |
|---|---|---|
| Separator | One fixed character | Runs of whitespace (default), any string or regex |
| Reorder or repeat fields | No | Yes |
| Last field | No | `$NF` |
| Conditions and maths | No | Yes |
| Best for | Simple CSV columns, character ranges | Everything else |

### awk vs sed vs grep

| | `grep` | `sed` | `awk` |
|---|---|---|---|
| Thinks in | Lines | Lines | Records and fields |
| Main strength | Finding lines | Editing text | Extracting and computing |
| Example | `grep 404 access.log` | `sed 's/404/NOT FOUND/'` | `awk '$9 == 404 {n++} END {print n}'` |

## Common Mistakes

- Double quotes around the program: `awk "{print $2}"` — the shell replaces `$2` first. Use single quotes.
- Forgetting `-F,` for CSV files (the default separator is whitespace).
- Comparing numbers when the field is text (headers) — skip it with `NR > 1`.
- `print $1 $2` (concatenated) when `print $1, $2` (separated) was meant.
- Expecting `for (k in arr)` to return keys in insertion or sorted order.
- Using awk on real CSV with quoted commas (`"Mumbai, MH"`) — use a CSV-aware tool.

## Key Takeaways

- `awk 'pattern {action}'`: for each line, if the pattern is true, run the action.
- `$0` line, `$1…` fields, `$NF` last field, `NF` field count, `NR` line number, `-F` separator, `OFS` output separator.
- Patterns: `/regex/`, `$3 == "x"`, `$4 > 100`, `NR > 1`, ranges; `BEGIN`/`END` for setup and totals.
- Arrays group data: `count[$3]++`, `sum[$3] += $4`; awk uses floating point.
- Pass shell values with `-v name=value`; quote the program in single quotes.

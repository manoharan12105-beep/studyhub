# cut, tr and paste

**Module:** Text Processing · **Interview priority:** Frequently asked

## What Is It?

Three small tools that reshape text:

| Command | Does | Think of it as |
|---------|------|----------------|
| `cut` | Extracts columns (fields) or character positions from each line | Selecting columns |
| `tr` | Translates, squeezes or deletes **characters** | Find-and-replace for single characters |
| `paste` | Joins lines of files side by side, or joins all lines of one file | Gluing columns together |

## Why It Matters

- Logs and CSV files are columns of text. `cut` pulls out the column you need for a pipeline (`cut -d' ' -f1 access.log` → IPs).
- `tr` fixes data: Windows line endings, case, separators, repeated spaces.
- They appear constantly in interview one-liners together with `sort`, `uniq` and `wc`.

## Commands

### cut

**Purpose:** print selected parts of each line.

**Syntax:**

```text
cut -d DELIM -f FIELDS [file ...]
cut -c POSITIONS [file ...]
```

| Option | Meaning |
|--------|---------|
| `-d ','` | Field delimiter — a **single** character (default: tab) |
| `-f 2` | Field 2; `-f 2,4` fields 2 and 4; `-f 2-4` fields 2 to 4; `-f 3-` from 3 to the end |
| `-c 1-10` | Characters 1 to 10 |
| `-s` | Skip lines that do not contain the delimiter |
| `--complement` | Everything except the selected fields (GNU) |
| `--output-delimiter=' '` | Use a different separator in the output (GNU) |

One column of a CSV:

```bash
cut -d, -f2 employees.csv | head -n 4
```

**Output:**

```text
name
asha
ravi
meena
```

Several columns and ranges:

```bash
cut -d, -f2,4 employees.csv | head -n 3
cut -d, -f3- employees.csv | head -n 2
```

**Output:**

```text
name,salary
asha,85000
ravi,52000
dept,salary,city
engineering,85000,chennai
```

`cut` always outputs fields in their original order: `-f4,2` prints field 2 before field 4. To reorder, use `awk`.

By character position — the date at the start of each log line:

```bash
cut -c1-10 app.log | head -n 2
```

**Output:**

```text
2026-01-15
2026-01-15
```

Values from a `key=value` file, skipping lines without `=`:

```bash
cut -s -d= -f2 config/app.conf
```

**Output:**

```text
inventory
8080
dev
localhost
5432
INFO
```

Without `-s`, the comment line (it has no `=`) would be printed unchanged — `cut` prints lines that lack the delimiter in full:

```bash
echo "no-delimiter-here" | cut -d= -f2
```

**Output:**

```text
no-delimiter-here
```

#### The repeated-space problem

In `app.log`, `INFO` and `WARN` are followed by **two** spaces, `ERROR` by one. `cut` treats every single space as a separator, so the "fourth field" is empty on some lines:

```bash
cut -d' ' -f4 app.log | head -n 5 | cat -A
```

**Output:**

```text
$
$
$
$
[db]$
```

Squeeze the spaces first with `tr -s ' '` (or use `awk`, which splits on runs of whitespace):

```bash
tr -s ' ' < app.log | cut -d' ' -f4 | head -n 5
```

**Output:**

```text
[main]
[main]
[db]
[http]
[db]
```

**Common mistake:** using `cut` on space-aligned output such as `ps` or `ls -l`. Columns are padded with varying numbers of spaces; use `awk '{print $2}'`.

### tr

**Purpose:** translate or delete characters. `tr` reads **only standard input** — it takes no filename.

**Syntax:**

```text
tr [options] SET1 [SET2]
```

| Form | Meaning |
|------|---------|
| `tr 'abc' 'xyz'` | Replace a→x, b→y, c→z (position by position) |
| `tr 'a-z' 'A-Z'` | Ranges |
| `tr '[:lower:]' '[:upper:]'` | Character classes (also `[:digit:]`, `[:space:]`, `[:alpha:]`, `[:punct:]`) |
| `tr -d 'chars'` | Delete those characters |
| `tr -s 'chars'` | Squeeze runs of a repeated character into one |
| `tr -c` | Complement: act on characters **not** in SET1 |

Change case:

```bash
echo "hello world" | tr '[:lower:]' '[:upper:]'
```

**Output:**

```text
HELLO WORLD
```

Character-by-character, not word-by-word:

```bash
echo "Hello World" | tr 'lo' 'xy'
```

**Output:**

```text
Hexxy Wyrxd
```

Every `l` became `x` and every `o` became `y`. `tr` cannot replace the word "lo"; use `sed` for strings.

Separators to newlines, squeezing, deleting:

```bash
echo "a,b,c" | tr ',' '\n'
echo "too    many     spaces" | tr -s ' '
echo "phone: 98-765-4321" | tr -d '-'
echo "phone: 98-765-4321" | tr -cd '0-9'; echo
```

**Output:**

```text
a
b
c
too many spaces
phone: 987654321
987654321
```

`-cd '0-9'` deletes everything that is **not** a digit (including the newline, hence the extra `echo`).

Remove Windows carriage returns:

```bash
printf 'line1\r\nline2\r\n' | tr -d '\r' | cat -A
```

**Output:**

```text
line1$
line2$
```

**Common mistake:** `tr 'a-z' 'A-Z' file` — `tr` does not accept files. Use `tr 'a-z' 'A-Z' < file`.

### paste

**Purpose:** merge lines of files side by side (separated by tabs by default).

| Option | Meaning |
|--------|---------|
| `-d ','` | Delimiter to use instead of tab |
| `-s` | Serial: join all lines of each file into one line |

```bash
paste list1.txt list2.txt
```

**Output:**

```text
apple   banana
banana  grape
cherry  mango
mango   orange
```

```bash
paste -d, list1.txt list2.txt
```

**Output:**

```text
apple,banana
banana,grape
cherry,mango
mango,orange
```

Join all lines into one comma-separated line — handy for building lists:

```bash
paste -sd, list1.txt
```

**Output:**

```text
apple,banana,cherry,mango
```

## Examples

### Count log levels

```bash
tr -s ' ' < app.log | cut -d' ' -f3 | sort | uniq -c
```

**Output:**

```text
      3 ERROR
      7 INFO
      2 WARN
```

### Reassemble columns

Pair each employee's name with their city:

```bash
cut -d, -f2 employees.csv > names.txt
cut -d, -f5 employees.csv > cities.txt
paste -d: names.txt cities.txt | head -n 3
```

**Output:**

```text
name:city
asha:chennai
ravi:mumbai
```

### IP and status of each request

```bash
cut -d' ' -f1,9 access.log | head -n 3
```

**Output:**

```text
192.168.1.10 200
192.168.1.11 200
192.168.1.10 302
```

## Comparison

### cut vs awk

| | `cut` | `awk` |
|---|---|---|
| Delimiter | One fixed character | Runs of whitespace by default, or any regex with `-F` |
| Reorder fields | No (original order) | Yes: `awk '{print $3, $1}'` |
| Conditions, calculations | No | Yes |
| Speed / simplicity | Very simple | Slightly more to type |
| Best for | CSV/TSV with single delimiters, fixed character positions | Whitespace-aligned output, anything with logic |

### tr vs sed

| | `tr` | `sed` |
|---|---|---|
| Works on | Single characters | Strings and regular expressions |
| Input | stdin only | Files or stdin |
| Example | `tr -d '\r'` | `sed 's/ERROR/FATAL/g' app.log` |

## Common Mistakes

- `cut -d ' '` on text with repeated spaces — empty fields appear. Squeeze with `tr -s ' '` or use `awk`.
- Expecting `cut -f3,1` to print field 3 first.
- Using a multi-character delimiter with `cut -d` — only one character is allowed.
- Passing a filename to `tr`.
- Using `tr` to replace words (`tr 'cat' 'dog'` maps c→d, a→o, t→g).
- Forgetting that `cut` prints lines without the delimiter unchanged (use `-s`).

## Key Takeaways

- `cut -d, -f2,4` selects fields; `-c1-10` selects characters; `-s` skips lines without the delimiter.
- `cut`'s delimiter is one character and fields keep their order; for whitespace columns use `awk`.
- `tr` maps, deletes (`-d`), squeezes (`-s`) and complements (`-c`) characters from stdin.
- `paste` joins files side by side; `paste -sd,` joins lines into one.

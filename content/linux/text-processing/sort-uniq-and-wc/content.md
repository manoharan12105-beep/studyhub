# sort, uniq and wc

**Module:** Text Processing · **Interview priority:** Core

## What Is It?

| Command | Does |
|---------|------|
| `sort` | Orders lines — alphabetically, numerically, by a chosen column, in reverse |
| `uniq` | Collapses **adjacent** duplicate lines; can count, or show only duplicates/unique lines |
| `wc` | Counts lines, words, bytes and characters |

Together they answer most "how many?" and "which is the most frequent?" questions about text.

## Why It Matters

- `sort | uniq -c | sort -rn` is the most famous Unix pipeline: frequency counts of anything — IPs, error codes, endpoints, users.
- `wc -l` is the quickest way to count log lines, CSV rows or files.
- Interview traps: `sort` sorts text not numbers by default, and `uniq` only removes duplicates that are next to each other.

## Commands

### sort

**Purpose:** sort lines of text files or standard input.

**Syntax:**

```text
sort [options] [file ...]
```

| Option | Meaning |
|--------|---------|
| `-n` | Numeric sort (`2` before `10`) |
| `-h` | Human-readable numeric sort (`512M` before `1.5G`) |
| `-r` | Reverse order |
| `-u` | Output only the first of equal lines (unique) |
| `-t ','` | Field separator (default: blanks) |
| `-k 3,3` | Sort key: from field 3 to field 3; `-k 4,4nr` adds per-key options |
| `-f` | Fold case (ignore upper/lower case) |
| `-o file` | Write the result to `file` (safe even when it is the input) |
| `-s` | Stable: keep the original order of equal lines |
| `-c` | Check whether the input is sorted |

Default sort is by text:

```bash
sort fruits.txt
```

**Output:**

```text
apple
apple
apple
banana
banana
cherry
mango
```

#### Text order vs numeric order

```bash
sort numbers.txt
```

**Output:**

```text
10
100
2
25
33
4
```

Text comparison goes character by character: `"100"` < `"2"` because `1` < `2`. For numbers, use `-n`:

```bash
sort -n numbers.txt
```

**Output:**

```text
2
4
10
25
33
100
```

Largest three:

```bash
sort -rn numbers.txt | head -n 3
```

**Output:**

```text
100
33
25
```

#### Sorting by a column

`-t` sets the separator and `-k` picks the key. Employees by salary (field 4), highest first:

```bash
tail -n +2 employees.csv | sort -t, -k4,4nr | head -n 3
```

**Output:**

```text
103,meena,engineering,92000,bengaluru
101,asha,engineering,85000,chennai
106,arjun,engineering,78000,mumbai
```

Always write the key as `-k4,4` (start and end field). `-k4` alone means "from field 4 to the end of the line", which matters when you sort by several keys.

Several keys — by department, then by salary descending within each department:

```bash
tail -n +2 employees.csv | sort -t, -k3,3 -k4,4nr
```

**Output:**

```text
103,meena,engineering,92000,bengaluru
101,asha,engineering,85000,chennai
106,arjun,engineering,78000,mumbai
107,divya,hr,50000,bengaluru
104,john,hr,48000,chennai
105,fatima,sales,61000,delhi
102,ravi,sales,52000,mumbai
108,karan,sales,45000,chennai
```

#### Human-readable sizes

```bash
printf '%s\n' 2G 512M 10K 1.5G | sort -h
```

**Output:**

```text
10K
512M
1.5G
2G
```

This is why `du -sh * | sort -h` lists directories by size.

#### Sorting in place

```bash
sort -o fruits.sorted fruits.txt
head -n 2 fruits.sorted
```

**Output:**

```text
apple
apple
```

`sort file > file` would empty the file (the shell truncates it first); `sort -o file file` is safe.

#### Case and locale

```bash
printf '%s\n' b B a A | sort
```

**Output (varies):**

```text
A
B
a
b
```

In the `C` / `C.UTF-8` locale, `sort` compares bytes, so uppercase letters come before lowercase. In a locale such as `en_US.UTF-8` the same command prints `a A b B`. For predictable results in scripts, set the locale explicitly: `LC_ALL=C sort`. `-f` ignores case.

**Common mistake:** sorting numbers without `-n`, or sorting a CSV by "column 2" without `-t,` (the default separator is whitespace).

### uniq

**Purpose:** filter **adjacent** repeated lines.

| Option | Meaning |
|--------|---------|
| `-c` | Prefix each line with its number of occurrences |
| `-d` | Print only lines that are repeated (one copy each) |
| `-u` | Print only lines that are not repeated |
| `-i` | Ignore case when comparing |

`uniq` alone does **not** remove all duplicates — only consecutive ones:

```bash
uniq fruits.txt
```

**Output:**

```text
banana
apple
cherry
apple
banana
mango
apple
```

Nothing changed, because no duplicate lines were next to each other. Sort first:

```bash
sort fruits.txt | uniq
```

**Output:**

```text
apple
banana
cherry
mango
```

(`sort -u fruits.txt` gives the same result in one command.)

Count each value:

```bash
sort fruits.txt | uniq -c
```

**Output:**

```text
      3 apple
      2 banana
      1 cherry
      1 mango
```

Only the duplicated values, then only the values that occur once:

```bash
sort fruits.txt | uniq -d
sort fruits.txt | uniq -u
```

**Output:**

```text
apple
banana
cherry
mango
```

**Common mistake:** `uniq file` without sorting — see above.

### wc

**Purpose:** count lines, words and bytes.

| Option | Counts |
|--------|--------|
| `-l` | Lines (newline characters) |
| `-w` | Words (whitespace-separated) |
| `-c` | Bytes |
| `-m` | Characters (differs from bytes for multi-byte UTF-8 text) |

```bash
wc notes.txt
```

**Output:**

```text
  5  25 147 notes.txt
```

Lines, words, bytes, name. Several files add a total:

```bash
wc -l app.log access.log
```

**Output:**

```text
  12 app.log
  10 access.log
  22 total
```

Bytes vs characters:

```bash
printf 'héllo' | wc -c
printf 'héllo' | wc -m
```

**Output:**

```text
6
5
```

`é` takes two bytes in UTF-8.

**Common mistake:** `wc -l` counts newline characters, so a last line without a trailing newline is not counted. Reading from stdin (`wc -l < file`) prints only the number, which is handier in scripts.

## Examples

### Frequency count: the classic pipeline

Employees per department, most first:

```bash
tail -n +2 employees.csv | cut -d, -f3 | sort | uniq -c | sort -rn
```

**Output:**

```text
      3 sales
      3 engineering
      2 hr
```

| Stage | Job |
|-------|-----|
| `tail -n +2` | Skip the header |
| `cut -d, -f3` | Keep the department column |
| `sort` | Put equal values next to each other |
| `uniq -c` | Count each group |
| `sort -rn` | Most frequent first |

### Is it already sorted?

```bash
sort -c numbers.txt
echo "status: $?"
```

**Output:**

```text
sort: numbers.txt:5: disorder: 100
status: 1
```

## Comparison

### sort -u vs uniq

| | `sort -u` | `uniq` |
|---|---|---|
| Removes | All duplicates (sorts first) | Only adjacent duplicates |
| Output order | Sorted | Original order kept |
| Counting | No | `-c` |
| Show only duplicates / singles | No | `-d` / `-u` |

### wc options

| Question | Command |
|----------|---------|
| How many lines? | `wc -l` |
| How many words? | `wc -w` |
| File size in bytes? | `wc -c` (or `stat -c %s`) |
| How many characters (UTF-8)? | `wc -m` |

## Common Mistakes

- `sort` on numbers without `-n` (`100` before `2`).
- `uniq` without `sort` first.
- `-k2` instead of `-k2,2` when a key should be one field.
- Forgetting `-t,` for CSV files.
- `sort data > data` — empties the file; use `-o`.
- Counting matches with `grep pattern | wc -l` when `grep -c` does it directly (both fine; know both).

## Key Takeaways

- `sort` is textual by default; `-n` numeric, `-h` human sizes, `-r` reverse, `-u` unique, `-t` separator, `-k N,N` key, `-o` in place.
- `uniq` collapses only adjacent duplicates: always `sort | uniq`; `-c` count, `-d` duplicated, `-u` unique.
- `wc -l` lines, `-w` words, `-c` bytes, `-m` characters.
- Frequency count: `… | sort | uniq -c | sort -rn | head`.

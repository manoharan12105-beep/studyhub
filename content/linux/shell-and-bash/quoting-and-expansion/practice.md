# Quoting, Expansion and Globbing — Practice

All items start in `~/linux-lab`.

### P1. Three quotes

**Difficulty:** Easy · **Type:** Output · **Concepts:** single vs double quotes

What does this print?

```bash
city=chennai
echo "I live in $city"
echo 'I live in $city'
echo I live in \$city
```

<details>
<summary>Answer</summary>

**Output:**

```text
I live in chennai
I live in $city
I live in $city
```

</details>

### P2. Arithmetic

**Difficulty:** Easy · **Type:** Output · **Concepts:** $(( ))

What does this print?

```bash
echo $((17 / 5)) $((17 % 5)) $((2 ** 10))
```

<details>
<summary>Answer</summary>

**Output:**

```text
3 2 1024
```

Integer division drops the fraction; `%` is the remainder; `**` is the power operator.

</details>

### P3. Brace expansion

**Difficulty:** Easy · **Type:** Output · **Concepts:** brace expansion

What does this print?

```bash
echo backup-{mon,tue}.{log,gz}
```

<details>
<summary>Answer</summary>

**Output:**

```text
backup-mon.log backup-mon.gz backup-tue.log backup-tue.gz
```

Two brace groups produce every combination, left group varying slowest.

</details>

### P4. Which files?

**Difficulty:** Easy · **Type:** Output · **Concepts:** globbing

What does this print in the lab?

```bash
echo v?.txt l*
```

<details>
<summary>Answer</summary>

**Output:**

```text
v1.txt v2.txt list1.txt list2.txt logs
```

`v?.txt` needs exactly one character after `v`; `l*` matches anything starting with `l`, including the directory `logs`.

</details>

### P5. Spaces in a name

**Difficulty:** Medium · **Type:** Output · **Concepts:** word splitting

What does this print?

```bash
f="annual report.txt"
touch "$f"
ls $f 2>&1 | head -n 1
ls "$f"
rm "$f"
```

<details>
<summary>Answer</summary>

**Output:**

```text
ls: cannot access 'annual': No such file or directory
'annual report.txt'
```

Unquoted, `$f` became two arguments. (`ls` prints names containing spaces in quotes when writing to a terminal.)

</details>

### P6. Glob or regex?

**Difficulty:** Medium · **Type:** MCQ · **Concepts:** glob vs regex

Which command lists files whose names end in `.log` in the current directory?

- A) `ls .log$`
- B) `ls *.log`
- C) `ls '.*\.log'`
- D) `ls .*log`

<details>
<summary>Answer</summary>

**Answer:** B) `ls *.log`

**Explanation:** The shell uses glob patterns, not regular expressions. A and C are regex syntax passed literally; D matches only hidden names ending in `log`.

</details>

### P7. Command substitution in a filename

**Difficulty:** Medium · **Type:** Command · **Concepts:** $(…), date

Create a copy of `config/app.conf` named like `app.conf.2026-01-15` using today's date, whatever the date is.

<details>
<summary>Answer</summary>

```bash
cp config/app.conf "config/app.conf.$(date +%F)"
```

`date +%F` prints `YYYY-MM-DD`; quoting keeps the result one argument.

</details>

### P8. Quote for the right program

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** quoting for awk

`awk "{print $2}" employees.csv` prints whole lines instead of the second field. Why? Fix it (fields are comma-separated).

<details>
<summary>Answer</summary>

Inside double quotes the shell expands `$2` (the shell's second positional parameter, usually empty), so awk receives `{print }` and prints whole lines. Use single quotes so awk sees `$2`, and set the separator:

```bash
awk -F, '{print $2}' employees.csv | head -n 3
```

**Output:**

```text
name
asha
ravi
```

</details>

### P9. Escape a quote

**Difficulty:** Medium · **Type:** Output · **Concepts:** quoting edge cases

What does this print?

```bash
echo 'don'\''t' "say \"yes\"" $'tab:\there'
```

<details>
<summary>Answer</summary>

**Output:**

```text
don't say "yes" tab:    here
```

`'don'\''t'` closes the single quote, adds an escaped `'`, and reopens. `\"` escapes quotes inside double quotes. `$'…'` interprets `\t` as a tab.

</details>

### P10. Unmatched glob in a loop

**Difficulty:** Hard · **Type:** Script · **Concepts:** nullglob

This loop prints `processing *.csv` when there are no CSV files. Fix it so it prints nothing in that case.

```bash
for f in *.csv; do echo "processing $f"; done
```

<details>
<summary>Answer</summary>

```bash
shopt -s nullglob
for f in *.csv; do echo "processing $f"; done
shopt -u nullglob
```

With `nullglob`, a pattern with no matches expands to nothing, so the loop body never runs. Alternatively, test inside the loop: `[ -e "$f" ] || continue`.

</details>

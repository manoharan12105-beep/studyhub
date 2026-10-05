# cut, tr and paste — Practice

All items start in `~/linux-lab`.

### P1. Names only

**Difficulty:** Easy · **Type:** Command · **Concepts:** cut -d -f

Print only the employee names from `employees.csv`, without the header.

<details>
<summary>Answer</summary>

```bash
tail -n +2 employees.csv | cut -d, -f2
```

**Output:**

```text
asha
ravi
meena
john
fatima
arjun
divya
karan
```

</details>

### P2. Characters

**Difficulty:** Easy · **Type:** Output · **Concepts:** cut -c

What does this print?

```bash
cut -c12-19 app.log | head -n 2
```

<details>
<summary>Answer</summary>

**Output:**

```text
09:00:01
09:00:02
```

Characters 12–19 are the time part of each timestamp.

</details>

### P3. Translate

**Difficulty:** Easy · **Type:** Output · **Concepts:** tr mapping

What does this print?

```bash
echo "2026-01-15" | tr '-' '/'
```

<details>
<summary>Answer</summary>

**Output:**

```text
2026/01/15
```

</details>

### P4. tr and files

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** tr reads stdin

Which command uppercases `notes.txt`?

- A) `tr a-z A-Z notes.txt`
- B) `tr a-z A-Z < notes.txt`
- C) `tr notes.txt a-z A-Z`
- D) `cut -u notes.txt`

<details>
<summary>Answer</summary>

**Answer:** B) `tr a-z A-Z < notes.txt`

**Explanation:** `tr` takes only character sets as arguments and reads standard input; A fails with "extra operand".

</details>

### P5. Squeeze then cut

**Difficulty:** Medium · **Type:** Output · **Concepts:** tr -s, cut

What does this print?

```bash
tr -s ' ' < app.log | cut -d' ' -f3 | sort -u
```

<details>
<summary>Answer</summary>

**Output:**

```text
ERROR
INFO
WARN
```

</details>

### P6. Join a list

**Difficulty:** Medium · **Type:** Command · **Concepts:** paste -s

Produce the single line `banana|grape|mango|orange` from `list2.txt`.

<details>
<summary>Answer</summary>

```bash
paste -sd'|' list2.txt
```

**Output:**

```text
banana|grape|mango|orange
```

Quote the `|` so the shell does not treat it as a pipe.

</details>

### P7. Keep digits

**Difficulty:** Medium · **Type:** Output · **Concepts:** tr -c -d

What does this print?

```bash
echo "Order #1042 failed (code 503)" | tr -cd '0-9\n'
```

<details>
<summary>Answer</summary>

**Output:**

```text
1042503
```

Everything except digits and the newline is deleted, so the two numbers run together.

</details>

### P8. Missing delimiter

**Difficulty:** Medium · **Type:** Output · **Concepts:** cut prints lines without the delimiter

How many lines does each command print?

```bash
cut -d= -f1 config/app.conf | wc -l
cut -s -d= -f1 config/app.conf | wc -l
```

<details>
<summary>Answer</summary>

**Output:**

```text
7
6
```

The comment line has no `=`; without `-s` it is printed whole, with `-s` it is skipped.

</details>

### P9. Path per line

**Difficulty:** Medium · **Type:** Command · **Concepts:** tr

Show each directory of your `PATH` on its own line.

<details>
<summary>Answer</summary>

```bash
echo "$PATH" | tr ':' '\n'
```

The output depends on your system.

</details>

### P10. Fix a broken script

**Difficulty:** Hard · **Type:** Troubleshooting · **Concepts:** CRLF line endings, tr -d

A script copied from Windows fails with `$'\r': command not found`. Explain the cause and fix it with `tr`, keeping a backup.

<details>
<summary>Answer</summary>

The file has Windows (CRLF) line endings: every line ends with `\r\n`, so bash sees a stray carriage return at the end of each command. Fix:

```bash
# Illustrative
cp deploy.sh deploy.sh.bak
tr -d '\r' < deploy.sh.bak > deploy.sh
```

Check with `cat -A deploy.sh` (no `^M` should remain) or `file deploy.sh` (should no longer say "with CRLF line terminators").

</details>

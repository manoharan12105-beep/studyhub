# sed — Practice

All items start in `~/linux-lab`.

### P1. First or all?

**Difficulty:** Easy · **Type:** Output · **Concepts:** g flag

What does this print?

```bash
echo "a-b-c-d" | sed 's/-/:/'
echo "a-b-c-d" | sed 's/-/:/g'
```

<details>
<summary>Answer</summary>

**Output:**

```text
a:b-c-d
a:b:c:d
```

</details>

### P2. Print a line range

**Difficulty:** Easy · **Type:** Command · **Concepts:** -n, p

Print lines 2 to 4 of `employees.csv`.

<details>
<summary>Answer</summary>

```bash
sed -n '2,4p' employees.csv
```

**Output:**

```text
101,asha,engineering,85000,chennai
102,ravi,sales,52000,mumbai
103,meena,engineering,92000,bengaluru
```

</details>

### P3. Delete comments

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** d command

Which command prints `config/app.conf` without lines that start with `#`?

- A) `sed 's/#//' config/app.conf`
- B) `sed '/^#/d' config/app.conf`
- C) `sed -n '/^#/p' config/app.conf`
- D) `sed '/#/p' config/app.conf`

<details>
<summary>Answer</summary>

**Answer:** B) `sed '/^#/d' config/app.conf`

**Explanation:** A only removes the `#` character; C prints only the comments; D prints everything, with comment lines twice.

</details>

### P4. Swap fields

**Difficulty:** Medium · **Type:** Output · **Concepts:** groups, -E

What does this print?

```bash
echo "asha,chennai" | sed -E 's/([^,]+),(.+)/\2: \1/'
```

<details>
<summary>Answer</summary>

**Output:**

```text
chennai: asha
```

</details>

### P5. Wrap the numbers

**Difficulty:** Medium · **Type:** Output · **Concepts:** &, g

What does this print?

```bash
echo "took 2300ms after 3 retries" | sed -E 's/[0-9]+/<&>/g'
```

<details>
<summary>Answer</summary>

**Output:**

```text
took <2300>ms after <3> retries
```

</details>

### P6. Change a config value in place

**Difficulty:** Medium · **Type:** Command · **Concepts:** -i, anchored substitution

Make a copy of `config/app.conf` called `my.conf`, then change its port to `9090` in place, keeping a `.orig` backup, and show the result.

<details>
<summary>Answer</summary>

```bash
cp config/app.conf my.conf
sed -i.orig 's/^app\.port=.*/app.port=9090/' my.conf
grep port my.conf
```

**Output:**

```text
app.port=9090
db.port=5432
```

`my.conf.orig` keeps the original. The anchor `^app\.port=` leaves `db.port` untouched.

</details>

### P7. Between markers

**Difficulty:** Medium · **Type:** Output · **Concepts:** range addresses

What does this print?

```bash
sed -n '/Slow request/,/payment failed/p' app.log | wc -l
```

<details>
<summary>Answer</summary>

**Output:**

```text
3
```

From the "Slow request" line (line 8) through "payment failed" (line 10).

</details>

### P8. Printed twice

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** -n

A colleague runs `sed '/WARN/p' app.log` to see warnings and gets the whole log with warnings duplicated. Explain and fix.

<details>
<summary>Answer</summary>

sed prints every line by default, and `p` prints matching lines a second time. Use `sed -n '/WARN/p' app.log` (or simply `grep WARN app.log`).

</details>

### P9. Dates to another format

**Difficulty:** Hard · **Type:** Command · **Concepts:** capture groups

Print the first two lines of `app.log` with the date changed from `2026-01-15` to `15.01.2026`, leaving the rest of each line unchanged.

<details>
<summary>Answer</summary>

```bash
sed -E 's/^([0-9]{4})-([0-9]{2})-([0-9]{2})/\3.\2.\1/' app.log | head -n 2
```

**Output:**

```text
15.01.2026 09:00:01 INFO  [main] Application starting
15.01.2026 09:00:02 INFO  [main] Loading configuration from config/app.conf
```

The `^` anchor ensures only the leading date is rewritten.

</details>

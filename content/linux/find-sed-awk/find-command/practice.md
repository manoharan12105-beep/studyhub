# find — Practice

All items start in `~/linux-lab`.

### P1. By name

**Difficulty:** Easy · **Type:** Output · **Concepts:** -name

What does this print?

```bash
find project -name '*Service*.java' | sort
```

<details>
<summary>Answer</summary>

**Output:**

```text
project/src/OrderService.java
project/src/PaymentService.java
project/test/OrderServiceTest.java
```

</details>

### P2. Directories only

**Difficulty:** Easy · **Type:** Command · **Concepts:** -type d

List every directory under `logs`, including `logs` itself.

<details>
<summary>Answer</summary>

```bash
find logs -type d | sort
```

**Output:**

```text
logs
logs/archive
```

</details>

### P3. Pick the size test

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** -size

Which command finds files bigger than 500 MB?

- A) `find / -size 500M`
- B) `find / -size +500M`
- C) `find / -size -500M`
- D) `find / -bigger 500M`

<details>
<summary>Answer</summary>

**Answer:** B) `find / -size +500M`

**Explanation:** `+` = more than, `-` = less than, no sign = exactly (after rounding). There is no `-bigger` test.

</details>

### P4. Old logs

**Difficulty:** Medium · **Type:** Output · **Concepts:** -mtime

The dated logs in `logs` were modified 20, 10 and 2 days ago. What does this print?

```bash
find logs -maxdepth 1 -name 'app-*.log' -mtime +5 | sort
```

<details>
<summary>Answer</summary>

**Output:**

```text
logs/app-2026-01-01.log
logs/app-2026-01-08.log
```

The 2-day-old file fails `-mtime +5`; `-maxdepth 1` keeps `find` out of `archive`.

</details>

### P5. Count with -exec

**Difficulty:** Medium · **Type:** Command · **Concepts:** -exec {} +

Show the line count of every `.log` file directly inside `logs`, with a total, using a single `wc` invocation.

<details>
<summary>Answer</summary>

```bash
find logs -maxdepth 1 -name '*.log' -exec wc -l {} + | sort -n
```

**Output:**

```text
      1 logs/app-2026-01-01.log
      1 logs/app-2026-01-14.log
      2 logs/app-2026-01-08.log
  59353 logs/debug.log
  59357 total
```

</details>

### P6. Permissions audit

**Difficulty:** Medium · **Type:** Output · **Concepts:** -perm forms

What does this print?

```bash
chmod 666 notes.txt
find . -maxdepth 1 -type f -perm /o=w
chmod 644 notes.txt
```

<details>
<summary>Answer</summary>

**Output:**

```text
./notes.txt
```

`/o=w` matches when the others-write bit is set, regardless of the other bits.

</details>

### P7. Ordering bug

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** expression order, -o precedence

A colleague wants to delete `*.tmp` and `*.bak` files and runs `find . -name '*.tmp' -o -name '*.bak' -delete`. Only the `.bak` files disappear. Why? Fix it.

<details>
<summary>Answer</summary>

AND binds tighter than OR, so the expression is `-name '*.tmp' -o ( -name '*.bak' -delete )`. For `.tmp` files the first test is true and the OR short-circuits — no action runs. Group the tests:

```bash
# Illustrative
find . \( -name '*.tmp' -o -name '*.bak' \) -print     # check first
find . \( -name '*.tmp' -o -name '*.bak' \) -delete
```

</details>

### P8. Rounding trap

**Difficulty:** Hard · **Type:** Output · **Concepts:** -size rounding

What does this print?

```bash
printf 'x' > tiny.txt
find . -maxdepth 1 -name 'tiny.txt' -size -1k
find . -maxdepth 1 -name 'tiny.txt' -size -2k
```

<details>
<summary>Answer</summary>

**Output:**

```text
./tiny.txt
```

Only the second command prints. The 1-byte file is rounded up to 1 KiB, and "less than 1" is false; "less than 2" is true.

</details>

### P9. Newest files

**Difficulty:** Hard · **Type:** Command · **Concepts:** -printf, sort

Print the three most recently modified files in the lab (any depth), newest first, with their modification date.

<details>
<summary>Answer</summary>

```bash
find . -type f -printf '%T@ %TY-%Tm-%Td %p\n' | sort -rn | head -n 3 | cut -d' ' -f2-
```

`%T@` is the modification time in seconds since 1970 (sortable); it is removed by `cut` after sorting. The result depends on what you created most recently.

</details>

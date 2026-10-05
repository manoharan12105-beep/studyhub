# Viewing Files — Practice

All items start in `~/linux-lab`.

### P1. Last lines

**Difficulty:** Easy · **Type:** Output · **Concepts:** tail

What does this print?

```bash
tail -n 3 numbers.txt
```

<details>
<summary>Answer</summary>

**Output:**

```text
4
100
25
```

</details>

### P2. Skip the header

**Difficulty:** Easy · **Type:** Command · **Concepts:** tail -n +N

Print `employees.csv` without its header line.

<details>
<summary>Answer</summary>

```bash
tail -n +2 employees.csv
```

`+2` means "start at line 2".

</details>

### P3. The right tool

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** less vs cat

You must search a 2 GB log for the first occurrence of `OutOfMemoryError` and then read the lines before it. Which is best?

- A) `cat big.log`
- B) `less big.log`, then type `/OutOfMemoryError`
- C) `more big.log`
- D) `head big.log`

<details>
<summary>Answer</summary>

**Answer:** B) `less big.log`, then type `/OutOfMemoryError`

**Explanation:** `less` opens large files immediately, searches with `/`, and lets you scroll back to see what led to the error.

</details>

### P4. A range of lines

**Difficulty:** Medium · **Type:** Output · **Concepts:** head and tail combined

What does this print?

```bash
head -n 4 fruits.txt | tail -n 2
```

<details>
<summary>Answer</summary>

**Output:**

```text
cherry
apple
```

`fruits.txt` is banana, apple, cherry, apple, banana, mango, apple. The first four lines end with cherry, apple.

</details>

### P5. Everything but the end

**Difficulty:** Medium · **Type:** Output · **Concepts:** head -n -N

What does this print?

```bash
head -n -10 app.log
```

<details>
<summary>Answer</summary>

**Output:**

```text
2026-01-15 09:00:01 INFO  [main] Application starting
2026-01-15 09:00:02 INFO  [main] Loading configuration from config/app.conf
```

`app.log` has 12 lines; a negative count prints all but the last 10.

</details>

### P6. Log rotation

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** tail -f vs tail -F

You run `tail -f /var/log/app/app.log`. At midnight logrotate renames it to `app.log.1` and creates a new `app.log`. Your terminal stops showing new entries although the application keeps logging. Explain and fix.

<details>
<summary>Answer</summary>

`tail -f` keeps reading the file it originally opened, which is now `app.log.1` and no longer written to. Use `tail -F` (follow by name, retry), which reopens the new `app.log` after rotation.

</details>

### P7. Invisible characters

**Difficulty:** Medium · **Type:** Output · **Concepts:** cat -A

What does this print?

```bash
printf 'port=8080\t\r\n' > bad.conf
cat -A bad.conf
rm bad.conf
```

<details>
<summary>Answer</summary>

**Output:**

```text
port=8080^I^M$
```

`^I` is the tab, `^M` the carriage return, `$` the end of the line. A parser reading `8080<tab><CR>` as the port value would reject it.

</details>

### P8. Metadata in one line

**Difficulty:** Medium · **Type:** Command · **Concepts:** stat -c

Print the octal permissions and the name of every file in `config`, one per line, using `stat`.

<details>
<summary>Answer</summary>

```bash
stat -c '%a %n' config/*
```

**Output:**

```text
644 config/app.conf
600 config/db.conf
```

</details>

### P9. Which time changed?

**Difficulty:** Hard · **Type:** Conceptual · **Concepts:** atime, mtime, ctime

You run `chmod 600 notes.txt`. Which of atime, mtime and ctime change? Then you append a line with `echo x >> notes.txt` — which change now?

<details>
<summary>Answer</summary>

`chmod` changes metadata only, so only **ctime** changes. Appending changes the content, so **mtime** and **ctime** change (atime is unaffected by writing).

</details>

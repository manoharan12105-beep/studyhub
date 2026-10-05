# grep: Searching Text — Practice

All items start in `~/linux-lab`.

### P1. Count the errors

**Difficulty:** Easy · **Type:** Output · **Concepts:** grep -c

What does this print?

```bash
grep -c ERROR app.log
```

<details>
<summary>Answer</summary>

**Output:**

```text
3
```

</details>

### P2. Case-insensitive count

**Difficulty:** Easy · **Type:** Output · **Concepts:** grep -i, -c

What does this print?

```bash
grep -ic linux notes.txt
```

<details>
<summary>Answer</summary>

**Output:**

```text
3
```

Three lines contain "Linux" or "linux". Without `-i` the count would be 2.

</details>

### P3. Settings only

**Difficulty:** Easy · **Type:** Command · **Concepts:** grep -v, anchors

Print `config/app.conf` without comment lines (lines starting with `#`).

<details>
<summary>Answer</summary>

```bash
grep -v '^#' config/app.conf
```

`^` anchors the match to the start of the line, so a `#` in the middle of a value would not remove the line.

</details>

### P4. Pick the option

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** grep options

Which option prints the line number of each matching line?

- A) `-l`
- B) `-n`
- C) `-c`
- D) `-o`

<details>
<summary>Answer</summary>

**Answer:** B) `-n`

**Explanation:** `-l` lists matching file names, `-c` counts, `-o` prints only the matched text.

</details>

### P5. Client errors

**Difficulty:** Medium · **Type:** Command · **Concepts:** grep -E, patterns

From `access.log`, print the requests whose status code is in the 4xx range.

<details>
<summary>Answer</summary>

```bash
grep -E '" 4[0-9]{2} ' access.log
```

**Output:**

```text
192.168.1.12 - - [15/Jan/2026:09:03:44 +0000] "GET /missing.html HTTP/1.1" 404 154
192.168.1.11 - - [15/Jan/2026:09:07:23 +0000] "GET /favicon.ico HTTP/1.1" 404 154
```

Anchoring on `" ` (end of the request) avoids matching numbers inside the path or byte count.

</details>

### P6. The bracket trap

**Difficulty:** Medium · **Type:** Output · **Concepts:** character classes, -F

How many lines does each command print?

```bash
grep -c '[http]' app.log
grep -cF '[http]' app.log
```

<details>
<summary>Answer</summary>

**Output:**

```text
12
3
```

`[http]` is a character class matching any single `h`, `t` or `p` — every line has one. With `-F` the brackets are literal and only the three `[http]` lines match.

</details>

### P7. What came next?

**Difficulty:** Medium · **Type:** Command · **Concepts:** context lines

Show each ERROR line in `app.log` together with the one line that follows it.

<details>
<summary>Answer</summary>

```bash
grep -A 1 ERROR app.log
```

**Output:**

```text
2026-01-15 09:15:42 ERROR [db] Connection timed out after 30s
2026-01-15 09:15:43 INFO  [db] Retrying connection (attempt 2)
--
2026-01-15 10:30:00 ERROR [payment] Payment gateway returned 503
2026-01-15 10:30:01 ERROR [payment] Order 1042 payment failed
2026-01-15 11:45:12 INFO  [http] GET /api/health 200
```

`--` separates non-adjacent groups. The two payment errors are adjacent, so they share one group: the second ERROR is the line after the first, and the INFO line follows the second.

</details>

### P8. Only the numbers

**Difficulty:** Medium · **Type:** Output · **Concepts:** grep -o, -E

What does this print?

```bash
grep -oE 'port=[0-9]+' config/app.conf
```

<details>
<summary>Answer</summary>

**Output:**

```text
port=8080
port=5432
```

`-o` prints just the matched text of each match, so the `app.`/`db.` prefixes are not shown.

</details>

### P9. Script test

**Difficulty:** Medium · **Type:** Script · **Concepts:** grep -q, exit status

Write an `if` statement that prints `log level is DEBUG` if `config/app.conf` contains exactly the line `log.level=DEBUG`, and `log level is not DEBUG` otherwise.

<details>
<summary>Answer</summary>

```bash
if grep -qx 'log.level=DEBUG' config/app.conf; then
    echo "log level is DEBUG"
else
    echo "log level is not DEBUG"
fi
```

**Output:**

```text
log level is not DEBUG
```

`-x` requires the whole line to match, so `log.level=DEBUG_EXTRA` would not count.

</details>

### P10. Exit code puzzle

**Difficulty:** Hard · **Type:** Output · **Concepts:** grep exit status

What does this print?

```bash
grep -q TIMEOUT app.log; a=$?
grep -q TIMEOUT nofile.log 2>/dev/null; b=$?
grep -qi 'timed out' app.log; c=$?
echo "$a $b $c"
```

<details>
<summary>Answer</summary>

**Output:**

```text
1 2 0
```

No match → 1; missing file → 2 (an error, even though the message was hidden); match → 0.

</details>

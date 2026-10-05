# grep: Searching Text

**Module:** Text Processing · **Interview priority:** Core

## What Is It?

`grep` prints the lines of its input that match a **pattern** (a regular expression). It reads files named as arguments, or standard input when used in a pipeline. The name comes from the old editor command `g/re/p` — "globally search for a regular expression and print".

```text
grep [options] PATTERN [file ...]
command | grep [options] PATTERN
```

## Why It Matters

- It is the first tool for logs: "show me every ERROR", "which requests returned 500?", "what happened just before the crash?".
- In codebases: "where is this class used?" (`grep -rn`), "which config files set this property?".
- In scripts: `grep -q` tests whether something is present.
- Interviews almost always include a `grep` question: case-insensitive search, invert match, count, recursive search, context lines, regex.

## Core Concept

### Matching is per line

`grep` tests each line separately and prints whole lines that contain a match anywhere — unless options change what is printed (`-o` only the match, `-c` a count, `-l` filenames).

### Regular expressions in one table

`grep` uses **basic regular expressions (BRE)** by default; `grep -E` uses **extended (ERE)**, where `+ ? | ( ) { }` work without backslashes.

| Pattern | Matches | Example |
|---------|---------|---------|
| `abc` | The literal text abc | `grep ERROR` |
| `.` | Any single character | `h.t` → hat, hot, h9t |
| `*` | Zero or more of the previous item | `ab*c` → ac, abc, abbc |
| `^` / `$` | Start / end of line | `^#` comment lines; `\.java$` |
| `[abc]` / `[^abc]` | One character from the set / not from it | `[0-9]`, `[A-Za-z]`, `[^ ]` |
| `\` | Escape a special character | `\.` a real dot, `\[` a real bracket |
| `+` (ERE) | One or more | `[0-9]+` |
| `?` (ERE) | Zero or one | `colou?r` |
| `\|` (ERE) | Alternation (or) | `ERROR\|WARN` |
| `( )` (ERE) | Grouping | `(GET\|POST) /api` |
| `{n,m}` (ERE) | Repetition count | `[0-9]{3}` |
| `\b` or `-w` | Word boundary | `\bport\b` |

In BRE the same features are written `\+`, `\?`, `\|`, `\( \)`, `\{n,m\}` (GNU extensions for the first three). Use `-E` and save the backslashes.

> [!TIP]
> Always put the pattern in **single quotes**: `grep -E '^(GET|POST)' file`. Otherwise the shell may interpret `|`, `*`, `$`, `?` or spaces before `grep` sees them.

### Exit status

| Status | Meaning |
|--------|---------|
| 0 | At least one line matched |
| 1 | No line matched |
| 2 | An error (e.g. file not found) |

```bash
grep zzz app.log
echo "status $?"
grep hello missing.txt
echo "status $?"
```

**Output:**

```text
status 1
grep: missing.txt: No such file or directory
status 2
```

## Commands

### Options

| Option | Meaning |
|--------|---------|
| `-i` | Ignore case |
| `-v` | Invert: lines that do **not** match |
| `-n` | Prefix line numbers |
| `-c` | Count matching lines (per file) |
| `-l` / `-L` | List files that match / that do not match |
| `-w` | Match whole words only |
| `-x` | Match the whole line only |
| `-o` | Print only the matched part, one per line |
| `-E` | Extended regular expressions |
| `-F` | Fixed string: no regex, pattern is literal |
| `-r` / `-R` | Recursive through directories (`-R` follows symlinks) |
| `--include='*.java'`, `--exclude-dir=.git` | Filter files in recursive search |
| `-A n` / `-B n` / `-C n` | n lines After / Before / around each match |
| `-q` | Quiet: no output, only the exit status |
| `-h` / `-H` | Hide / show filenames in output |
| `-s` | Suppress "No such file" error messages |
| `-e PATTERN` | Give a pattern explicitly (repeatable; needed if it starts with `-`) |

### Basic search

```bash
grep ERROR app.log
```

**Output:**

```text
2026-01-15 09:15:42 ERROR [db] Connection timed out after 30s
2026-01-15 10:30:00 ERROR [payment] Payment gateway returned 503
2026-01-15 10:30:01 ERROR [payment] Order 1042 payment failed
```

### Case-insensitive: `-i`

```bash
grep linux notes.txt
grep -i linux notes.txt
```

**Output:**

```text
GNU tools run on linux.
linux distributions bundle the kernel with software.
Linux is a kernel.
GNU tools run on linux.
linux distributions bundle the kernel with software.
```

### Line numbers and counts: `-n`, `-c`

```bash
grep -n WARN app.log
grep -c INFO app.log
```

**Output:**

```text
3:2026-01-15 09:00:03 WARN  [db] Connection pool size not set, using default 10
8:2026-01-15 10:02:10 WARN  [http] Slow request: GET /api/orders took 2300ms
7
```

`-c` counts **lines**, not occurrences. To count every occurrence: `grep -o pattern file | wc -l`.

### Invert: `-v`

```bash
grep -v INFO app.log
```

**Output:**

```text
2026-01-15 09:00:03 WARN  [db] Connection pool size not set, using default 10
2026-01-15 09:15:42 ERROR [db] Connection timed out after 30s
2026-01-15 10:02:10 WARN  [http] Slow request: GET /api/orders took 2300ms
2026-01-15 10:30:00 ERROR [payment] Payment gateway returned 503
2026-01-15 10:30:01 ERROR [payment] Order 1042 payment failed
```

Show a config file without comments and blank lines — an everyday idiom:

```bash
grep -v '^#' config/app.conf | grep -v '^$'
```

**Output:**

```text
app.name=inventory
app.port=8080
app.env=dev
db.host=localhost
db.port=5432
log.level=INFO
```

(`grep -Ev '^(#|$)'` does it in one command.)

### Several patterns: `-E` with `|`

```bash
grep -E 'ERROR|WARN' app.log
```

**Output:**

```text
2026-01-15 09:00:03 WARN  [db] Connection pool size not set, using default 10
2026-01-15 09:15:42 ERROR [db] Connection timed out after 30s
2026-01-15 10:02:10 WARN  [http] Slow request: GET /api/orders took 2300ms
2026-01-15 10:30:00 ERROR [payment] Payment gateway returned 503
2026-01-15 10:30:01 ERROR [payment] Order 1042 payment failed
```

Failed HTTP requests (status 404 or 500, surrounded by spaces):

```bash
grep -E ' (404|500) ' access.log
```

**Output:**

```text
192.168.1.12 - - [15/Jan/2026:09:03:44 +0000] "GET /missing.html HTTP/1.1" 404 154
10.0.0.5 - - [15/Jan/2026:09:04:01 +0000] "GET /api/orders/42 HTTP/1.1" 500 87
192.168.1.11 - - [15/Jan/2026:09:07:23 +0000] "GET /favicon.ico HTTP/1.1" 404 154
```

### Only the match: `-o`

```bash
grep -oE '[0-9]+ms' app.log
grep -oE '^[0-9.]+' access.log | sort -u
```

**Output:**

```text
2300ms
10.0.0.5
192.168.1.10
192.168.1.11
192.168.1.12
```

### Whole words and whole lines: `-w`, `-x`

```bash
grep -x apple fruits.txt | wc -l
```

**Output:**

```text
3
```

`-w port` would match `app.port` (the dot is a word boundary) but not `export` or `ports`.

### Context: `-A`, `-B`, `-C`

What happened after the timeout?

```bash
grep -A 2 'timed out' app.log
```

**Output:**

```text
2026-01-15 09:15:42 ERROR [db] Connection timed out after 30s
2026-01-15 09:15:43 INFO  [db] Retrying connection (attempt 2)
2026-01-15 09:15:44 INFO  [db] Connection established
```

What led to the payment failure?

```bash
grep -B 1 'payment failed' app.log
```

**Output:**

```text
2026-01-15 10:30:00 ERROR [payment] Payment gateway returned 503
2026-01-15 10:30:01 ERROR [payment] Order 1042 payment failed
```

For stack traces in Java logs, `grep -A 20 'Exception'` shows the frames that follow.

### Literal text: `-F`

Square brackets are special in regex: `[db]` means "the character d or b".

```bash
grep '[db]' app.log | head -n 2
```

**Output:**

```text
2026-01-15 09:00:02 INFO  [main] Loading configuration from config/app.conf
2026-01-15 09:00:03 WARN  [db] Connection pool size not set, using default 10
```

The first line matched because "Loa**d**ing" contains a `d`. Search literally with `-F` (or escape: `'\[db\]'`):

```bash
grep -F '[db]' app.log
```

**Output:**

```text
2026-01-15 09:00:03 WARN  [db] Connection pool size not set, using default 10
2026-01-15 09:15:42 ERROR [db] Connection timed out after 30s
2026-01-15 09:15:43 INFO  [db] Retrying connection (attempt 2)
2026-01-15 09:15:44 INFO  [db] Connection established
```

### Several files and recursive search

With more than one file, each line is prefixed with its filename (`-h` hides it):

```bash
grep ERROR app.log logs/*.log
```

**Output:**

```text
app.log:2026-01-15 09:15:42 ERROR [db] Connection timed out after 30s
app.log:2026-01-15 10:30:00 ERROR [payment] Payment gateway returned 503
app.log:2026-01-15 10:30:01 ERROR [payment] Order 1042 payment failed
logs/app-2026-01-08.log:2026-01-08 ERROR nightly job failed
```

Which files contain (or lack) a word:

```bash
grep -l TODO project/src/*.java
grep -L TODO project/src/*.java project/readme.md
```

**Output:**

```text
project/src/Main.java
project/src/Order.java
project/src/OrderService.java
project/src/PaymentService.java
project/readme.md
```

Search a whole tree, with line numbers, only in Java files:

```bash
grep -rn --include='*.java' 'class Order' project
```

**Output (varies):**

```text
project/src/OrderService.java:1:public class OrderService {
project/src/Order.java:1:public class Order {
project/test/OrderServiceTest.java:1:public class OrderServiceTest {
```

The order follows the directory order on disk, which differs between filesystems. Add `--exclude-dir=.git --exclude-dir=node_modules` in real repositories.

### Quiet test: `-q`

```bash
grep -q ERROR app.log && echo "errors present"
```

**Output:**

```text
errors present
```

## Examples

### Errors in the last hour of a log

```bash
# Illustrative
grep "$(date +'%Y-%m-%d %H')" /var/log/app.log | grep -c ERROR
```

### Exclude grep itself when searching processes

```bash
# Illustrative
ps aux | grep '[j]ava'      # the pattern [j]ava does not match the text "[j]ava" in grep's own command line
pgrep -a java               # the better tool
```

## Comparison

### grep vs grep -E vs grep -F

| | `grep` (BRE) | `grep -E` (ERE) | `grep -F` |
|---|---|---|---|
| Pattern | Basic regex | Extended regex | Literal string(s) |
| `+ ? \| ( ) { }` | Need backslashes | Work directly | Literal characters |
| Speed | Fast | Fast | Fastest for many literal patterns |
| Old names | — | `egrep` (deprecated) | `fgrep` (deprecated) |

### grep vs find

| | `grep` | `find` |
|---|---|---|
| Searches | File **contents** (lines of text) | File **names and attributes** (name, size, time, type) |
| Example | `grep -r 'TODO' src/` | `find src -name '*.java'` |
| Combine | `find . -name '*.log' -exec grep -l ERROR {} +` | |

## Common Mistakes

- Not quoting the pattern: `grep ERROR|WARN file` pipes to a command called `WARN`.
- Forgetting that `.`, `*`, `[`, `]` are special: `grep 1.5` also matches `105`; use `grep -F` or escape.
- Using `grep -c` expecting a count of occurrences — it counts lines.
- Writing `cat file | grep x` instead of `grep x file`.
- `ps aux | grep java` matching the grep process itself; use `pgrep`.
- Searching recursively from `/` or into `.git`/`node_modules` without `--exclude-dir`.

## Key Takeaways

- `grep PATTERN file` prints matching lines; exit status 0 match, 1 none, 2 error.
- Core options: `-i` case, `-v` invert, `-n` numbers, `-c` count, `-l` files, `-w` word, `-o` only match, `-r` recursive, `-A/-B/-C` context, `-q` quiet.
- `-E` for `|`, `+`, `?`, `()`, `{}`; `-F` for literal text.
- Quote patterns in single quotes.
- `grep` searches contents; `find` searches names and attributes.

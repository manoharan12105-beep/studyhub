# Loops: for, while, until, break and continue

**Module:** Bash Scripting · **Interview priority:** Core

## What Is It?

Loops repeat commands:

| Loop | Repeats | Typical use |
|------|---------|-------------|
| `for x in LIST` | Once per item in a list | Files, servers, arguments |
| `for ((i=0; i<n; i++))` | C-style counter (bash) | Numeric ranges |
| `while CONDITION` | While the condition command succeeds | Counters, reading lines, waiting |
| `until CONDITION` | Until the condition command succeeds | Retry until something is ready |

`break` leaves the loop; `continue` skips to the next iteration.

## Why It Matters

- Batch work: process every log file, back up every database, check every server.
- Reading files line by line is the backbone of many admin scripts.
- Retry loops make scripts robust against services that start slowly.
- Interview tasks often ask you to loop over files or lines and compute something.

## Core Concept

### Syntax at a glance

```bash
# Illustrative: syntax
for item in one two three; do
    echo "$item"
done

for ((i = 1; i <= 5; i++)); do
    echo "$i"
done

while [ "$n" -lt 10 ]; do
    n=$((n + 1))
done

until ping -c 1 -W 1 db.internal > /dev/null; do
    sleep 2
done
```

`do … done` delimit the body; `;` can replace newlines: `for f in *.log; do gzip "$f"; done`.

### Where the list comes from

| Source | Example | Notes |
|--------|---------|-------|
| Literal words | `for env in dev test prod` | |
| Glob | `for f in logs/*.log` | One item per file, safe with spaces when you quote `"$f"` |
| Brace range | `for i in {1..5}` | Fixed numbers only |
| `seq` | `for i in $(seq 1 "$n")` | Variable ranges |
| Arguments | `for arg in "$@"` (or just `for arg`) | |
| Command output | `for u in $(cut -d: -f1 /etc/passwd)` | Split on whitespace — **not** safe for lines with spaces; use `while read` instead |

### Reading a file line by line

The correct idiom:

```bash
# Illustrative
while IFS= read -r line; do
    echo "got: $line"
done < input.txt
```

- `read -r` keeps backslashes literal.
- `IFS=` keeps leading and trailing spaces.
- `< input.txt` after `done` feeds the whole loop, and the loop runs in the current shell, so variables set inside survive.
- With `IFS=, read -r a b c`, each line is split into fields.

> [!WARNING]
> `cat file | while read …` runs the loop in a subshell (it is a pipeline stage): counters and variables set inside are lost after `done`. Use `done < file` or `done < <(command)` instead.

## Commands

### for over words, files and ranges

```bash
for fruit in apple banana cherry; do
    echo "I like $fruit"
done
```

**Output:**

```text
I like apple
I like banana
I like cherry
```

```bash
for f in logs/*.log; do
    echo "$f: $(wc -l < "$f") lines"
done
```

**Output:**

```text
logs/app-2026-01-01.log: 1 lines
logs/app-2026-01-08.log: 2 lines
logs/app-2026-01-14.log: 1 lines
logs/debug.log: 59353 lines
```

```bash
for i in {1..3}; do echo "round $i"; done
for ((i = 0; i < 10; i += 4)); do echo "i=$i"; done
for n in $(seq 5 -2 1); do printf '%s ' "$n"; done; echo
```

**Output:**

```text
round 1
round 2
round 3
i=0
i=4
i=8
5 3 1
```

### while

```bash
count=1
while [ "$count" -le 3 ]; do
    echo "attempt $count"
    count=$((count + 1))
done
```

**Output:**

```text
attempt 1
attempt 2
attempt 3
```

### Reading CSV lines

```bash
while IFS=, read -r id name dept salary city; do
    echo "$name works in $dept"
done < <(tail -n +2 employees.csv | head -n 3)
```

**Output:**

```text
asha works in engineering
ravi works in sales
meena works in engineering
```

`< <(command)` (process substitution) feeds a command's output into the loop without a pipe, so variables persist:

```bash
total=0
while IFS=, read -r id name dept salary city; do
    total=$((total + salary))
done < <(tail -n +2 employees.csv)
echo "total payroll: $total"
```

**Output:**

```text
total payroll: 511000
```

### until

```bash
n=0
until [ "$n" -ge 3 ]; do
    echo "n=$n"
    ((n++))
done
```

**Output:**

```text
n=0
n=1
n=2
```

`until` is `while` with the condition inverted — natural for "wait until ready" loops.

### break and continue

```bash
for i in 1 2 3 4 5 6; do
    [ "$i" -eq 2 ] && continue
    [ "$i" -eq 5 ] && break
    echo "i=$i"
done
```

**Output:**

```text
i=1
i=3
i=4
```

`continue` skipped 2; `break` stopped the loop at 5. `break 2` leaves two nested loops.

## Examples

### A retry loop with a limit

```bash
tries=0
until grep -q "Server listening" app.log; do
    tries=$((tries + 1))
    [ "$tries" -ge 5 ] && { echo "gave up" >&2; break; }
    sleep 1
done
echo "server is up (checked after $tries retries)"
```

**Output:**

```text
server is up (checked after 0 retries)
```

The condition was already true, so the body never ran. In real scripts this pattern waits for a port, a file or a health endpoint — always with a maximum number of attempts.

### Summarise directories

```bash
for dir in config logs project; do
    printf '%-8s %s items\n' "$dir" "$(ls "$dir" | wc -l)"
done
```

**Output:**

```text
config   2 items
logs     5 items
project  5 items
```

### Run a command on several servers

```bash
# Illustrative
for host in web01 web02 web03; do
    echo "== $host"
    ssh -o ConnectTimeout=5 "$host" 'uptime; df -h /' || echo "$host unreachable" >&2
done
```

### Compress old logs

```bash
# Illustrative
for f in /var/log/myapp/*.log; do
    [ -e "$f" ] || continue                       # no match: the pattern stays literal
    if [ "$(find "$f" -mtime +7)" ]; then gzip "$f"; fi
done
```

(`find /var/log/myapp -name '*.log' -mtime +7 -exec gzip {} +` does the same in one command — loops are not always the best tool.)

## Comparison

### for vs while read for lines

| | `for line in $(cat file)` | `while IFS= read -r line; do …; done < file` |
|---|---|---|
| Splits on | Any whitespace (words, not lines) | Newlines only |
| Lines with spaces | Broken into words | Kept intact |
| Glob characters in data | Expanded | Literal |
| Large files | Whole file loaded first | Streamed |
| Verdict | Avoid for lines | Correct idiom |

### while vs until

| | `while COND` | `until COND` |
|---|---|---|
| Runs body while | COND succeeds (exit 0) | COND fails |
| Reads naturally for | "while more input / while count < n" | "until the service is ready" |

## Common Mistakes

- `for line in $(cat file)` to read lines — it iterates over words.
- `cat file | while read …` and then expecting variables set in the loop to survive.
- Forgetting `-r` and `IFS=` in `read`.
- Unquoted `$f` inside the loop body — breaks on names with spaces.
- Infinite retry loops without a limit or a `sleep`, hammering a service or the CPU.
- Looping over a glob that matches nothing and processing the literal pattern (check with `[ -e "$f" ] || continue` or `shopt -s nullglob`).

## Key Takeaways

- `for x in list` (words, globs, `{1..n}`, `"$@"`), `for ((…))` counters, `while`/`until` with any command as the condition.
- Read files with `while IFS= read -r line; do …; done < file`; split fields with `IFS=,`.
- Use `done < <(command)` instead of piping into `while` when variables must survive.
- `break` exits, `continue` skips; give retry loops a maximum and a `sleep`.

# Standard Streams and Redirection

**Module:** Redirection and Pipes · **Interview priority:** Core

## What Is It?

Every process starts with three open **file descriptors** (small integers that refer to open files):

| FD | Name | Default | Used for |
|----|------|---------|----------|
| 0 | **stdin** (standard input) | Keyboard (terminal) | Data the program reads |
| 1 | **stdout** (standard output) | Screen (terminal) | Normal results |
| 2 | **stderr** (standard error) | Screen (terminal) | Errors, warnings, diagnostics |

**Redirection** tells the shell to connect these descriptors to files instead of the terminal **before** the command starts. The command itself does not know or care — it just reads FD 0 and writes FD 1 and 2.

```text
            ┌──────────────┐
 keyboard ─►│0            1│─► screen      (results)
            │   command    │
            │             2│─► screen      (errors)
            └──────────────┘
```

## Why It Matters

- Saving output to files, collecting logs, silencing noise and feeding files into programs are daily tasks.
- Cron jobs and services have no terminal: unless you redirect, their output and errors disappear or go to mail.
- `2>&1` and the order of redirections are a classic interview trap.
- Writing errors to stderr (`>&2`) in your own scripts lets callers separate results from problems.

## Core Concept

Our test command writes one line to stdout and one to stderr:

```bash
ls notes.txt missing.txt
```

**Output:**

```text
ls: cannot access 'missing.txt': No such file or directory
notes.txt
```

On the terminal both streams are mixed, so they look the same. Redirection separates them.

### `>` — redirect stdout, overwrite

```bash
ls notes.txt missing.txt > out.txt
echo "--- out.txt:"
cat out.txt
```

**Output:**

```text
ls: cannot access 'missing.txt': No such file or directory
--- out.txt:
notes.txt
```

Only stdout went into the file; the error still reached the screen. `>` **truncates** the file first (creating it if needed). `> file` is shorthand for `1> file`.

### `>>` — redirect stdout, append

```bash
echo first > log.txt
echo second >> log.txt
cat log.txt
echo third > log.txt
cat log.txt
```

**Output:**

```text
first
second
third
```

`>>` adds to the end. The last `>` wiped `first` and `second`.

### `2>` and `2>>` — redirect stderr

```bash
ls notes.txt missing.txt 2> err.txt
echo "--- err.txt:"
cat err.txt
```

**Output:**

```text
notes.txt
--- err.txt:
ls: cannot access 'missing.txt': No such file or directory
```

Now results reach the screen and errors go to the file. `2>>` appends errors.

### `2>&1` — send stderr wherever stdout currently goes

`2>&1` means "make FD 2 a copy of FD 1". To capture both streams in one file, redirect stdout first, then duplicate:

```bash
ls notes.txt missing.txt > all.txt 2>&1
cat all.txt
```

**Output:**

```text
ls: cannot access 'missing.txt': No such file or directory
notes.txt
```

### Order matters

Redirections are processed **left to right**:

```bash
ls notes.txt missing.txt 2>&1 > out2.txt
echo "--- out2.txt:"
cat out2.txt
```

**Output:**

```text
ls: cannot access 'missing.txt': No such file or directory
--- out2.txt:
notes.txt
```

The error still reached the screen. Step by step:

```text
> all.txt 2>&1                         2>&1 > out2.txt
1. FD1 → all.txt                       1. FD2 → copy of FD1 = terminal
2. FD2 → copy of FD1 = all.txt         2. FD1 → out2.txt
Result: both in the file               Result: errors on screen, output in file
```

### `&>` and `&>>` — both streams (bash shorthand)

`cmd &> file` = `cmd > file 2>&1`, and `cmd &>> file` appends both. They are bash features; in a `#!/bin/sh` script use the long form.

### `/dev/null` — discard

```bash
ls notes.txt missing.txt 2>/dev/null
```

**Output:**

```text
notes.txt
```

| Goal | Command |
|------|---------|
| Hide errors | `cmd 2>/dev/null` |
| Hide normal output | `cmd >/dev/null` |
| Hide everything (only the exit status matters) | `cmd >/dev/null 2>&1` |

### `<` — redirect stdin

```bash
wc -l < app.log
wc -l app.log
```

**Output:**

```text
12
12 app.log
```

With `<`, the shell opens the file and `wc` reads it as anonymous standard input, so it cannot print a filename.

### Here documents and here strings

A **here document** (`<<WORD`) feeds the following lines, up to `WORD`, as stdin. Variables expand unless the delimiter is quoted:

```bash
cat <<EOF
User: $USER
Today is a good day
EOF
cat <<'EOF'
No expansion: $USER
EOF
```

**Output:**

```text
User: student
Today is a good day
No expansion: $USER
```

A **here string** (`<<<`) feeds one string:

```bash
tr a-z A-Z <<< "hello world"
```

**Output:**

```text
HELLO WORLD
```

### Writing to stderr from a script

`>&2` (short for `1>&2`) sends a message to standard error:

```bash
echo "error: config file missing" >&2
```

**Output:**

```text
error: config file missing
```

It looks the same on a terminal, but `script.sh > results.txt` keeps the message on screen and out of the results.

### All operators

| Operator | Meaning |
|----------|---------|
| `> file` | stdout to file, overwrite |
| `>> file` | stdout to file, append |
| `< file` | stdin from file |
| `2> file` | stderr to file, overwrite |
| `2>> file` | stderr to file, append |
| `2>&1` | stderr to wherever stdout points now |
| `>&2` | stdout to wherever stderr points (write errors) |
| `&> file` / `&>> file` | stdout and stderr to file (bash) |
| `<<WORD` | here document |
| `<<< "text"` | here string |
| `\|` | stdout of left command to stdin of right command (see [Pipes and Command Chaining](../pipes-and-command-chaining/content.md)) |

## Examples

### The truncation trap

```bash
sort fruits.txt > fruits.txt
wc -c fruits.txt
```

**Output:**

```text
0 fruits.txt
```

The shell truncates `fruits.txt` **before** `sort` starts, so `sort` reads an empty file. Write to a new file and rename, or use `sort -o fruits.txt fruits.txt`, which is designed for this. (Re-run the lab setup script to restore `fruits.txt`.)

### Protect files with noclobber

```bash
set -o noclobber
echo new > notes.txt
echo forced >| v1.txt
cat v1.txt
set +o noclobber
```

**Output:**

```text
bash: notes.txt: cannot overwrite existing file
forced
```

With `noclobber`, `>` refuses to overwrite existing files; `>|` overrides deliberately.

### Pipes carry stdout only

```bash
ls missing.txt | wc -l
ls missing.txt 2>&1 | wc -l
```

**Output:**

```text
ls: cannot access 'missing.txt': No such file or directory
0
1
```

Without `2>&1` the error bypasses the pipe and `wc` counts zero lines. `|&` is bash shorthand for `2>&1 |`.

### A cron-friendly command

```bash
# Illustrative
0 2 * * * /home/student/scripts/backup.sh >> /home/student/logs/backup.log 2>&1
```

Both streams are appended to a log, so failures are recorded instead of lost.

## Comparison

### `>` vs `>>`

| | `>` | `>>` |
|---|---|---|
| Existing file | Truncated (emptied) first | Kept; new output added at the end |
| Missing file | Created | Created |
| Typical use | Fresh results, generated files | Logs, accumulating results |
| Risk | Losing data | Files that grow forever |

### `2>&1` vs `&>`

| | `> f 2>&1` | `&> f` |
|---|---|---|
| Effect | Both streams to `f` | Same |
| Portability | POSIX (sh, dash, bash, zsh) | bash/zsh only |

## Common Mistakes

- `cmd 2>&1 > file` and expecting errors in the file — order matters; write `> file 2>&1`.
- `sort data > data` (or `grep x f > f`) — the file is emptied before the command reads it.
- Using `>` where `>>` was meant, destroying a log.
- Writing `2 > file` with a space: that passes `2` as an argument and redirects stdout.
- Piping a command and expecting its errors to be filtered too — pipes carry only stdout.
- Using `&>` in a `#!/bin/sh` script on Debian/Ubuntu (dash runs the command in the background and truncates the file instead).

## Key Takeaways

- FD 0 stdin, FD 1 stdout, FD 2 stderr; redirection rewires them before the command starts.
- `>` overwrite, `>>` append, `<` input, `2>` errors, `2>&1` errors follow stdout, `&>` both (bash).
- Redirections apply left to right: `> file 2>&1` captures both; `2>&1 > file` does not.
- `/dev/null` discards output; `>&2` writes your own errors to stderr.
- Never redirect output onto a file the same command is reading.

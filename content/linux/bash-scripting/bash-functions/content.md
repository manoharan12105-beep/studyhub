# Functions: Arguments, local, return and exit

**Module:** Bash Scripting · **Interview priority:** Frequently asked

## What Is It?

A **function** is a named block of commands inside a script (or your shell). You call it like a command, pass it arguments, and it reports success or failure with an exit status.

```bash
# Illustrative: two equivalent definitions
backup() {
    cp -a "$1" "$1.bak"
}

function backup {
    cp -a "$1" "$1.bak"
}

backup config      # call it like any command
```

## Why It Matters

- Functions remove repetition and give names to steps (`check_disk`, `deploy`, `rollback`), making scripts readable and testable.
- Common helpers — logging with timestamps, `die` on error, argument validation — are written once and reused, or kept in a library file that scripts `source`.
- Interviewers ask: how to return a value from a function, `return` vs `exit`, what `local` does.

## Core Concept

### Arguments

Inside a function, `$1`, `$2`, `$#`, `"$@"` refer to the **function's** arguments, not the script's. `$0` is still the script name.

### Two ways to "return" something

| Channel | How | Use for |
|---------|-----|---------|
| Exit status (0–255) | `return N` (or the status of the last command) | Success / failure; use in `if` and `&&` |
| Output (any text) | `echo` / `printf`, captured with `result=$(func args)` | Data: numbers, strings, lists |

`return` cannot pass a string or a number above 255 — values wrap modulo 256 (`return 300` yields 44).

### Scope: global by default, `local` inside

Variables assigned in a function are **global** unless declared `local`. Forgetting `local` lets helper functions overwrite variables of the caller — a source of subtle bugs.

### return vs exit

| | `return N` | `exit N` |
|---|---|---|
| Ends | The function | The whole script (or the shell, if run interactively) |
| Caller continues | Yes, with `$?` = N | No |
| Typical use | Report success/failure of a step | Abort on a fatal error (`die`) |

### Definition before use

Bash reads a script top to bottom; a function must be defined before the line that calls it runs. Common layout: settings → functions → a `main` function → `main "$@"` at the end.

## Commands

### Defining and calling

```bash
greet() {
    echo "Hello, $1! You passed $# argument(s)."
}
greet Asha
greet Ravi extra
```

**Output:**

```text
Hello, Asha! You passed 1 argument(s).
Hello, Ravi! You passed 2 argument(s).
```

### Global vs local

```bash
counter=10
change() { counter=99; local temp=5; }
change
echo "counter=$counter temp=[$temp]"
```

**Output:**

```text
counter=99 temp=[]
```

`counter` (not local) was overwritten; `temp` existed only inside the function.

### Returning a status

```bash
is_even() {
    (( $1 % 2 == 0 ))
}
for n in 4 7; do
    if is_even "$n"; then echo "$n is even"; else echo "$n is odd"; fi
done
```

**Output:**

```text
4 is even
7 is odd
```

The function's status is the status of its last command, here `(( ))`. Explicit codes describe different failures:

```bash
check_file() {
    [ -f "$1" ] || return 1      # missing
    [ -r "$1" ] || return 2      # not readable
    return 0
}
check_file notes.txt
echo "notes.txt -> $?"
check_file nothing.txt
echo "nothing.txt -> $?"
```

**Output:**

```text
notes.txt -> 0
nothing.txt -> 1
```

Status values are limited to 0–255:

```bash
big() { return 300; }
big
echo "status $?"
```

**Output:**

```text
status 44
```

### Returning data through output

```bash
add() { echo $(( $1 + $2 )); }
sum=$(add 3 4)
echo "sum is $sum"
```

**Output:**

```text
sum is 7
```

Anything the function prints becomes the result — so diagnostic messages inside such a function must go to stderr (`>&2`), or they end up in the captured value.

### Reusable helpers

A logging helper with a fixed format:

```bash
log() {
    local level=$1
    shift
    printf '[%s] %-5s %s\n' "$(date '+%F %T')" "$level" "$*"
}
log INFO "backup started"
log ERROR "disk full on" /var
```

**Output (varies):**

```text
[2026-01-15 09:30:00] INFO  backup started
[2026-01-15 09:30:00] ERROR disk full on /var
```

A `die` helper in a library file, loaded with `source`:

```bash
cat > lib.sh <<'EOF'
die() { echo "error: $*" >&2; exit 1; }
EOF
bash -c 'source ./lib.sh; echo "before"; die "config missing"; echo "after"'
echo "exit status $?"
```

**Output:**

```text
before
error: config missing
exit status 1
```

`die` uses `exit`, so "after" never runs and the script's status is 1.

### Inspecting functions

```bash
type greet | head -n 3
```

**Output:**

```text
greet is a function
greet ()
{
```

`declare -f` prints all function definitions; `unset -f name` removes one.

### Recursion

Functions can call themselves (each call gets its own `local` variables):

```bash
factorial() {
    local n=$1
    if (( n <= 1 )); then echo 1; return; fi
    echo $(( n * $(factorial $((n - 1))) ))
}
factorial 5
```

**Output:**

```text
120
```

Every `$( )` starts a subshell, so deep recursion in bash is slow — fine for teaching, not for heavy computation.

## Examples

### A structured script with `main`

```bash
cat > disk-report.sh <<'EOF'
#!/bin/bash
set -euo pipefail

usage() { echo "usage: $(basename "$0") DIR..." >&2; exit 2; }

size_of() {
    du -sh "$1" 2>/dev/null | cut -f1
}

report() {
    local dir
    for dir in "$@"; do
        if [ -d "$dir" ]; then
            printf '%-10s %s\n' "$dir" "$(size_of "$dir")"
        else
            printf '%-10s %s\n' "$dir" "not a directory" >&2
        fi
    done
}

main() {
    [ $# -ge 1 ] || usage
    report "$@"
}

main "$@"
EOF
bash disk-report.sh config logs project
```

**Output (varies):**

```text
config     12K
logs       3.1M
project    52K
```

(`du` reports allocated disk blocks, so small sizes depend on the filesystem.)

Functions are defined first; `main "$@"` at the bottom runs the script with all its arguments.

## Comparison

### Function vs script vs alias

| | Function | Separate script | Alias |
|---|---|---|---|
| Runs in | Current shell (no new process) | New process | Current shell (text substitution) |
| Can change caller's variables / directory | Yes | No | Yes |
| Arguments | `$1`, `"$@"` | `$1`, `"$@"` | Only appended |
| Reuse across scripts | Via `source lib.sh` | Call it by path | Interactive shells only |

### Status vs output

| | `return N` / last status | `echo` + `$( )` |
|---|---|---|
| Carries | 0–255 | Any text |
| Read with | `if func; then`, `$?` | `var=$(func)` |
| Cost | None | A subshell per call |

## Common Mistakes

- Expecting `return "some text"` to return a string — use output and `$( )`.
- Forgetting `local`, so helper functions overwrite the caller's variables (especially loop variables like `i`, `file`).
- Printing log messages to stdout inside a function whose output is captured.
- Using `exit` in a helper that should only fail one step, terminating the whole script.
- Calling a function before its definition has been read.
- `local x=$(command)` hides `command`'s failure (the status is that of `local`); declare first, then assign: `local x; x=$(command)`.

## Key Takeaways

- Define with `name() { …; }`; call like a command; arguments are `$1…`, `$#`, `"$@"`.
- Variables are global unless declared `local`.
- `return N` gives a 0–255 status (use in `if`); output plus `$( )` returns data.
- `return` ends the function, `exit` ends the script.
- Keep shared helpers in a file and `source` it; structure scripts with a `main "$@"` at the end.

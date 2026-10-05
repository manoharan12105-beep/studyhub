# Conditionals: if, test, [ ], [[ ]] and case

**Module:** Bash Scripting · **Interview priority:** Core

## What Is It?

Bash makes decisions with **exit statuses**. `if` runs a command and takes the `then` branch when that command exits with 0 (success). The "condition" is usually a test command:

```bash
# Illustrative: syntax
if COMMAND; then
    …                       # COMMAND exited 0
elif OTHER_COMMAND; then
    …
else
    …
fi
```

| Test form | Is | Use for |
|-----------|----|---------|
| `[ … ]` (same as `test …`) | A command (builtin), POSIX | Portable scripts (`#!/bin/sh`) |
| `[[ … ]]` | Bash keyword | Bash scripts: safer quoting, `&&`/`\|\|` inside, patterns and regex |
| `(( … ))` | Bash arithmetic | Numeric comparisons with normal operators |
| any command | — | `if grep -q …`, `if ping -c1 …`, `if mkdir …` |

`case` chooses a branch by matching a value against glob patterns — cleaner than long `if/elif` chains on one variable.

## Why It Matters

- Scripts must check before acting: does the file exist, is the argument a number, did the previous command succeed?
- `[ ]` has sharp edges (spaces, quoting, `-eq` vs `=`) that produce some of the most common script errors.
- Interview questions: `[ ]` vs `[[ ]]`, string vs numeric comparison, file test operators, `case` syntax.

## Core Concept

The examples run in a scratch folder inside the lab:

```bash
mkdir -p scripts
cd scripts
```

### `[` is a command, so spaces matter

`[ 5 -gt 3 ]` runs the command `[` with arguments `5`, `-gt`, `3` and `]`. Every part must be a separate word:

| Wrong | Right |
|-------|-------|
| `if [$x -gt 3]` | `if [ "$x" -gt 3 ]` |
| `if ["$a"="$b"]` | `if [ "$a" = "$b" ]` |

A test only sets an exit status:

```bash
[ 5 -gt 3 ]
echo $?
[ 5 -lt 3 ]
echo $?
test -f ../notes.txt && echo "notes.txt exists"
```

**Output:**

```text
0
1
notes.txt exists
```

(These run from `~/linux-lab/scripts`, so lab files are one level up.)

### File tests

| Test | True if |
|------|---------|
| `-e path` | Exists (any type) |
| `-f path` | Is a regular file |
| `-d path` | Is a directory |
| `-L path` | Is a symbolic link |
| `-r` / `-w` / `-x path` | Readable / writable / executable by you |
| `-s path` | Exists and is not empty |
| `a -nt b` / `a -ot b` | `a` is newer / older than `b` (modification time) |

### String tests

| Test | True if |
|------|---------|
| `"$a" = "$b"` | Equal (`==` also works in bash) |
| `"$a" != "$b"` | Not equal |
| `-z "$a"` | Empty (zero length) |
| `-n "$a"` | Not empty |
| `[[ $a == *.log ]]` | Matches a glob pattern (only in `[[ ]]`, pattern unquoted) |
| `[[ $a =~ ^[0-9]+$ ]]` | Matches an extended regex (only in `[[ ]]`) |

### Numeric tests

| `[ ]` / `[[ ]]` | `(( ))` | Meaning |
|-----------------|---------|---------|
| `-eq` | `==` | equal |
| `-ne` | `!=` | not equal |
| `-lt` / `-le` | `<` / `<=` | less than / or equal |
| `-gt` / `-ge` | `>` / `>=` | greater than / or equal |

> [!WARNING]
> Inside `[ ]` and `[[ ]]`, `=` `<` `>` compare **text**, and `-eq` `-lt` `-gt` compare **integers**. `[ "10" \> "9" ]` is false because the text "10" sorts before "9". In `[ ]` an unescaped `>` is even a redirection that creates a file named `9`.

### Combining conditions

| | In `[ ]` | In `[[ ]]` / `(( ))` |
|---|---|---|
| AND | `[ a ] && [ b ]` | `[[ a && b ]]` |
| OR | `[ a ] \|\| [ b ]` | `[[ a \|\| b ]]` |
| NOT | `! [ a ]` or `[ ! a ]` | `[[ ! a ]]` |

(`-a` and `-o` inside `[ ]` are obsolete and ambiguous; avoid them.)

## Commands

### if / elif / else with file tests

```bash
cat > filecheck.sh <<'EOF'
#!/bin/bash
target=$1
if [ -d "$target" ]; then
    echo "$target is a directory"
elif [ -f "$target" ]; then
    echo "$target is a regular file"
else
    echo "$target does not exist"
fi
EOF
bash filecheck.sh ../config
bash filecheck.sh ../notes.txt
bash filecheck.sh ../missing
```

**Output:**

```text
../config is a directory
../notes.txt is a regular file
../missing does not exist
```

More file tests:

```bash
[ -x ../project/build.sh ] || echo "build.sh is not executable"
[ -s ../notes.txt ] && echo "notes.txt is not empty"
```

**Output:**

```text
build.sh is not executable
notes.txt is not empty
```

### String tests and the quoting trap

```bash
[ "abc" = "abc" ] && echo same
[ -z "" ] && echo "empty string"
name=""
[ -n "$name" ] || echo "name is empty"
[ $name = x ]
```

**Output:**

```text
same
empty string
name is empty
bash: [: =: unary operator expected
```

Unquoted and empty, `$name` disappeared, so `[` saw only `= x` — a syntax error. **Quote variables inside `[ ]`**, or use `[[ ]]`, which does not split words.

### Numbers vs text

```bash
[ 10 -gt 9 ] && echo "numeric: 10 > 9"
[ "10" \> "9" ] || echo "text: 10 sorts before 9"
```

**Output:**

```text
numeric: 10 > 9
text: 10 sorts before 9
```

### `[[ ]]` and `(( ))`

```bash
f=report.log
[[ $f == *.log ]] && echo "log file"
[[ $f =~ ^rep ]] && echo "starts with rep"
[[ -f ../app.log && -r ../app.log ]] && echo "readable file"
(( 7 > 3 && 2 < 4 )) && echo "arithmetic true"
```

**Output:**

```text
log file
starts with rep
readable file
arithmetic true
```

Grades with `(( ))` and `elif`:

```bash
cat > grade.sh <<'EOF'
#!/bin/bash
score=$1
if (( score >= 90 )); then
    grade=A
elif (( score >= 75 )); then
    grade=B
elif (( score >= 50 )); then
    grade=C
else
    grade=F
fi
echo "score $score -> grade $grade"
EOF
for s in 95 80 50 12; do bash grade.sh "$s"; done
```

**Output:**

```text
score 95 -> grade A
score 80 -> grade B
score 50 -> grade C
score 12 -> grade F
```

### Any command as a condition

```bash
if grep -q ERROR ../app.log; then
    echo "errors found"
fi
```

**Output:**

```text
errors found
```

No brackets: `if` tests `grep`'s exit status directly. Writing `if [ grep -q ERROR file ]` is a classic mistake.

### case

**Purpose:** branch on one value using glob patterns.

```bash
cat > service.sh <<'EOF'
#!/bin/bash
case "$1" in
    start)
        echo "Starting service" ;;
    stop)
        echo "Stopping service" ;;
    restart|reload)
        echo "Restarting service" ;;
    *.conf)
        echo "Loading config file $1" ;;
    *)
        echo "usage: $0 {start|stop|restart|FILE.conf}" >&2
        exit 2 ;;
esac
EOF
for a in start reload app.conf status; do bash service.sh "$a"; done
```

**Output:**

```text
Starting service
Restarting service
Loading config file app.conf
usage: service.sh {start|stop|restart|FILE.conf}
```

- Each branch ends with `;;`. Patterns are globs: `*`, `?`, `[…]`, and `|` for alternatives.
- The first matching pattern wins; `*)` is the default branch, so it goes last.
- `case … esac` (case spelled backwards), like `if … fi`.

## Examples

### Validate an argument as a positive integer

```bash
cat > retries.sh <<'EOF'
#!/bin/bash
n=${1:-}
if [[ ! $n =~ ^[0-9]+$ ]]; then
    echo "error: '$n' is not a positive integer" >&2
    exit 2
fi
echo "will retry $n times"
EOF
bash retries.sh 3
bash retries.sh three
```

**Output:**

```text
will retry 3 times
error: 'three' is not a positive integer
```

### Interactive yes/no with case

```bash
# Illustrative
read -r -p "Delete old logs? [y/N] " answer
case "$answer" in
    [yY]|[yY][eE][sS]) find /var/log/myapp -name '*.log' -mtime +30 -delete ;;
    *) echo "Nothing deleted" ;;
esac
```

## Comparison

### `[ ]` vs `[[ ]]` vs `(( ))`

| | `[ ]` / `test` | `[[ ]]` | `(( ))` |
|---|---|---|---|
| Type | Command (POSIX) | Bash keyword | Bash arithmetic |
| Unquoted empty variable | Syntax error / wrong result | Safe | Treated as 0 |
| `&&`, `\|\|` inside | No (use between tests) | Yes | Yes |
| Glob match `==  *.log` | No | Yes | — |
| Regex `=~` | No | Yes | — |
| Numeric compare | `-lt`, `-gt`, … | `-lt`, `-gt`, … | `<`, `>`, `==` |
| Works in `sh`/dash | Yes | No | No |

### if/elif vs case

| | `if/elif` | `case` |
|---|---|---|
| Conditions | Any commands and tests | One value against patterns |
| Patterns | Need `[[ == ]]` | Built in (globs, `\|`) |
| Readability for many values | Poor | Good |

## Common Mistakes

- Missing spaces: `[$x -eq 1]`, `if[ … ]`.
- Unquoted variables in `[ ]`: `[ $name = x ]` breaks when `$name` is empty or has spaces.
- Using `=` or `>` for numbers, `-eq` for strings.
- `if [ grep … ]` instead of `if grep …`.
- Forgetting `;;` in `case`, or putting `*)` before more specific patterns.
- Quoting the right side of `==`/`=~` in `[[ ]]` when you want pattern/regex matching (`[[ $f == "*.log" ]]` compares literally).

## Key Takeaways

- `if` tests exit statuses; `[ ]`/`test` and `[[ ]]` are just commands that return 0 or 1.
- File tests `-e -f -d -r -w -x -s`; strings `= != -z -n`; numbers `-eq -ne -lt -le -gt -ge` or `(( ))`.
- Quote variables inside `[ ]`; prefer `[[ ]]` in bash scripts (patterns, regex, `&&`).
- Use commands directly as conditions: `if grep -q …; then`.
- `case "$var" in pattern) … ;; *) … ;; esac` for multi-way choices.

# Quoting, Expansion and Globbing

**Module:** Shell, Bash and Environment · **Interview priority:** Core

## What Is It?

Before running a command, bash rewrites the command line: it replaces `$name` with values, `$(command)` with output, `*.txt` with matching filenames, `{a,b}` with alternatives, `~` with your home directory — and then splits the result into words. This rewriting is called **expansion**. **Quoting** controls which expansions happen.

```text
you type:     echo "Hello $USER" *.txt $(date +%Y)
bash runs:    echo  Hello student  fruits.txt list1.txt …  2026
              └─────────────── the command never sees $USER, *.txt or $(…)
```

## Why It Matters

- Most shell-script bugs are quoting bugs: filenames with spaces split into two, `*` expanding unexpectedly, empty variables disappearing.
- Interviewers love "single vs double quotes", "what does `$(…)` do", "what is globbing".
- Commands passed to `ssh`, `find -exec`, `awk`, `sed` and `grep` must survive the shell first; quoting decides what they receive.

## Core Concept

### Three kinds of quoting

| Quoting | Expands `$var`, `$(…)`, `$((…))` | Expands `*`, `?`, `{a,b}`, `~` | Example |
|---------|-----------------------------------|----------------------------------|---------|
| None | Yes, then splits on whitespace | Yes | `echo $name *.txt` |
| `"double"` | **Yes** (result stays one word) | No | `echo "Hello $name"` |
| `'single'` | **No** — everything literal | No | `echo 'Cost: $5'` |
| `\` backslash | Escapes the next character | — | `echo \$name`, `echo "say \"hi\""` |

```bash
name=Asha
echo 'Hello $name'
echo "Hello $name"
echo Hello \$name
```

**Output:**

```text
Hello $name
Hello Asha
Hello $name
```

Inside double quotes, only `$`, `` ` ``, `\` and `"` keep a special meaning. A single quote cannot appear inside single quotes at all — end the quoted part, add an escaped quote, and start again:

```bash
echo "It's $name's turn"
echo 'It'\''s fine'
echo "Path: \"$HOME\""
```

**Output:**

```text
It's Asha's turn
It's fine
Path: "/home/student"
```

### The order of expansions

Bash expands in this order:

1. **Brace expansion** — `file{1..3}.txt` → `file1.txt file2.txt file3.txt`
2. **Tilde expansion** — `~` → `/home/student`
3. **Parameter, arithmetic and command substitution** (left to right) — `$var`, `$((2+3))`, `$(date)`
4. **Word splitting** — unquoted results are split on spaces, tabs and newlines (`$IFS`)
5. **Pathname expansion (globbing)** — unquoted `*`, `?`, `[…]` are replaced by matching filenames
6. **Quote removal** — the quotes themselves are removed before the command runs

Steps 4 and 5 apply only to **unquoted** results. That is why quoting variables matters.

### Word splitting: why `"$var"` matters

```bash
f="my report.txt"
touch "$f"
ls $f
ls "$f"
rm "$f"
```

**Output:**

```text
ls: cannot access 'my': No such file or directory
ls: cannot access 'report.txt': No such file or directory
'my report.txt'
```

Unquoted, `$f` was split into two arguments. Spacing is also lost:

```bash
msg="  spaced    out  "
echo $msg
echo "$msg"
```

**Output:**

```text
spaced out
  spaced    out
```

> [!IMPORTANT]
> Rule of thumb: **always double-quote variable and command-substitution expansions** — `"$file"`, `"$@"`, `"$(pwd)"` — unless you specifically want splitting and globbing.

### Command substitution: `$(command)`

The command runs and its output (with trailing newlines removed) replaces the expression:

```bash
echo "Files here: $(ls | wc -l)"
echo $(echo $(echo nested))
```

**Output:**

```text
Files here: 13
nested
```

The old form uses backticks: `` `date` ``. Prefer `$( )`: it nests cleanly and is easier to read.

### Arithmetic: `$(( ))`

Integer arithmetic (no decimals):

```bash
echo "Sum: $((7 + 5 * 2))"
x=5
echo "$x + 3 = $((x + 3))"
count=0
((count++))
echo "$count"
```

**Output:**

```text
Sum: 17
5 + 3 = 8
1
```

Operators: `+ - * / %` (integer division and remainder), `**` power, comparisons (`<`, `==`) giving 1/0, and `++`/`--`. `$(( 7 / 2 ))` is `3`; use `bc` or `awk` for decimals.

### Brace expansion

Generates strings — no files need to exist:

```bash
echo {a,b,c}
echo file{1..3}.txt
echo {01..05}
mkdir -p demo/{src,test,docs}
ls demo
cp v1.txt{,.bak}
ls v1.txt*
```

**Output:**

```text
a b c
file1.txt file2.txt file3.txt
01 02 03 04 05
docs  src  test
v1.txt  v1.txt.bak
```

`cp v1.txt{,.bak}` expands to `cp v1.txt v1.txt.bak` — a quick backup idiom. Brace ranges cannot use variables (`{1..$n}` does not work; use `seq 1 "$n"`).

### Tilde expansion

```bash
echo ~
echo "~"
```

**Output:**

```text
/home/student
~
```

Only an unquoted `~` at the start of a word expands.

### Globbing (pathname expansion)

| Pattern | Matches | Example |
|---------|---------|---------|
| `*` | Any string, including empty (not a leading `.`) | `*.log` |
| `?` | Exactly one character | `list?.txt` |
| `[abc]` | One of these characters | `[an]*.txt` |
| `[a-z]`, `[0-9]` | A range | `app-2026-01-0[1-8].log` |
| `[!abc]` or `[^abc]` | Any character except these | `[!.]*` |
| `**` | Any depth of directories (after `shopt -s globstar`) | `src/**/*.java` |

```bash
echo *.txt
echo "*.txt"
echo project/src/*.java
echo list?.txt
echo [an]*.txt
```

**Output:**

```text
fruits.txt list1.txt list2.txt notes.txt numbers.txt v1.txt v2.txt
*.txt
project/src/Main.java project/src/Order.java project/src/OrderService.java project/src/PaymentService.java
list1.txt list2.txt
notes.txt numbers.txt
```

The shell expands the pattern **before** the command runs; `echo` and `ls` just receive filenames. Globs are not regular expressions: `*` alone means "anything", `.` is a literal dot.

When nothing matches, bash leaves the pattern unchanged (unless `shopt -s nullglob` or `failglob` is set):

```bash
echo *.xyz
ls *.xyz
```

**Output:**

```text
*.xyz
ls: cannot access '*.xyz': No such file or directory
```

Hidden files (names starting with `.`) are not matched by `*`; use `.*` or `shopt -s dotglob`:

```bash
echo project/*
echo project/.*
```

**Output:**

```text
project/build.sh project/docs project/readme.md project/src project/test
project/.gitignore
```

(Since bash 5.2, `.*` no longer matches `.` and `..`.)

### printf vs echo

`echo` is simple but inconsistent across shells for options and escapes (`-e`, `-n`). `printf` is predictable:

```bash
printf '%s has %d files\n' "src" 4
printf '%-10s|%5.1f\n' cpu 93.456
```

**Output:**

```text
src has 4 files
cpu       | 93.5
```

## Examples

### Quoting arguments for other programs

```bash
# Illustrative
grep -E 'ERROR|WARN' app.log          # single quotes: the shell must not see | as a pipe
find . -name '*.log'                  # quote the glob so find receives *.log, not a list of files
awk '{print $1}' access.log           # single quotes: $1 is for awk, not the shell
ssh web01 "df -h $MOUNT"              # double quotes: $MOUNT expands locally before sending
ssh web01 'echo $HOSTNAME'            # single quotes: $HOSTNAME expands on the remote host
```

### Loop over files safely

```bash
for f in *.txt; do
    echo "processing $f"
done | head -n 2
```

**Output:**

```text
processing fruits.txt
processing list1.txt
```

A glob in `for` yields one item per file, even with spaces in names — as long as you write `"$f"` inside the loop.

## Comparison

### Single vs double quotes

| | `'single'` | `"double"` |
|---|---|---|
| `$var`, `$(cmd)`, `$((…))` | Literal | Expanded |
| `*`, `?`, `~`, `{a,b}` | Literal | Literal |
| `\` escapes | Literal | Escapes `$ ` `` ` `` `"` `\` |
| Word splitting of the result | — | Prevented |
| Use for | Fixed text, regexes, awk/sed programs | Text containing variables |

### Glob vs regular expression

| | Glob (shell) | Regular expression (`grep`, `sed`, `awk`) |
|---|---|---|
| Matches | Filenames | Text |
| `*` | Any string | Zero or more of the **previous** item |
| `?` | One character | Previous item optional (ERE) |
| `.` | A literal dot | Any character |
| Example: files ending in `.log` | `*.log` | `\.log$` |

### `$(…)` vs backticks

| | `$(command)` | `` `command` `` |
|---|---|---|
| Nesting | Easy: `$(dirname $(pwd))` | Needs escaping |
| Readability | Clear | Easily confused with quotes |
| Status | Preferred, POSIX | Legacy, still works |

## Common Mistakes

- Unquoted variables: `rm $file` breaks on spaces and expands wildcards inside the value.
- Single-quoting text that needs a variable: `echo 'Hello $USER'`.
- Expecting `*` to match hidden files.
- Writing `find . -name *.log` without quotes — the shell expands `*.log` first (if any match exists in the current directory), and `find` gets the wrong arguments.
- Using brace ranges with variables (`{1..$n}`).
- Using `$((…))` for decimals — it is integer-only.
- Assuming a pattern with no matches produces nothing — it stays literal by default.

## Key Takeaways

- Single quotes: everything literal. Double quotes: variables and command substitution expand, splitting and globbing do not. Backslash escapes one character.
- Expansion order: brace → tilde → parameter/arithmetic/command substitution → word splitting → globbing → quote removal.
- Always write `"$var"` and `"$(cmd)"`.
- `$(command)` substitutes output; `$((expr))` does integer arithmetic; `{a,b}`/`{1..5}` generate words.
- Globs: `*`, `?`, `[…]`; not regexes; no match → pattern left as is; hidden files excluded.

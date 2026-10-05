# Pipes and Command Chaining

**Module:** Redirection and Pipes · **Interview priority:** Core

## What Is It?

A **pipe** (`|`) connects the standard output of one command to the standard input of the next, so small tools can be combined into a **pipeline** that does a bigger job:

```text
command1 | command2 | command3

┌──────────┐ stdout  stdin ┌──────────┐ stdout  stdin ┌──────────┐
│ command1 │──────►══════─►│ command2 │──────►══════─►│ command3 │──► terminal
└──────────┘     pipe      └──────────┘     pipe      └──────────┘
```

**Command chaining** operators decide whether the next command runs at all:

| Operator | Runs the next command |
|----------|-----------------------|
| `;` | Always, after the previous one finishes |
| `&&` | Only if the previous one **succeeded** (exit status 0) |
| `\|\|` | Only if the previous one **failed** (non-zero status) |

## Why It Matters

- This is the Unix philosophy in practice: each tool does one thing well, and pipes combine them. Most log analysis on servers is a one-line pipeline.
- `&&` makes multi-step commands safe: `cd build && rm -r *` deletes nothing if `cd` fails.
- Exit statuses in pipelines (`pipefail`) decide whether scripts and CI jobs detect failures.

## Core Concept

### How a pipeline runs

- The shell starts **all** commands in the pipeline at the same time, each as its own process, and connects them with kernel pipe buffers.
- Data flows as it is produced: `command2` starts working on the first lines before `command1` has finished. That is why `tail -f app.log | grep ERROR` shows errors live.
- If a reader stops early (`head -n 1`), the writer gets `SIGPIPE` on its next write and stops — so `big-command | head` is cheap.
- Only **stdout** flows through the pipe. stderr still goes to the terminal unless you add `2>&1` (or use `|&` in bash).

### Building a pipeline step by step

The way to write a pipeline is to add one stage at a time and look at the output after each. Question: **which IP address made the most requests?**

Stage 1 — extract the first field (the IP) from every line:

```bash
cut -d' ' -f1 access.log | head -n 4
```

**Output:**

```text
192.168.1.10
192.168.1.11
192.168.1.10
10.0.0.5
```

Stage 2 — sort, so identical IPs become adjacent:

```bash
cut -d' ' -f1 access.log | sort
```

**Output:**

```text
10.0.0.5
10.0.0.5
10.0.0.5
192.168.1.10
192.168.1.10
192.168.1.10
192.168.1.10
192.168.1.11
192.168.1.11
192.168.1.12
```

Stage 3 — count adjacent duplicates:

```bash
cut -d' ' -f1 access.log | sort | uniq -c
```

**Output:**

```text
      3 10.0.0.5
      4 192.168.1.10
      2 192.168.1.11
      1 192.168.1.12
```

Stage 4 — sort by the count, numerically, largest first:

```bash
cut -d' ' -f1 access.log | sort | uniq -c | sort -rn
```

**Output:**

```text
      4 192.168.1.10
      3 10.0.0.5
      2 192.168.1.11
      1 192.168.1.12
```

`cut`, `sort` and `uniq` are covered in the Text Processing module; the point here is the method — **one stage, check, next stage**.

### Filters

A **filter** reads stdin, transforms it and writes stdout, so it can sit anywhere in a pipeline: `grep`, `sort`, `uniq`, `cut`, `tr`, `wc`, `head`, `tail`, `sed`, `awk`. Commands that ignore stdin — `ls`, `echo`, `rm`, `cp` — cannot be fed by a pipe; to turn piped text into arguments for them, use `xargs` (see [xargs and tee](../../text-processing/xargs-and-tee/content.md)).

### Exit status of a pipeline

Every command returns an **exit status**: 0 means success, anything else failure. `$?` holds the status of the last command. For a pipeline, `$?` is the status of the **last** command only:

```bash
false | true
echo "status: $?"
false | true
echo "PIPESTATUS: ${PIPESTATUS[@]}"
set -o pipefail
false | true
echo "with pipefail: $?"
set +o pipefail
```

**Output:**

```text
status: 0
PIPESTATUS: 1 0
with pipefail: 1
```

- `PIPESTATUS` (bash) is an array with every command's status.
- With `set -o pipefail`, the pipeline fails if **any** command fails — essential in scripts, otherwise `broken-command | tee log` looks successful.

## Commands

### `;` — run in sequence

```bash
echo one; echo two
```

**Output:**

```text
one
two
```

### `&&` — run if the previous succeeded

```bash
mkdir -p build && cd build && echo "in build"
cd ~/linux-lab
cd nosuch && echo "never printed"
```

**Output:**

```text
in build
bash: cd: nosuch: No such file or directory
```

Typical uses: `./configure && make && make install`, `cd /srv/app && git pull`, `apt update && apt upgrade`.

> [!CAUTION]
> `cd /some/dir; rm -r *` deletes the contents of the **current** directory if `cd` fails. Always use `cd /some/dir && rm -r *` — or better, `rm -r /some/dir/*`.

### `||` — run if the previous failed

```bash
ls nosuch || echo "listing failed"
```

**Output:**

```text
ls: cannot access 'nosuch': No such file or directory
listing failed
```

A common script idiom: `cd "$dir" || exit 1`.

### `&& … ||` is not if/else

```bash
true && echo yes || echo no
false && echo yes || echo no
true && false || echo "runs although the first command succeeded"
```

**Output:**

```text
yes
no
runs although the first command succeeded
```

`a && b || c` runs `c` when **either** `a` or `b` fails. Use a real `if` when `b` can fail.

### Testing silently in a chain

```bash
grep -q 'app.port' config/app.conf && echo "port configured"
```

**Output:**

```text
port configured
```

### Grouping: `{ }` and `( )`

Group commands to redirect or pipe their combined output:

```bash
{ echo "name,salary"; tail -n +2 employees.csv | sort -t, -k4 -nr | head -n 2 | cut -d, -f2,4; } > top.txt
cat top.txt
```

**Output:**

```text
name,salary
meena,92000
asha,85000
```

- `{ cmd1; cmd2; }` runs in the **current** shell (note the spaces and the final `;`).
- `( cmd1; cmd2 )` runs in a **subshell** — a child process — so `cd` and variable changes inside do not affect you:

```bash
(cd project && ls)
pwd
```

**Output:**

```text
build.sh  docs  readme.md  src  test
/home/student/linux-lab
```

## Examples

### Live filtering

```bash
# Illustrative: runs until Ctrl+C
tail -f app.log | grep --line-buffered ERROR
```

`--line-buffered` makes `grep` pass each match on immediately when its output is another pipe.

### Count errors, warnings and the rest

```bash
grep ERROR app.log | wc -l
grep -c WARN app.log
```

**Output:**

```text
3
2
```

`grep -c` counts directly; the pipeline form is shown because the same pattern works with any filter in front of `wc -l`.

### A pipeline that "succeeds" with no data

```bash
grep nomatch app.log | sort
echo "status: $?"
```

**Output:**

```text
status: 0
```

`grep` found nothing and returned 1, but `$?` reports `sort`'s 0. With `set -o pipefail` the status would be 1.

## Comparison

### `;` vs `&&` vs `||`

| | `a ; b` | `a && b` | `a \|\| b` |
|---|---|---|---|
| `b` runs when `a` succeeds | Yes | Yes | No |
| `b` runs when `a` fails | Yes | No | Yes |
| Use for | Independent commands | Steps that depend on each other | Fallbacks, error handling |

### Pipe vs redirection

| | `\|` | `>` / `<` |
|---|---|---|
| Connects | A command to another command | A command to a file |
| Data stored | No — streamed through a kernel buffer | Yes — in the file |
| Commands run | Concurrently | One |

### `{ }` vs `( )`

| | `{ list; }` | `( list )` |
|---|---|---|
| Runs in | Current shell | Subshell (child process) |
| `cd`, variables persist | Yes | No |
| Syntax | Spaces inside braces, `;` before `}` | Free |

## Common Mistakes

- `cat file | grep x` — "useless use of cat"; `grep x file` does the same. (Harmless, but interviewers notice.)
- Piping into commands that do not read stdin: `find . -name '*.tmp' | rm` does nothing useful; use `xargs rm` or `find -delete`.
- Using `;` where `&&` is needed, so later steps run after a failure.
- Treating `a && b || c` as if-then-else.
- Forgetting that pipeline status is the last command's unless `pipefail` is set.
- Expecting `cd` inside `( )` or inside a pipeline stage to change your shell's directory.

## Key Takeaways

- `|` sends stdout of one command into stdin of the next; all stages run concurrently.
- Build pipelines one stage at a time, checking output after each stage.
- `;` always · `&&` on success · `||` on failure; `a && b || c` is not if/else.
- `$?` is the last command's status; `PIPESTATUS` holds all; `set -o pipefail` makes any failure count.
- `{ }` groups in the current shell; `( )` groups in a subshell.

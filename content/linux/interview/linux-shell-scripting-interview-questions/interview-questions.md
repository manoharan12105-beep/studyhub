# Shell and Bash Scripting Interview Questions — Interview Questions

## Beginner

### Q1. What is a shebang line?

<details>
<summary>Answer</summary>

The first line of a script starting with `#!`, naming the interpreter the kernel should run it with: `#!/bin/bash`, `#!/usr/bin/env bash` (finds bash via `PATH`), `#!/usr/bin/env python3`. Without it, the script runs with whatever shell launches it, and bash-only syntax may fail under `sh`.

</details>

### Q2. What is the difference between a shell variable and an environment variable?

<details>
<summary>Answer</summary>

A shell variable (`name=value`) exists only in the current shell. An environment variable has been **exported** (`export name=value`) and is copied into every child process the shell starts. `env`/`printenv` list the environment; `set` lists all variables and functions.

</details>

### Q3. What is the difference between single and double quotes?

<details>
<summary>Answer</summary>

Single quotes keep everything literal — no variable, command or escape expansion: `'$HOME'` prints `$HOME`. Double quotes allow `$var`, `$(cmd)` and `\` escapes but prevent word splitting and globbing: `"$HOME"` prints `/home/student` as one word. Quote variables by default.

</details>

### Q4. What is an exit status, and how do you check it?

<details>
<summary>Answer</summary>

Every command returns an integer 0–255: `0` means success, anything else failure (`1` general error, `2` misuse, `126` not executable, `127` command not found, `128+N` killed by signal N). `$?` holds the last status; `if cmd; then`, `cmd && next`, `cmd || handle_error` test it directly; `exit N` sets a script's status.

</details>

### Q5. How do you read the arguments passed to a script?

<details>
<summary>Answer</summary>

`$1`, `$2`, … are the positional parameters, `$0` the script name, `$#` the number of arguments, `"$@"` all arguments as separate words. `shift` drops `$1` and moves the rest down. Validate them: `[ $# -eq 1 ] || { echo "usage: $0 file" >&2; exit 1; }`.

</details>

## Intermediate

### Q6. What is the difference between `"$@"` and `"$*"`?

<details>
<summary>Answer</summary>

`"$@"` expands to each argument as a separate word, preserving spaces inside arguments; `"$*"` joins all arguments into one word (separated by the first character of `IFS`).

```bash
set -- "a b" c
for x in "$@"; do echo "[$x]"; done
for x in "$*"; do echo "[$x]"; done
echo "$#"
```

**Output:**

```text
[a b]
[c]
[a b c]
2
```

Use `"$@"` to pass arguments on unchanged.

</details>

### Q7. What does `set -euo pipefail` do?

<details>
<summary>Answer</summary>

`-e` exits the script when a command fails (with exceptions in conditions and `&&`/`||` lists); `-u` treats unset variables as errors; `-o pipefail` makes a pipeline fail if **any** command in it fails, not just the last:

```bash
bash -c 'false | true; echo "without pipefail: $?"; set -o pipefail; false | true; echo "with pipefail: $?"'
```

**Output:**

```text
without pipefail: 0
with pipefail: 1
```

Together they turn silent failures into early, visible ones. They have pitfalls (`grep` with no match returns 1), so handle expected non-zero statuses explicitly (`grep … || true`).

</details>

### Q8. What is the difference between `[ ]`, `[[ ]]` and `(( ))`?

<details>
<summary>Answer</summary>

`[ ]` (`test`) is the portable POSIX command: quote variables, use `-eq`/`-lt` for numbers and `=` for strings. `[[ ]]` is a bash keyword: no word splitting, supports `&&`/`||` inside, pattern matching (`[[ $f == *.log ]]`) and regex (`=~`). `(( ))` evaluates integer arithmetic with C-like operators: `(( count > 10 ))`.

</details>

### Q9. How do you strip a file extension or a prefix without calling external commands?

<details>
<summary>Answer</summary>

Parameter expansion: `${var%pattern}` removes the shortest matching suffix, `%%` the longest; `#`/`##` do the same for prefixes; `${#var}` is the length.

```bash
f="app-2026-01-08.log"
echo "${f%.log}" "${f#app-}" "${f%%-*}" "${#f}"
```

**Output:**

```text
app-2026-01-08 2026-01-08.log app 18
```

</details>

### Q10. How do you read a file line by line correctly?

<details>
<summary>Answer</summary>

```bash
# Illustrative
while IFS= read -r line; do
    printf '%s\n' "$line"
done < input.txt
```

`IFS=` keeps leading and trailing spaces, `-r` keeps backslashes, and redirecting the file (instead of `cat file | while`) keeps variables set in the loop, because no pipeline subshell is involved. `for line in $(cat file)` is wrong: it splits on every space.

</details>

### Q11. Write a one-liner that prints the total salary per department from `employees.csv` (columns `id,name,dept,salary,city`).

<details>
<summary>Answer</summary>

```bash
cd ~/linux-lab
awk -F, 'NR > 1 { total[$3] += $4 } END { for (d in total) print d, total[d] }' employees.csv | sort
```

**Output:**

```text
engineering 255000
hr 98000
sales 158000
```

`-F,` sets the field separator, `NR > 1` skips the header, an associative array accumulates per department, and `sort` makes the order predictable (awk's `for … in` order is unspecified).

</details>

### Q12. What is the difference between `source script.sh` and `./script.sh`?

<details>
<summary>Answer</summary>

`./script.sh` runs the script in a new child process: its variables, `cd` and functions vanish when it ends, and it needs execute permission. `source script.sh` (or `. script.sh`) executes the commands in the **current** shell, so changes persist — used for `~/.bashrc`, environment files and activating virtual environments.

</details>

## Advanced

### Q13. Write a script that deletes `.log` files older than 7 days in a directory given as an argument, safely.

<details>
<summary>Answer</summary>

```bash
# Illustrative
#!/usr/bin/env bash
set -euo pipefail

dir="${1:?usage: $0 <directory>}"
[[ -d "$dir" ]] || { echo "not a directory: $dir" >&2; exit 1; }

find "$dir" -type f -name '*.log' -mtime +7 -print -delete
```

The argument is required (`${1:?}`), checked, quoted everywhere; `find` handles any file name; `-print` logs what is deleted. Run once with `-print` only (no `-delete`) as a dry run first.

</details>

### Q14. How do you handle cleanup when a script exits or is interrupted?

<details>
<summary>Answer</summary>

Use `trap`:

```bash
# Illustrative
tmp=$(mktemp)
trap 'rm -f "$tmp"' EXIT
trap 'echo "interrupted" >&2; exit 130' INT TERM
```

The `EXIT` trap runs whenever the script ends — normally, through `exit`, or after `set -e` aborts — so temporary files and locks are always removed.

</details>

### Q15. How do you process file names that contain spaces or newlines from `find`?

<details>
<summary>Answer</summary>

Use null-terminated names: `find . -name '*.tmp' -print0 | xargs -0 rm --`, or let `find` run the command: `find . -name '*.tmp' -exec rm -- {} +`. In a loop: `while IFS= read -r -d '' f; do …; done < <(find . -name '*.tmp' -print0)`. Never parse `ls` output.

</details>

### Q16. How would you make sure only one instance of a cron-driven script runs at a time?

<details>
<summary>Answer</summary>

Use a lock with `flock`: in cron, `flock -n /tmp/job.lock /opt/job.sh`, or inside the script:

```bash
# Illustrative
exec 9> /tmp/job.lock
flock -n 9 || { echo "already running" >&2; exit 1; }
```

The kernel releases the lock automatically when the process exits, even after a crash — unlike PID files, which can go stale.

</details>

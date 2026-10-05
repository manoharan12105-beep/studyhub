# Bash Script Basics — Interview Questions

## Beginner

### Q1. What is a shebang?

<details>
<summary>Answer</summary>

The first line of a script starting with `#!`, followed by the interpreter path — `#!/bin/bash`. When the file is executed directly (`./script.sh`), the kernel runs that interpreter with the script as its argument. `#!/usr/bin/env bash` finds bash via `PATH` for portability.

</details>

### Q2. How do you create and run a shell script?

<details>
<summary>Answer</summary>

Write the commands in a file with a shebang, make it executable with `chmod +x script.sh`, and run `./script.sh` (or `bash script.sh` without the execute bit). Put it in a directory on `PATH` to run it by name.

</details>

### Q3. What do `$0`, `$1`, `$#`, `$@` and `$?` mean?

<details>
<summary>Answer</summary>

`$0` the script name; `$1`, `$2`… the positional arguments; `$#` the number of arguments; `$@` all arguments (as separate words when quoted, `"$@"`); `$?` the exit status of the last command.

</details>

### Q4. How do you read user input in a script?

<details>
<summary>Answer</summary>

`read -r -p "Enter name: " name` stores a line from standard input in `name`. `-s` hides typing (passwords), `-t` sets a timeout, `-a` reads into an array. Input can also come from a pipe or file: `while read -r line; do …; done < file`.

</details>

### Q5. What does exit status 0 mean?

<details>
<summary>Answer</summary>

Success. Any non-zero value (1–255) signals failure; conventions include 1 for general errors, 2 for usage errors, 126 not executable, 127 command not found, and 128+N for termination by signal N.

</details>

## Intermediate

### Q6. What is the difference between `"$@"` and `"$*"`?

<details>
<summary>Answer</summary>

`"$@"` expands to each argument as a separate word, preserving spaces inside arguments — correct for loops and forwarding (`exec java "$@"`). `"$*"` joins all arguments into a single word separated by the first character of `IFS` (a space). Unquoted, both undergo word splitting and globbing.

</details>

### Q7. What is the difference between running `./script.sh`, `bash script.sh` and `source script.sh`?

<details>
<summary>Answer</summary>

`./script.sh` needs execute permission and uses the shebang's interpreter in a new process. `bash script.sh` explicitly uses bash in a new process and needs only read permission. `source script.sh` runs the commands in the **current** shell, so variables, functions and `cd` persist afterwards.

</details>

### Q8. What does `set -euo pipefail` do?

<details>
<summary>Answer</summary>

`-e` exits on the first failing command (outside conditions), `-u` makes references to unset variables an error, `-o pipefail` makes a pipeline fail if any stage fails. Together they stop a script at the first problem instead of continuing with bad state. Expected failures must then be handled explicitly (`cmd || true`, `if cmd; then`).

</details>

### Q9. How do you debug a bash script?

<details>
<summary>Answer</summary>

Run it with `bash -x script.sh` (or add `set -x` around the suspect section) to print each command after expansion. Add `PS4='+ ${LINENO}: '` to show line numbers. `bash -n script.sh` checks syntax without running. `shellcheck script.sh` finds common bugs such as unquoted variables.

</details>

## Advanced

### Q10. Why might a script fail with `/bin/bash^M: bad interpreter`?

<details>
<summary>Answer</summary>

It was saved with Windows line endings (CRLF). The kernel reads the shebang as `/bin/bash\r` and cannot find that interpreter. Convert with `dos2unix script.sh` or `sed -i 's/\r$//' script.sh`, and configure the editor or Git (`core.autocrlf`, `.gitattributes`) to keep LF.

</details>

### Q11. What are the pitfalls of `set -e`?

<details>
<summary>Answer</summary>

It is not applied inside `if`/`while` conditions, in commands joined with `&&`/`||` (except the last), or in functions called from such contexts, so failures can still be ignored. A command that legitimately returns non-zero (`grep` with no match, `diff` with differences) stops the script unless handled. Command substitution in `local x=$(cmd)` hides the failure because `local` succeeds. Use it, but also check critical results explicitly.

</details>

### Q12. How do you make a script print a usage message and fail when called without arguments?

<details>
<summary>Answer</summary>

```bash
# Illustrative
if [ $# -lt 1 ]; then
    echo "usage: $(basename "$0") FILE..." >&2
    exit 2
fi
```

Send the message to stderr and exit with a non-zero (conventionally 2) status so callers and CI see the failure.

</details>

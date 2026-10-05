# Functions — Interview Questions

## Beginner

### Q1. How do you define and call a function in bash?

<details>
<summary>Answer</summary>

`name() { commands; }` (or `function name { commands; }`), then call it by name with arguments like a command: `name arg1 arg2`. It must be defined before the call is executed.

</details>

### Q2. How do functions receive arguments?

<details>
<summary>Answer</summary>

Through positional parameters inside the function: `$1`, `$2`, `$#`, `"$@"`. These shadow the script's own arguments while the function runs. `$0` remains the script name.

</details>

### Q3. What does `local` do?

<details>
<summary>Answer</summary>

It makes a variable local to the function (and functions it calls). Without `local`, every assignment in a function changes a global variable that the rest of the script sees.

</details>

## Intermediate

### Q4. How do you return a value from a bash function?

<details>
<summary>Answer</summary>

Two ways: the exit status with `return N` (0–255, meaning success/failure, tested with `if func`), or data by printing it and capturing the output: `result=$(func args)`. `return` cannot carry strings, and values above 255 wrap around.

</details>

### Q5. What is the difference between `return` and `exit` in a function?

<details>
<summary>Answer</summary>

`return` ends only the function and gives the caller a status in `$?`. `exit` ends the entire script (or your interactive shell if the function was defined there). Use `exit` deliberately, e.g. in a `die` helper for fatal errors.

</details>

### Q6. Why might log messages appear inside a variable after `result=$(myfunc)`?

<details>
<summary>Answer</summary>

Command substitution captures everything the function writes to stdout, including `echo "processing…"` lines. Write diagnostics to stderr (`echo "processing…" >&2`) and only the result to stdout.

</details>

### Q7. How do you share functions between several scripts?

<details>
<summary>Answer</summary>

Put them in a library file (e.g. `lib/common.sh`) and load it with `source` (or `.`) at the top of each script: `source "$(dirname "$0")/lib/common.sh"`. Sourcing runs the file in the current shell, so its functions become available.

</details>

## Advanced

### Q8. Why does `local out=$(failing_command)` not stop a script with `set -e`?

<details>
<summary>Answer</summary>

The statement's exit status is that of the `local` builtin, which succeeds, so the failure of the command substitution is lost. Split it: `local out` then `out=$(failing_command)` — now the assignment's status is the command's, and `set -e` (or an explicit check) sees it.

</details>

### Q9. What does `return 300` return, and why?

<details>
<summary>Answer</summary>

44. Exit statuses are stored in 8 bits, so values are taken modulo 256 (300 − 256 = 44). Statuses above 125 also collide with special meanings (126/127 for exec errors, 128+N for signals), so keep function statuses small.

</details>

### Q10. Why is a `main` function at the bottom of a script considered good practice?

<details>
<summary>Answer</summary>

It guarantees all functions are defined before any code runs, keeps global state minimal (variables can be `local` to `main`), makes the entry point obvious, and lets the file be sourced for testing without executing (`[[ ${BASH_SOURCE[0]} == "$0" ]] && main "$@"`).

</details>

# Loops — Interview Questions

## Beginner

### Q1. Write a loop that prints the numbers 1 to 5.

<details>
<summary>Answer</summary>

```bash
# Illustrative
for i in {1..5}; do echo "$i"; done
# or
for ((i = 1; i <= 5; i++)); do echo "$i"; done
# or
i=1; while [ "$i" -le 5 ]; do echo "$i"; i=$((i + 1)); done
```

</details>

### Q2. How do you loop over all `.log` files in a directory?

<details>
<summary>Answer</summary>

`for f in /var/log/myapp/*.log; do echo "$f"; done`. The glob gives one item per file even with spaces in names, as long as `"$f"` is quoted inside the loop. Guard against no matches with `[ -e "$f" ] || continue` or `shopt -s nullglob`.

</details>

### Q3. What is the difference between `while` and `until`?

<details>
<summary>Answer</summary>

`while COND` repeats while the condition command succeeds (exit 0); `until COND` repeats while it fails, i.e. until it succeeds. `until curl -sf http://localhost:8080/health; do sleep 2; done` waits for a service.

</details>

### Q4. What do `break` and `continue` do?

<details>
<summary>Answer</summary>

`break` exits the innermost loop (`break N` exits N levels). `continue` skips the rest of the current iteration and starts the next one.

</details>

## Intermediate

### Q5. How do you read a file line by line in bash?

<details>
<summary>Answer</summary>

```bash
# Illustrative
while IFS= read -r line; do
    printf '%s\n' "$line"
done < file.txt
```

`IFS=` preserves leading/trailing whitespace, `-r` keeps backslashes, and redirecting after `done` keeps the loop in the current shell. A last line without a trailing newline is skipped unless you add `|| [ -n "$line" ]` to the condition.

</details>

### Q6. Why is `for line in $(cat file)` wrong for reading lines?

<details>
<summary>Answer</summary>

Command substitution output is split on all whitespace (spaces and tabs too, per `IFS`) and then globbed, so a line like `hello world *` becomes three items, with `*` replaced by filenames. It also reads the whole file into memory first. Use `while IFS= read -r line`.

</details>

### Q7. Why is a counter incremented inside `cat file | while read …` still 0 after the loop?

<details>
<summary>Answer</summary>

Each part of a pipeline runs in a subshell; the `while` loop increments a copy of the variable that disappears when the pipeline ends. Use `while …; done < file` or `done < <(command)`, or `shopt -s lastpipe` in scripts.

</details>

### Q8. Sum the third column of a CSV file in bash.

<details>
<summary>Answer</summary>

```bash
# Illustrative
total=0
while IFS=, read -r _ _ value _; do
    total=$((total + value))
done < data.csv
echo "$total"
```

(`awk -F, '{s += $3} END {print s}' data.csv` is shorter and handles decimals — mention that bash arithmetic is integer-only.)

</details>

## Advanced

### Q9. Write a retry loop that tries a command up to 5 times with a growing delay.

<details>
<summary>Answer</summary>

```bash
# Illustrative
for attempt in 1 2 3 4 5; do
    if curl -sf https://api.internal/health > /dev/null; then
        echo "healthy"; exit 0
    fi
    echo "attempt $attempt failed, retrying in $((attempt * 2))s" >&2
    sleep $((attempt * 2))
done
echo "service did not become healthy" >&2
exit 1
```

</details>

### Q10. When should you not use a bash loop?

<details>
<summary>Answer</summary>

When a single tool does the job over many items more efficiently and safely: `find … -exec cmd {} +` or `-delete` instead of looping over files, `awk` or `sort | uniq -c` instead of looping over lines to aggregate, `xargs -P` for parallel work. A bash loop starts processes per iteration, which is slow for thousands of items, and line handling in bash is error-prone.

</details>

### Q11. How do you loop over lines that may contain spaces from a command's output?

<details>
<summary>Answer</summary>

`while IFS= read -r line; do …; done < <(command)`. For filenames that may contain newlines, use NUL separators: `while IFS= read -r -d '' f; do …; done < <(find . -type f -print0)`.

</details>

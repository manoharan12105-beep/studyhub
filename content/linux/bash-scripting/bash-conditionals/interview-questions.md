# Conditionals — Interview Questions

## Beginner

### Q1. How do you check whether a file exists in a bash script?

<details>
<summary>Answer</summary>

`if [ -f "$file" ]; then …; fi` for a regular file, `-d` for a directory, `-e` for anything. Quote the variable so names with spaces work.

</details>

### Q2. How do you compare two numbers in bash?

<details>
<summary>Answer</summary>

`[ "$a" -lt "$b" ]` (also `-eq -ne -le -gt -ge`), or arithmetic: `(( a < b ))`. Do not use `<` or `=` inside `[ ]` for numbers — they compare text.

</details>

### Q3. How do you check whether a string is empty?

<details>
<summary>Answer</summary>

`[ -z "$s" ]` is true for an empty string; `[ -n "$s" ]` for a non-empty one. The quotes are essential: unquoted, an empty variable vanishes and the test becomes `[ -n ]`, which is always true.

</details>

### Q4. Write the syntax of a `case` statement.

<details>
<summary>Answer</summary>

```bash
# Illustrative
case "$1" in
    start)          echo starting ;;
    stop|halt)      echo stopping ;;
    *.txt)          echo "text file" ;;
    *)              echo "unknown" ;;
esac
```

Patterns are globs, `|` separates alternatives, each branch ends with `;;`, and `*)` catches everything else.

</details>

## Intermediate

### Q5. What is the difference between `[ ]` and `[[ ]]`?

<details>
<summary>Answer</summary>

`[` is a command (POSIX `test`), so its arguments undergo word splitting and globbing — variables must be quoted, and `&&`/`||` cannot be used inside. `[[ ]]` is bash syntax: no word splitting of variables, `&&`/`||`/`!` inside, glob matching with `==` and regex with `=~`. `[[ ]]` is safer in bash scripts; `[ ]` is required for portable `sh` scripts.

</details>

### Q6. Why does `[ $name = admin ]` fail with "unary operator expected"?

<details>
<summary>Answer</summary>

When `$name` is empty and unquoted, it disappears, so `[` receives `= admin ]` — an operator with a missing operand. Write `[ "$name" = admin ]` or use `[[ $name = admin ]]`.

</details>

### Q7. How do you use the result of a command in an `if` without brackets?

<details>
<summary>Answer</summary>

`if` runs any command and checks its exit status: `if grep -q ERROR app.log; then …`, `if ping -c1 -W1 host >/dev/null; then …`, `if mkdir "$dir"; then …`. Brackets are only needed for test expressions.

</details>

### Q8. What does `[[ $file == *.log ]]` do, and what changes if you quote `"*.log"`?

<details>
<summary>Answer</summary>

Unquoted on the right side, `*.log` is a glob pattern, so the test is true for any name ending in `.log`. Quoted, it is compared literally — true only if `$file` is exactly `*.log`.

</details>

### Q9. How do you check that a variable holds a number?

<details>
<summary>Answer</summary>

`[[ $n =~ ^[0-9]+$ ]]` for a non-negative integer (`^-?[0-9]+$` to allow a minus sign). Unquoted regex on the right of `=~`; bash puts capture groups in `BASH_REMATCH`.

</details>

## Advanced

### Q10. Why is `[ "10" \> "9" ]` false, and what happens with `[ 10 > 9 ]`?

<details>
<summary>Answer</summary>

`\>` inside `[ ]` is a string comparison by collation, and the string "10" sorts before "9". `[ 10 > 9 ]` without the backslash is parsed as `[ 10 ]` with stdout redirected to a file named `9` — it creates that file and returns true because "10" is a non-empty string. Use `-gt` or `(( 10 > 9 ))`.

</details>

### Q11. How would you check several conditions on a file before processing it?

<details>
<summary>Answer</summary>

```bash
# Illustrative
if [[ -f $file && -r $file && -s $file ]]; then
    process "$file"
elif [[ ! -e $file ]]; then
    echo "missing: $file" >&2; exit 1
else
    echo "unreadable or empty: $file" >&2; exit 1
fi
```

Order the cheapest and most common checks first, report the specific problem on stderr, and exit non-zero.

</details>

# Quoting, Expansion and Globbing — Interview Questions

## Beginner

### Q1. What is the difference between single and double quotes in bash?

<details>
<summary>Answer</summary>

Single quotes make everything literal: `'$HOME'` prints `$HOME`. Double quotes allow variable expansion, command substitution and arithmetic (`"$HOME"` prints `/home/student`) but prevent word splitting and globbing of the result. Neither expands `*` or `~`.

</details>

### Q2. What does `$(command)` do?

<details>
<summary>Answer</summary>

Command substitution: the command runs and its standard output, with trailing newlines removed, replaces the expression — `today=$(date +%F)`. Backticks are the older equivalent; `$( )` nests and reads better.

</details>

### Q3. What is globbing?

<details>
<summary>Answer</summary>

Pathname expansion performed by the shell: unquoted `*` (any string), `?` (one character) and `[…]` (one character from a set) are replaced by the matching filenames before the command runs. `ls *.log` receives the list of `.log` files, not the pattern.

</details>

### Q4. How do you do arithmetic in bash?

<details>
<summary>Answer</summary>

`$(( expression ))` for integers: `echo $((3 * 4))`, `count=$((count + 1))` or `((count++))`. It does not support decimals; use `bc` or `awk` for floating point.

</details>

## Intermediate

### Q5. Why should you quote variables, e.g. `rm "$file"` instead of `rm $file`?

<details>
<summary>Answer</summary>

Unquoted expansions undergo word splitting and globbing. If `file="my report.txt"`, `rm $file` tries to remove `my` and `report.txt`; if the value contains `*`, it expands to many files; if it is empty, the argument disappears entirely, which can change the command's meaning. Quoting keeps the value as exactly one argument.

</details>

### Q6. What order does bash perform expansions in?

<details>
<summary>Answer</summary>

Brace expansion, tilde expansion, then parameter/variable expansion, arithmetic expansion and command substitution (left to right), then word splitting, then pathname expansion (globbing), and finally quote removal.

</details>

### Q7. What happens when a glob matches no files?

<details>
<summary>Answer</summary>

By default bash leaves the pattern unchanged, so the command receives the literal text (e.g. `ls *.xyz` → "cannot access '*.xyz'"). With `shopt -s nullglob` it expands to nothing; with `failglob` the command fails with an error. Scripts that loop over globs often set `nullglob`.

</details>

### Q8. Why does `find . -name *.log` sometimes work and sometimes fail?

<details>
<summary>Answer</summary>

The unquoted `*.log` is expanded by the shell before `find` runs. If no `.log` file exists in the current directory, the pattern is passed literally and `find` works. If exactly one exists, `find` receives that filename and searches only for files with that exact name. If several exist, `find` gets extra arguments and errors ("paths must precede expression"). Quote it: `find . -name '*.log'`.

</details>

### Q9. What is brace expansion? Give a practical use.

<details>
<summary>Answer</summary>

It generates strings from a comma list or range, regardless of existing files: `mkdir -p app/{src,test,docs}`, `touch log{1..5}.txt`, `cp config.yml{,.bak}` (copy to `config.yml.bak`). It happens before variable expansion, so `{1..$n}` does not work.

</details>

## Advanced

### Q10. Explain the output of `echo "$var"` vs `echo $var` when `var="a   *   b"` in a directory containing `x.txt`.

<details>
<summary>Answer</summary>

`echo "$var"` prints `a   *   b` exactly. `echo $var` splits the value into `a`, `*`, `b`, then globs `*` into `x.txt`, and `echo` joins its arguments with single spaces: `a x.txt b`.

</details>

### Q11. How do you pass a variable into an `awk` program or a remote `ssh` command correctly?

<details>
<summary>Answer</summary>

For awk, keep the program in single quotes and pass the value with `-v`: `awk -v min="$limit" '$3 > min' file`. For ssh, decide where the expansion should happen: `ssh host "ls $dir"` expands `$dir` locally; `ssh host 'ls $HOME'` expands on the remote side; for local values containing spaces use `ssh host "ls $(printf '%q' "$dir")"`.

</details>

### Q12. What is `IFS` and how does it affect scripts?

<details>
<summary>Answer</summary>

The Internal Field Separator, by default space, tab and newline. Word splitting of unquoted expansions and `read` use it. `while IFS= read -r line` preserves leading and trailing whitespace in each line; `IFS=, read -r a b c <<< "1,2,3"` splits on commas. Changing `IFS` globally can break later code, so set it only for one command.

</details>

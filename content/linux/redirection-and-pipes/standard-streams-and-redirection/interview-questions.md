# Standard Streams and Redirection — Interview Questions

## Beginner

### Q1. What are stdin, stdout and stderr?

<details>
<summary>Answer</summary>

The three standard streams every process starts with: file descriptor 0 (stdin, input, the keyboard by default), 1 (stdout, normal output, the terminal) and 2 (stderr, error output, also the terminal). Keeping errors on a separate stream lets you save or pipe results without mixing in error messages.

</details>

### Q2. What is the difference between `>` and `>>`?

<details>
<summary>Answer</summary>

`>` redirects stdout to a file and truncates it first (overwrites); `>>` appends to the end. Both create the file if it does not exist.

</details>

### Q3. How do you discard all output of a command?

<details>
<summary>Answer</summary>

`command >/dev/null 2>&1` (or `&>/dev/null` in bash). `/dev/null` discards whatever is written to it. Useful when only the exit status matters, e.g. `if grep -q ... ; then`.

</details>

### Q4. How do you save only the errors of a command to a file?

<details>
<summary>Answer</summary>

`command 2> errors.txt` (or `2>>` to append). Normal output still goes to the terminal.

</details>

### Q5. What does `<` do?

<details>
<summary>Answer</summary>

It connects a file to the command's standard input: `wc -l < file` or `mysql db < dump.sql`. The command reads the file as if it were typed, without knowing its name.

</details>

## Intermediate

### Q6. What does `2>&1` mean?

<details>
<summary>Answer</summary>

"Make file descriptor 2 (stderr) a duplicate of file descriptor 1 (stdout) as it is right now." So errors go wherever normal output currently goes. `cmd > all.log 2>&1` sends both streams to `all.log`.

</details>

### Q7. What is the difference between `cmd > file 2>&1` and `cmd 2>&1 > file`?

<details>
<summary>Answer</summary>

Redirections are applied left to right. In the first, stdout goes to `file`, then stderr copies stdout → both in the file. In the second, stderr first copies stdout while it still points at the terminal, then stdout alone moves to the file → errors still appear on screen.

</details>

### Q8. Why does `sort data.txt > data.txt` leave you with an empty file?

<details>
<summary>Answer</summary>

The shell performs redirections before starting the command, and `>` truncates `data.txt` immediately. `sort` then reads an already-empty file and writes nothing. Use `sort -o data.txt data.txt`, or write to a temporary file and `mv` it over the original (or `sponge` from moreutils).

</details>

### Q9. Does a pipe carry stderr?

<details>
<summary>Answer</summary>

No, only stdout. Errors from the left command go straight to the terminal. To pipe both, use `cmd 2>&1 | next` (or `cmd |& next` in bash).

</details>

### Q10. What is a here document?

<details>
<summary>Answer</summary>

A way to supply multi-line input inline in a script: `cat <<EOF … EOF`. The lines up to the delimiter become the command's stdin. Variables and command substitutions expand unless the delimiter is quoted (`<<'EOF'`); `<<-EOF` strips leading tabs. A here string `<<< "text"` supplies a single string.

</details>

## Advanced

### Q11. Why should a script write error messages with `>&2`?

<details>
<summary>Answer</summary>

So that callers can separate results from diagnostics: `./report.sh > report.csv` should produce a clean CSV even when warnings occur, and `./report.sh | next-step` should not feed error text into the next program. Combined with a non-zero exit status, it makes the script behave like a well-mannered Unix tool.

</details>

### Q12. A cron job's output is lost and you cannot tell why it failed. How do you fix that?

<details>
<summary>Answer</summary>

Cron jobs have no terminal; output is mailed (often to nowhere) or discarded. Redirect both streams to a log with a timestamp: `0 2 * * * /opt/scripts/backup.sh >> /var/log/backup.log 2>&1`. Inside the script, use `set -euo pipefail`, log key steps, and make sure paths are absolute because cron's environment and working directory differ from your shell.

</details>

### Q13. How can you send output to both the screen and a file?

<details>
<summary>Answer</summary>

Pipe into `tee`: `cmd | tee out.log` (`tee -a` to append). Add `2>&1` before the pipe to include errors: `cmd 2>&1 | tee out.log`. Plain redirection can only send a stream to one place.

</details>

# Pipes and Command Chaining — Interview Questions

## Beginner

### Q1. What is a pipe in Linux?

<details>
<summary>Answer</summary>

The `|` operator connects the standard output of one command to the standard input of the next, through a kernel buffer, so commands can be combined: `grep ERROR app.log | wc -l`. No temporary file is created and the commands run at the same time.

</details>

### Q2. What is the difference between `;`, `&&` and `||`?

<details>
<summary>Answer</summary>

`a; b` runs `b` after `a` regardless of the result. `a && b` runs `b` only if `a` exits with status 0 (success). `a || b` runs `b` only if `a` fails (non-zero status).

</details>

### Q3. What is an exit status?

<details>
<summary>Answer</summary>

A number from 0 to 255 that a process returns when it ends. 0 means success; any other value means failure (the meaning of specific codes is program-defined — e.g. `grep` returns 1 for "no match" and 2 for an error). The shell stores the last one in `$?`, and `&&`, `||` and `if` act on it.

</details>

### Q4. How would you count the number of lines containing "ERROR" in a log?

<details>
<summary>Answer</summary>

`grep -c ERROR app.log`, or as a pipeline `grep ERROR app.log | wc -l`. Both count matching lines, not occurrences; to count every occurrence use `grep -o ERROR app.log | wc -l`.

</details>

## Intermediate

### Q5. Find the top 5 most frequent IP addresses in an access log.

<details>
<summary>Answer</summary>

```bash
# Illustrative
cut -d' ' -f1 access.log | sort | uniq -c | sort -rn | head -n 5
```

`sort` groups identical IPs, `uniq -c` counts each group, `sort -rn` orders by count descending, `head` keeps five. `awk '{print $1}'` works instead of `cut`.

</details>

### Q6. What is the exit status of a pipeline, and what does `set -o pipefail` change?

<details>
<summary>Answer</summary>

By default it is the status of the last command, so `failing-command | tee log` reports success. With `pipefail`, the pipeline's status is that of the rightmost command that failed (or 0 if all succeeded). Bash also records every stage's status in the `PIPESTATUS` array.

</details>

### Q7. Why is `cd /data && rm -rf *` safer than `cd /data; rm -rf *`?

<details>
<summary>Answer</summary>

With `;`, if `cd` fails (typo, missing directory, no permission) the `rm` still runs — in whatever directory you were in. With `&&`, `rm` runs only if the `cd` succeeded. Safer still: avoid `cd` and give the path directly, guarded against empty variables.

</details>

### Q8. Why does `a && b || c` not behave like if/else?

<details>
<summary>Answer</summary>

`c` runs if `a` fails **or** if `a` succeeds and `b` fails. With `if a; then b; else c; fi`, `c` runs only when `a` fails. The shortcut is fine only when `b` cannot fail (e.g. `echo`).

</details>

### Q9. Do the commands in a pipeline run one after another?

<details>
<summary>Answer</summary>

No. The shell starts them all at once; each reads its input as soon as the previous stage writes it. A slow consumer blocks the producer when the pipe buffer (64 KiB by default on Linux) fills. That concurrency is why `tail -f log | grep x` works live and why `cmd | head -1` can stop `cmd` early via `SIGPIPE`.

</details>

## Advanced

### Q10. What is the difference between `{ cmd1; cmd2; }` and `( cmd1; cmd2 )`?

<details>
<summary>Answer</summary>

Braces group commands in the current shell: variable assignments and `cd` persist afterwards, and no new process is needed. Parentheses run the group in a subshell (a forked child), so changes inside are lost when it ends — useful to `cd` temporarily or isolate settings. Both let you redirect the combined output: `{ date; df -h; } > report.txt`.

</details>

### Q11. A variable set inside `while read` in a pipeline is empty after the loop. Why?

<details>
<summary>Answer</summary>

In bash, each stage of a pipeline runs in a subshell, so `cat file | while read line; do count=$((count+1)); done` increments a copy of `count` that disappears with the subshell. Fixes: redirect instead of piping (`while read -r line; do …; done < file`), use process substitution (`done < <(command)`), or `shopt -s lastpipe` in a script.

</details>

### Q12. Why does `find . -name '*.tmp' | rm` not delete anything?

<details>
<summary>Answer</summary>

`rm` takes filenames as **arguments**; it never reads names from stdin, so the piped list is ignored and `rm` complains about a missing operand. Use `find . -name '*.tmp' -delete`, `find … -exec rm {} +`, or `find … -print0 | xargs -0 rm`.

</details>

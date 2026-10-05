# xargs and tee — Interview Questions

## Beginner

### Q1. What does `xargs` do?

<details>
<summary>Answer</summary>

It reads items from standard input and executes a command with those items as arguments, batching as many as fit on one command line. It connects list-producing commands (`find`, `grep -l`) to commands that only accept arguments (`rm`, `cp`, `chmod`).

</details>

### Q2. What does `tee` do?

<details>
<summary>Answer</summary>

It copies standard input to standard output and to one or more files, so you can save a stream and keep using it: `cmd | tee out.log` shows the output and saves it; `-a` appends.

</details>

### Q3. Why doesn't `find . -name '*.tmp' | rm` work?

<details>
<summary>Answer</summary>

`rm` reads filenames only from its arguments, never from stdin. Use `find . -name '*.tmp' -delete`, `find … -exec rm {} +`, or `find … -print0 | xargs -0 rm`.

</details>

## Intermediate

### Q4. Why use `-print0` with `find` and `-0` with `xargs`?

<details>
<summary>Answer</summary>

By default `xargs` splits input on whitespace and treats quotes specially, so filenames containing spaces, quotes or newlines are split or mangled. `-print0` ends each name with a NUL byte, the one character that cannot appear in a filename, and `xargs -0` splits only on NUL.

</details>

### Q5. What is the difference between `find -exec cmd {} \;` and `find -exec cmd {} +`?

<details>
<summary>Answer</summary>

`\;` runs the command once per file (slow for many files). `+` appends as many filenames as fit and runs the command a few times — like `xargs` — which is much faster. `{}` must be last with `+`.

</details>

### Q6. How do you run a command for each line of input with the line in the middle of the command?

<details>
<summary>Answer</summary>

`xargs -I {} cmd --src {} --dest /backup/{}`. `-I` processes one line at a time and replaces every `{}`. (A `while read -r line; do …; done` loop is the shell alternative.)

</details>

### Q7. Why does `sudo echo "x" >> /etc/hosts` fail, and how do you fix it?

<details>
<summary>Answer</summary>

The `>>` redirection is handled by your unprivileged shell before `sudo` starts, so opening `/etc/hosts` for writing fails with "Permission denied". Only `echo` runs as root. Fix: `echo "x" | sudo tee -a /etc/hosts > /dev/null`, or `sudo sh -c 'echo x >> /etc/hosts'`.

</details>

## Advanced

### Q8. What happens when `xargs` receives empty input?

<details>
<summary>Answer</summary>

GNU `xargs` runs the command once with no extra arguments — `… | xargs rm` then prints "missing operand", and some commands do something unwanted when given no arguments (e.g. `xargs ls` lists the current directory). `-r` / `--no-run-if-empty` suppresses the run. BSD `xargs` does not run on empty input by default.

</details>

### Q9. How would you compress 500 log files using 4 CPU cores?

<details>
<summary>Answer</summary>

```bash
# Illustrative
find /var/log/app -name '*.log' -mtime +1 -print0 | xargs -0 -n 1 -P 4 gzip
```

`-P 4` keeps four `gzip` processes running; `-n 1` gives each one file so work is spread evenly.

</details>

### Q10. How do you save both the output and the exit status of a command piped into `tee`?

<details>
<summary>Answer</summary>

The pipeline's status is `tee`'s (almost always 0). Use `set -o pipefail`, or read `${PIPESTATUS[0]}` immediately after: `./build.sh 2>&1 | tee build.log; status=${PIPESTATUS[0]}`.

</details>

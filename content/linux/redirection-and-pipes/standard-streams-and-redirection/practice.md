# Standard Streams and Redirection — Practice

All items start in `~/linux-lab`.

### P1. Append or overwrite?

**Difficulty:** Easy · **Type:** Output · **Concepts:** > vs >>

What does `cat days.txt` print?

```bash
echo mon > days.txt
echo tue >> days.txt
echo wed > days.txt
echo thu >> days.txt
cat days.txt
```

<details>
<summary>Answer</summary>

**Output:**

```text
wed
thu
```

The third command overwrote the file; the fourth appended.

</details>

### P2. File descriptor numbers

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** standard streams

Which file descriptor is standard error?

- A) 0
- B) 1
- C) 2
- D) 3

<details>
<summary>Answer</summary>

**Answer:** C) 2

**Explanation:** 0 = stdin, 1 = stdout, 2 = stderr. Descriptors 3 and above are whatever else the process opens.

</details>

### P3. Where does each line go?

**Difficulty:** Easy · **Type:** Output · **Concepts:** 2>, terminal output

What appears on the terminal, and what is in `e.txt`?

```bash
ls app.log nothing.log 2> e.txt
cat e.txt
```

<details>
<summary>Answer</summary>

**Output:**

```text
app.log
ls: cannot access 'nothing.log': No such file or directory
```

The first line is `ls`'s stdout on the terminal; the second is `cat e.txt` showing the captured error.

</details>

### P4. Both streams into one file

**Difficulty:** Easy · **Type:** Command · **Concepts:** 2>&1

Run `ls app.log nothing.log` and save both its output and its error in `combined.txt`, nothing on screen. Give the portable form and the bash shorthand.

<details>
<summary>Answer</summary>

```bash
ls app.log nothing.log > combined.txt 2>&1
ls app.log nothing.log &> combined.txt
```

</details>

### P5. The order trap

**Difficulty:** Medium · **Type:** Output · **Concepts:** redirection order

What appears on the terminal?

```bash
ls app.log nothing.log 2>&1 > only.txt
```

<details>
<summary>Answer</summary>

**Output:**

```text
ls: cannot access 'nothing.log': No such file or directory
```

stderr was duplicated from stdout while stdout still pointed at the terminal; only afterwards did stdout move to `only.txt`.

</details>

### P6. Counting through a pipe

**Difficulty:** Medium · **Type:** Output · **Concepts:** pipes carry stdout only

What do these two commands print?

```bash
ls nothing.log 2>/dev/null | wc -l
ls nothing.log 2>&1 | wc -l
```

<details>
<summary>Answer</summary>

**Output:**

```text
0
1
```

In the first, the error is discarded and stdout is empty. In the second, the error is merged into stdout and counted.

</details>

### P7. Quiet check

**Difficulty:** Medium · **Type:** MCQ · **Concepts:** /dev/null, exit status

You only want to know whether `config/app.conf` contains `app.port`, with no output at all. Which is cleanest?

- A) `grep app.port config/app.conf > /dev/null`
- B) `grep -q app.port config/app.conf`
- C) `grep app.port config/app.conf 2>/dev/null`
- D) `cat config/app.conf | grep app.port`

<details>
<summary>Answer</summary>

**Answer:** B) `grep -q app.port config/app.conf`

**Explanation:** `-q` prints nothing and exits 0 on the first match (1 if none). A works but still prints errors if the file is missing; C still prints the match; D prints the match.

</details>

### P8. Fix the destroyed file

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** truncation before execution

A colleague ran `grep -v DEBUG app.log > app.log` to remove debug lines, and now `app.log` is empty. Explain why and give two correct ways to do it.

<details>
<summary>Answer</summary>

The shell truncated `app.log` (because of `>`) before `grep` started, so `grep` read an empty file. Correct ways:

```bash
# Illustrative
grep -v DEBUG app.log > app.log.tmp && mv app.log.tmp app.log
sed -i '/DEBUG/d' app.log
```

</details>

### P9. Here document

**Difficulty:** Medium · **Type:** Output · **Concepts:** here document, quoting the delimiter

What does this print?

```bash
name=lab
cat <<EOF
one: $name
EOF
cat <<'EOF'
two: $name
EOF
```

<details>
<summary>Answer</summary>

**Output:**

```text
one: lab
two: $name
```

A quoted delimiter turns off expansion inside the here document.

</details>

### P10. Log a cron job properly

**Difficulty:** Hard · **Type:** Scenario · **Concepts:** redirection in cron

Write a crontab line that runs `/opt/scripts/cleanup.sh` every day at 03:30 and appends both its output and its errors to `/var/log/cleanup.log`.

<details>
<summary>Answer</summary>

```bash
# Illustrative: crontab entry
30 3 * * * /opt/scripts/cleanup.sh >> /var/log/cleanup.log 2>&1
```

`>>` so previous runs are kept, `2>&1` after it so errors are captured too, and an absolute path because cron's working directory differs.

</details>

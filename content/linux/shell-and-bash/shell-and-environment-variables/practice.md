# Shell Variables, Environment Variables and PATH — Practice

All items start in `~/linux-lab`.

### P1. Assignment syntax

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** variable assignment

Which line correctly assigns `8080` to the variable `port`?

- A) `port = 8080`
- B) `$port=8080`
- C) `port=8080`
- D) `set port 8080`

<details>
<summary>Answer</summary>

**Answer:** C) `port=8080`

**Explanation:** No spaces around `=` and no `$` on the left side. A runs a command named `port`.

</details>

### P2. Exported or not

**Difficulty:** Easy · **Type:** Output · **Concepts:** export, child processes

What does this print?

```bash
a=one
export b=two
bash -c 'echo "[$a] [$b]"'
```

<details>
<summary>Answer</summary>

**Output:**

```text
[] [two]
```

Only the exported variable `b` reaches the child shell.

</details>

### P3. One-command variable

**Difficulty:** Easy · **Type:** Output · **Concepts:** VAR=value command

What does this print?

```bash
LEVEL=debug bash -c 'echo "child: $LEVEL"'
echo "parent: [$LEVEL]"
```

<details>
<summary>Answer</summary>

**Output:**

```text
child: debug
parent: []
```

</details>

### P4. Braces needed

**Difficulty:** Easy · **Type:** Output · **Concepts:** ${var}

What does this print?

```bash
unit=MB
echo "Size: 50$unit, $units, ${unit}s"
```

<details>
<summary>Answer</summary>

**Output:**

```text
Size: 50MB, , MBs
```

`$units` is an unset variable (empty); `${unit}s` appends `s` to the value.

</details>

### P5. Extend PATH

**Difficulty:** Medium · **Type:** Command · **Concepts:** PATH

You installed tools into `/opt/tools/bin`. Make them runnable by name in the current shell, taking priority over system commands, and add the line to your `~/.bashrc` so it persists.

<details>
<summary>Answer</summary>

```bash
# Illustrative
export PATH="/opt/tools/bin:$PATH"
echo 'export PATH="/opt/tools/bin:$PATH"' >> ~/.bashrc
```

Single quotes in the `echo` keep `$PATH` literal in the file, so it is expanded each time a shell starts.

</details>

### P6. Broken PATH

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** overwriting PATH

After running `export PATH=/opt/tools/bin`, even `ls` says "command not found". Why, and how do you recover in that shell?

<details>
<summary>Answer</summary>

The command replaced `PATH` instead of extending it, so the shell no longer searches `/usr/bin` and `/bin`. Recover by restoring a sensible value: `export PATH=/usr/local/bin:/usr/bin:/bin:/opt/tools/bin`, or use full paths (`/usr/bin/ls`), or simply open a new shell (which reads the startup files again).

</details>

### P7. Strip the extension

**Difficulty:** Medium · **Type:** Output · **Concepts:** parameter expansion

What does this print?

```bash
f=backup.2026-01-15.tar.gz
echo "${f%.gz}"
echo "${f%%.*}"
echo "${f##*.}"
```

<details>
<summary>Answer</summary>

**Output:**

```text
backup.2026-01-15.tar
backup
gz
```

`%` removes the shortest matching suffix, `%%` the longest; `##*.` removes everything up to the last dot.

</details>

### P8. Default and required values

**Difficulty:** Medium · **Type:** Output · **Concepts:** ${var:-} and ${var:?}

What does this print?

```bash
unset PORT
echo "port=${PORT:-8080}"
echo "still unset: [${PORT}]"
bash -c 'echo "${DB_URL:?DB_URL must be set}"; echo after' || echo "inner shell failed"
```

<details>
<summary>Answer</summary>

**Output:**

```text
port=8080
still unset: []
bash: line 1: DB_URL: DB_URL must be set
inner shell failed
```

`:-` supplies a default without assigning. `:?` prints the message and makes the non-interactive shell exit with a non-zero status (127 in current bash versions; do not rely on the exact number), so `after` never runs.

</details>

### P9. Script environment

**Difficulty:** Hard · **Type:** Scenario · **Concepts:** source vs execute

`env.sh` contains `export APP_ENV=staging`. A teammate runs `./env.sh` and then `java -jar app.jar`, but the app starts with the default profile. Explain and give the correct sequence.

<details>
<summary>Answer</summary>

`./env.sh` ran in a child process; its export disappeared when it exited. Load it into the current shell first:

```bash
# Illustrative
source ./env.sh
java -jar app.jar
```

or set it for one command: `APP_ENV=staging java -jar app.jar`.

</details>

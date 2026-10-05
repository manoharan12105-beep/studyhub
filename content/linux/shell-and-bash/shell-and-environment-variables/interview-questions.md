# Shell Variables, Environment Variables and PATH — Interview Questions

## Beginner

### Q1. What is the difference between a shell variable and an environment variable?

<details>
<summary>Answer</summary>

A shell variable exists only in the current shell. An environment variable has been exported, so it is copied into the environment of every child process the shell starts. `name=value` creates a shell variable; `export name` (or `export name=value`) makes it an environment variable.

</details>

### Q2. What does `export` do?

<details>
<summary>Answer</summary>

It marks a variable to be passed to child processes in their environment. Without it, programs started from the shell (scripts, `java`, `python`) do not see the variable.

</details>

### Q3. What is `PATH`?

<details>
<summary>Answer</summary>

An environment variable containing a colon-separated list of directories. When you type a command without a `/`, the shell searches these directories from left to right and runs the first executable with that name.

</details>

### Q4. How do you add a directory to `PATH` permanently?

<details>
<summary>Answer</summary>

Add `export PATH="$HOME/bin:$PATH"` (or append `:$HOME/bin` at the end) to `~/.bashrc` for interactive shells or `~/.profile` for login sessions, then open a new shell or `source` the file. System-wide: a script in `/etc/profile.d/`.

</details>

### Q5. How do you list all environment variables?

<details>
<summary>Answer</summary>

`printenv` or `env`. `set` lists all shell variables (exported or not) plus functions.

</details>

## Intermediate

### Q6. Why does a variable work in your terminal but is empty inside your script?

<details>
<summary>Answer</summary>

It was set as a shell variable but not exported, so the script (a child process) did not inherit it. Export it, pass it on the command line (`VAR=x ./script.sh`), or set it inside the script. If the script runs from cron or systemd, those have their own minimal environment and never read your interactive shell's variables.

</details>

### Q7. A script runs `export DB_HOST=prod-db`. After it finishes, `echo $DB_HOST` in your shell is empty. Why?

<details>
<summary>Answer</summary>

The script ran in a child process with its own copy of the environment. A child can never change its parent's environment. To apply the variables to the current shell, run it with `source script.sh` (or `. script.sh`).

</details>

### Q8. Why is the current directory (`.`) not in `PATH` by default?

<details>
<summary>Answer</summary>

Security and predictability: if `.` were searched (especially first), entering a directory containing a malicious program named `ls` or `sudo` would run it when you typed that command. Running local programs explicitly with `./prog` makes intent clear.

</details>

### Q9. What does `VAR=value command` do?

<details>
<summary>Answer</summary>

It runs `command` with `VAR` set in its environment only; the current shell is not changed. Example: `LC_ALL=C sort file` or `SPRING_PROFILES_ACTIVE=dev java -jar app.jar`.

</details>

## Advanced

### Q10. What does `${var:-default}` vs `${var:=default}` vs `${var:?message}` do?

<details>
<summary>Answer</summary>

`${var:-default}` expands to `default` if `var` is unset or empty, without changing `var`. `${var:=default}` does the same and also assigns `default` to `var`. `${var:?message}` prints `message` and exits a non-interactive shell (fails the command) if `var` is unset or empty — useful for guarding required parameters, e.g. `rm -rf "${DIR:?}/"*`.

</details>

### Q11. You installed a newer `python3` in `/usr/local/bin`, but `python3 --version` still shows the old one. What could be wrong?

<details>
<summary>Answer</summary>

`/usr/local/bin` may come after `/usr/bin` in `PATH`; an alias or function named `python3` may exist; or bash cached the old location (`hash -r` clears it). Check with `type -a python3` and `echo $PATH`. For many tools, version managers or `update-alternatives` are cleaner than reordering `PATH`.

</details>

### Q12. Why are environment variables a risky place for secrets, and what are alternatives?

<details>
<summary>Answer</summary>

They are inherited by every child process, visible to the same user via `/proc/<pid>/environ`, easily printed by debugging (`env` in CI logs, error pages, crash reports), and sometimes captured in container image layers or shell history. Alternatives: files with `600` permissions read at start-up, secret managers (Vault, cloud KMS/Secrets Manager), Docker/Kubernetes secrets mounted as files, and never echoing them in logs.

</details>

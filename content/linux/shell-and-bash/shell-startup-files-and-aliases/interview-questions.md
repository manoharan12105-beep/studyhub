# Shell Startup Files, Aliases and Configuration — Interview Questions

## Beginner

### Q1. What is `~/.bashrc`?

<details>
<summary>Answer</summary>

A per-user script that bash runs whenever it starts as an interactive non-login shell (and, through the usual convention, from login shells too). It holds aliases, functions, the prompt, shell options and often environment variables.

</details>

### Q2. How do you create a permanent alias?

<details>
<summary>Answer</summary>

Add it to `~/.bashrc`, e.g. `alias ll='ls -lh'`, then run `source ~/.bashrc` (or open a new terminal). An alias typed at the prompt lasts only for that shell session.

</details>

### Q3. How do you apply changes to `~/.bashrc` without logging out?

<details>
<summary>Answer</summary>

`source ~/.bashrc` (or `. ~/.bashrc`) runs it in the current shell. `bash ~/.bashrc` would not work, because it runs the file in a child shell.

</details>

### Q4. What is the difference between `.bashrc` and `.bash_profile`?

<details>
<summary>Answer</summary>

`.bash_profile` is read by **login** shells (SSH or console login, `su -`); `.bashrc` by **interactive non-login** shells (new terminal windows, typing `bash`). The common setup puts environment variables in the profile file and makes it source `.bashrc`, so every interactive shell gets the same aliases and prompt.

</details>

## Intermediate

### Q5. What is a login shell vs a non-login shell?

<details>
<summary>Answer</summary>

A login shell is the first shell of a session after authentication — SSH, console login, `su -`, `bash -l`; it reads `/etc/profile` and one of `~/.bash_profile`, `~/.bash_login`, `~/.profile`. A non-login shell is started from an existing session — a new terminal tab, a subshell — and reads `~/.bashrc` if interactive. `shopt login_shell` or a leading dash in `$0` (`-bash`) identifies a login shell.

</details>

### Q6. Why do aliases not work in shell scripts?

<details>
<summary>Answer</summary>

Scripts run in a non-interactive shell, which does not read `~/.bashrc` and has alias expansion turned off (`expand_aliases` is off). Use the real commands, or define functions in the script. (`shopt -s expand_aliases` plus defining the aliases in the script works but is discouraged.)

</details>

### Q7. You added `export JAVA_HOME=...` to `~/.bashrc`, but a cron job still fails because `JAVA_HOME` is not set. Why?

<details>
<summary>Answer</summary>

cron runs jobs with a minimal environment and a non-interactive, non-login shell that reads no startup files. Set the variable in the crontab (lines like `JAVA_HOME=/usr/lib/jvm/...` above the jobs) or at the top of the script, and use absolute paths.

</details>

### Q8. What is `/etc/profile.d/`?

<details>
<summary>Answer</summary>

A directory of `*.sh` snippets that `/etc/profile` sources for every login shell. Packages and administrators drop files there to set system-wide environment (e.g. `/etc/profile.d/maven.sh`) without editing `/etc/profile` itself, which keeps changes separate and upgrade-safe.

</details>

### Q9. When should you use a function instead of an alias?

<details>
<summary>Answer</summary>

When the shortcut needs arguments in the middle, conditionals, loops, or multiple commands: `mkcd() { mkdir -p "$1" && cd "$1"; }`. Aliases are plain text substitution at the start of a command; functions are real code that runs in the current shell.

</details>

## Advanced

### Q10. Creating `~/.bash_profile` on Ubuntu broke your `PATH` additions. Why?

<details>
<summary>Answer</summary>

A login bash reads only the **first** existing file of `~/.bash_profile`, `~/.bash_login`, `~/.profile`. Ubuntu keeps its defaults (including adding `~/.local/bin` to `PATH` and sourcing `~/.bashrc`) in `~/.profile`. Once `~/.bash_profile` exists, `~/.profile` is skipped. Fix: put `[ -f ~/.profile ] && . ~/.profile` in `~/.bash_profile`, or delete the new file.

</details>

### Q11. How do you set environment variables for a systemd service?

<details>
<summary>Answer</summary>

In the unit file (or an override created with `systemctl edit name`): `Environment="SPRING_PROFILES_ACTIVE=prod"` for individual values, or `EnvironmentFile=/etc/myapp/env` for a file of `KEY=value` lines. Then `systemctl daemon-reload` and restart. Services never read users' shell startup files.

</details>

### Q12. Why can echoing text from `~/.bashrc` break `scp`?

<details>
<summary>Answer</summary>

`scp`/`rsync` over SSH start a non-interactive shell on the remote host; for SSH sessions bash reads `~/.bashrc` even when non-interactive. If `.bashrc` prints something (a banner, `echo`), that output is mixed into the protocol stream and the transfer fails. Default Ubuntu `.bashrc` files return early when not interactive (`case $- in *i*) ;; *) return;; esac`); keep output after that guard.

</details>

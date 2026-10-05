# Shell Startup Files, Aliases and Configuration — Practice

All items start in `~/linux-lab`.

### P1. Where does the alias go?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** .bashrc

You want `ll` to mean `ls -lh` in every new terminal. Where do you put `alias ll='ls -lh'`?

- A) `/etc/hosts`
- B) `~/.bashrc`
- C) `~/.bash_history`
- D) `/etc/passwd`

<details>
<summary>Answer</summary>

**Answer:** B) `~/.bashrc`

</details>

### P2. Reload

**Difficulty:** Easy · **Type:** Command · **Concepts:** source

You edited `~/.bashrc`. Apply it to the current terminal without opening a new one.

<details>
<summary>Answer</summary>

```bash
# Illustrative
source ~/.bashrc
```

</details>

### P3. source vs run

**Difficulty:** Easy · **Type:** Output · **Concepts:** source

What does this print?

```bash
echo 'MODE=fast' > settings.sh
bash settings.sh
echo "after running: [$MODE]"
source settings.sh
echo "after sourcing: [$MODE]"
```

<details>
<summary>Answer</summary>

**Output:**

```text
after running: []
after sourcing: [fast]
```

</details>

### P4. Which file for SSH logins?

**Difficulty:** Medium · **Type:** MCQ · **Concepts:** login shells

On a fresh Ubuntu server you SSH in. Which of these files does bash read directly at login?

- A) Only `~/.bashrc`
- B) `/etc/profile` and `~/.profile` (which then sources `~/.bashrc`)
- C) Only `/etc/environment`
- D) None

<details>
<summary>Answer</summary>

**Answer:** B) `/etc/profile` and `~/.profile` (which then sources `~/.bashrc`)

**Explanation:** An SSH login starts a login shell. `/etc/environment` is read by PAM, not by bash.

</details>

### P5. Alias with an argument

**Difficulty:** Medium · **Type:** Script · **Concepts:** functions vs aliases

Write a shell function `backup` so that `backup notes.txt` copies the file to `notes.txt.bak` and prints `backed up notes.txt`.

<details>
<summary>Answer</summary>

```bash
backup() { cp -- "$1" "$1.bak" && echo "backed up $1"; }
backup notes.txt
```

**Output:**

```text
backed up notes.txt
```

An alias cannot place the argument twice; a function can.

</details>

### P6. Missing in cron

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** cron environment

A script that calls `mvn` works when you run it, but in cron it logs `mvn: command not found`. `which mvn` in your shell prints `/opt/maven/bin/mvn`, added to `PATH` in `~/.bashrc`. Give two fixes.

<details>
<summary>Answer</summary>

cron does not read `~/.bashrc`, so its `PATH` lacks `/opt/maven/bin`. Fixes: set `PATH=/opt/maven/bin:/usr/local/bin:/usr/bin:/bin` at the top of the crontab; or set `PATH` (or call `/opt/maven/bin/mvn` by its full path) inside the script.

</details>

### P7. Bypass the alias

**Difficulty:** Medium · **Type:** Conceptual · **Concepts:** alias bypass

Your `~/.bashrc` has `alias rm='rm -i'`. Give three ways to run the real `rm` once without the prompt.

<details>
<summary>Answer</summary>

`\rm file`, `command rm file`, or `/usr/bin/rm file`. (`rm -f` also suppresses the prompt, since a later `-f` overrides `-i`.)

</details>

### P8. Profile disappeared

**Difficulty:** Hard · **Type:** Troubleshooting · **Concepts:** .bash_profile precedence

A user created `~/.bash_profile` containing one line, `export EDITOR=vim`. Since then, over SSH their prompt colours and aliases are gone and `~/.local/bin` is no longer on `PATH`. Explain and fix.

<details>
<summary>Answer</summary>

Login bash reads only the first existing of `~/.bash_profile`, `~/.bash_login`, `~/.profile`. The new file shadows `~/.profile`, which used to add `~/.local/bin` and source `~/.bashrc` (colours, aliases). Fix `~/.bash_profile`:

```bash
# Illustrative: ~/.bash_profile
[ -f ~/.profile ] && . ~/.profile
export EDITOR=vim
```

</details>

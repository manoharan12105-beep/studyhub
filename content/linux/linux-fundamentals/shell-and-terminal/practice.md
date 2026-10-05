# Shell, Terminal and Bash — Practice

### P1. Read the prompt

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** prompt

What does the prompt `root@web01:/var/log#` tell you?

- A) User `web01`, host `root`, directory `/var/log`, normal user
- B) User `root`, host `web01`, directory `/var/log`, superuser shell
- C) User `root`, host `web01`, home directory, normal user
- D) Nothing reliable; prompts are random

<details>
<summary>Answer</summary>

**Answer:** B) User `root`, host `web01`, directory `/var/log`, superuser shell

**Explanation:** The format is `user@host:directory`, and `#` marks root. (Prompts are configurable through `PS1`, but this is the default form.)

</details>

### P2. Combine options

**Difficulty:** Easy · **Type:** Command · **Concepts:** short options

Write `ls -l -a -h project` with the short options combined.

<details>
<summary>Answer</summary>

```bash
ls -lah project
```

</details>

### P3. Hidden files

**Difficulty:** Easy · **Type:** Output · **Concepts:** ls -a

Inside the lab, what does this print?

```bash
ls -a project
```

<details>
<summary>Answer</summary>

**Output:**

```text
.  ..  .gitignore  build.sh  docs  readme.md  src  test
```

`.gitignore` is hidden (starts with a dot) and appears only with `-a`, along with `.` and `..`.

</details>

### P4. Terminal or shell?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** terminal vs shell

Which component expands `*.log` into a list of matching filenames?

- A) The terminal emulator
- B) The shell
- C) The kernel
- D) The `ls` command

<details>
<summary>Answer</summary>

**Answer:** B) The shell

**Explanation:** Wildcard expansion (globbing) is done by the shell before the command runs; `ls *.log` receives the already-expanded filenames as arguments.

</details>

### P5. A file called -n

**Difficulty:** Medium · **Type:** Command · **Concepts:** end of options

Show two ways to print the contents of a file named `-n` with `cat`.

<details>
<summary>Answer</summary>

```bash
# Illustrative: assumes a file named -n exists
cat -- -n
cat ./-n
```

`cat -n` alone would be read as the "number lines" option waiting for standard input.

</details>

### P6. Stopped, not gone

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** Ctrl+Z vs Ctrl+C

A student presses `Ctrl+Z` to leave a running `java -jar app.jar`, then tries to start it again and gets "Port 8080 already in use". Explain and fix.

<details>
<summary>Answer</summary>

`Ctrl+Z` suspends the process (`SIGTSTP`) — it still exists and still holds port 8080. Run `jobs` to see it, then `fg` and `Ctrl+C` to stop it, or `kill %1`. Next time use `Ctrl+C` to stop a foreground program.

</details>

### P7. sh vs bash

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** dash vs bash

A script beginning with `#!/bin/sh` contains `if [[ $1 == start ]]; then`. It works on a RHEL server but on Ubuntu prints `[[: not found`. Why, and what are two fixes?

<details>
<summary>Answer</summary>

On Ubuntu `/bin/sh` is dash, which does not support the bash-only `[[ ]]` keyword. Fix by changing the shebang to `#!/bin/bash`, or rewrite with POSIX syntax: `if [ "$1" = start ]; then`.

</details>

### P8. Why sudo?

**Difficulty:** Medium · **Type:** Conceptual · **Concepts:** root, sudo

Give three reasons to use a normal account with `sudo` instead of logging in as root.

<details>
<summary>Answer</summary>

1. Mistakes as a normal user are limited to your own files.
2. Privileged actions are deliberate (typed with `sudo`) and limited to one command.
3. `sudo` logs who ran what, giving an audit trail; access can be restricted per user and per command in `sudoers`, and revoked without sharing the root password.

</details>

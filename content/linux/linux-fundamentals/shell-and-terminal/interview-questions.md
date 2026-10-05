# Shell, Terminal and Bash — Interview Questions

## Beginner

### Q1. What is the difference between a terminal and a shell?

<details>
<summary>Answer</summary>

The terminal (emulator) is the program that displays text and sends keystrokes — a window or an SSH client. The shell is the command interpreter running inside it: it reads the command line, expands it, runs programs and prints the prompt. You can run different shells (bash, zsh) in the same terminal.

</details>

### Q2. What is Bash?

<details>
<summary>Answer</summary>

Bash (Bourne Again SHell) is GNU's shell and the default interactive shell on most Linux distributions. It is compatible with the POSIX `sh` language and adds features such as arrays, `[[ ]]` tests, arithmetic `$(( ))`, brace expansion, command history and programmable completion.

</details>

### Q3. What do `$` and `#` at the end of the prompt mean?

<details>
<summary>Answer</summary>

`$` means you are a normal user; `#` means you are root (UID 0). It is a warning sign: as root, permission checks no longer protect you from mistakes.

</details>

### Q4. CLI vs GUI — why do servers use the CLI?

<details>
<summary>Answer</summary>

The CLI needs very few resources, works over a slow SSH connection, and every action is a precise command that can be scripted, repeated, reviewed and automated across many machines. A GUI needs a display stack and its clicks are hard to automate, so servers typically do not install one.

</details>

### Q5. What is the difference between short and long options?

<details>
<summary>Answer</summary>

Short options are a single dash and a letter (`-l`, `-a`) and can usually be combined (`-la`). Long options use two dashes and a word (`--all`, `--human-readable`) and are self-documenting, which makes scripts more readable. Values attach as `--sort=size` or `-k 2`.

</details>

## Intermediate

### Q6. How do you delete a file named `-f`?

<details>
<summary>Answer</summary>

`rm -- -f` (`--` marks the end of options) or `rm ./-f` (the path no longer starts with a dash). Plain `rm -f` would be read as the force option with no file.

</details>

### Q7. What is the difference between `$SHELL` and `$0`?

<details>
<summary>Answer</summary>

`$SHELL` holds the user's login shell from `/etc/passwd`; it stays the same even if you start another shell. `$0` in an interactive shell is the name of the shell currently running (`bash`, `-bash` for a login shell, `zsh`); inside a script it is the script's name.

</details>

### Q8. What do `Ctrl+C`, `Ctrl+Z` and `Ctrl+D` do?

<details>
<summary>Answer</summary>

`Ctrl+C` sends `SIGINT` to the foreground process, which normally terminates it. `Ctrl+Z` sends `SIGTSTP`, suspending it (resume with `fg` or `bg`). `Ctrl+D` is not a signal: it signals end-of-input to a program reading from the terminal; at an empty shell prompt it exits the shell.

</details>

### Q9. Why is `/bin/sh` not always bash, and why does it matter?

<details>
<summary>Answer</summary>

On Debian and Ubuntu `/bin/sh` is dash, a minimal POSIX shell chosen for speed; on RHEL it is bash. A script with `#!/bin/sh` that uses bash-only features (`[[ ]]`, arrays, `source`, `{1..5}`) works on RHEL and fails on Ubuntu. Use `#!/bin/bash` when you use bash features, or stick to POSIX syntax.

</details>

## Advanced

### Q10. Why should you avoid logging in as root for daily work?

<details>
<summary>Answer</summary>

Root bypasses permission checks, so a typo (`rm -r` in the wrong directory, a wrong `chmod -R`) damages the whole system instead of one user's files, and malware running as root controls everything. With a normal account plus `sudo`, privileged actions are deliberate, limited to one command, restricted by policy (`sudoers`) and logged with your username for auditing.

</details>

### Q11. A colleague says "the terminal crashed" after their SSH session froze. What could actually be wrong?

<details>
<summary>Answer</summary>

Possibilities: the network connection dropped (SSH waits until timeout); a command is running in the foreground and waiting for input; the terminal received `Ctrl+S` (XOFF flow control, which pauses output — `Ctrl+Q` resumes); or a program printed binary data that changed terminal settings (`reset` fixes it). The shell and the remote server are usually fine.

</details>

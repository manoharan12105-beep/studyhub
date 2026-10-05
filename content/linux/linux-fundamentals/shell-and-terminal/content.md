# Shell, Terminal and Bash

**Module:** Linux Fundamentals · **Interview priority:** Core

## What Is It?

- A **terminal** (terminal emulator) is the window that shows text and sends your keystrokes — GNOME Terminal, Windows Terminal, the macOS Terminal app, or an SSH client.
- A **shell** is the program running inside it that reads a command line, interprets it, runs programs and shows the prompt again.
- **Bash** (Bourne Again SHell) is the most common shell on Linux. Others: `sh` (the POSIX shell; on Ubuntu it is `dash`), `zsh` (default on macOS), `fish`.
- The **command line interface (CLI)** is working by typing commands, as opposed to a **graphical user interface (GUI)** of windows and mouse clicks.

```text
 keyboard ─► terminal emulator ─► shell (bash) ─► runs programs (ls, grep, java …)
 screen   ◄─ terminal emulator ◄─ output text  ◄─┘
```

## Why It Matters

- Servers usually have no GUI. SSH gives you a shell and nothing else.
- The CLI is scriptable: a command you type once can run in a script on a thousand servers.
- It is faster and more precise for repetitive work (rename 500 files, search 10 GB of logs).
- Interviewers expect you to distinguish terminal, shell and bash, and to read a prompt.

## Core Concept

### Terminal, console, shell, bash

| Term | Meaning |
|------|---------|
| Terminal | Program that displays text I/O (historically a physical device) |
| Console | The machine's own physical/system terminal (e.g. `Ctrl+Alt+F3` on a desktop, a VM's console) |
| Shell | Command interpreter: reads, parses, expands, runs, reports |
| Bash | One particular shell; GNU's replacement for the original Bourne shell `sh` |

The shell is an ordinary program. You can start another one inside it (`bash`, `zsh`), and leave it with `exit`.

### CLI vs GUI

| | CLI | GUI |
|---|---|---|
| Interaction | Typed commands | Mouse, windows, menus |
| Automation | Scripts, loops, pipes | Hard to automate |
| Resources | Very light; works over slow SSH | Needs a display server, more memory |
| Discoverability | Must know or look up commands (`man`) | Visible menus |
| Precision | Exact, repeatable, logged in history | Clicks are not recorded |

### Reading the prompt

```text
student@devbox:~/linux-lab$
│       │      │          └─ $ = normal user   (# = root)
│       │      └─ current directory (~ = your home directory)
│       └─ hostname (machine name)
└─ username
```

The `$` / `#` ending is the quickest way to tell whether you are root. Be careful in a `#` shell: nothing stops a mistaken command.

### Anatomy of a command

```text
ls  -l -a  --human-readable  project/src
│   └─┬──┘ └──────┬────────┘ └────┬────┘
│   short options long option   argument (what to act on)
command
```

- **Short options** are one dash and one letter and can be combined: `ls -l -a -h` = `ls -lah`.
- **Long options** are two dashes and a word: `--all`, `--human-readable`. Some take values: `--sort=size` or `--sort size`.
- **Arguments** are the things the command works on — files, directories, text.
- `--` means "end of options": `rm -- -file.txt` deletes a file whose name starts with a dash.
- Spaces separate words. A filename containing spaces must be quoted: `cat "my notes.txt"`.

### Root and normal users

- **root** (user ID 0) is the superuser: it bypasses file permission checks and can change anything on the system.
- **Normal users** can change only their own files and whatever permissions allow.
- **sudo** runs one command as root (or another user) after checking that you are allowed, and logs it: `sudo apt update`. Working as a normal user and using `sudo` only when needed limits the damage of mistakes and leaves an audit trail.

See [su and sudo](../../users-and-groups/su-and-sudo/content.md) for the details.

### Keyboard shortcuts every Linux user relies on

| Keys | Action |
|------|--------|
| `Tab` | Complete a command or filename; press twice to list choices |
| `↑` / `↓` | Previous / next command from history |
| `Ctrl+R` | Search history backwards as you type |
| `Ctrl+C` | Interrupt (stop) the running command — sends `SIGINT` |
| `Ctrl+Z` | Suspend the running command — sends `SIGTSTP` (resume with `fg`) |
| `Ctrl+D` | End of input; at an empty prompt it exits the shell |
| `Ctrl+L` | Clear the screen (same as `clear`) |
| `Ctrl+A` / `Ctrl+E` | Jump to start / end of the line |
| `Ctrl+U` / `Ctrl+K` | Delete to start / end of the line |
| `Ctrl+W` | Delete the previous word |

## Commands

### whoami and id

**Purpose:** show who you are logged in as.

```bash
whoami
```

**Output:**

```text
student
```

`id` adds the numeric user ID (UID), primary group and supplementary groups:

```bash
id -un
id -u
```

**Output (varies):**

```text
student
1000
```

On most distributions the first human user gets UID 1000; root is always 0.

### echo

**Purpose:** print its arguments — used to show variables and to write text in scripts.

```bash
echo Hello from the shell
echo "Current user: $USER"
```

**Output:**

```text
Hello from the shell
Current user: student
```

### Which shell am I using?

```bash
# Illustrative: run in an interactive terminal
echo $SHELL     # your login shell, e.g. /bin/bash
echo $0         # the shell running now, e.g. bash or -bash
cat /etc/shells # shells allowed as login shells
```

`$SHELL` is the login shell recorded for your account; it does not change when you start another shell, while `$0` names the current one.

### Options in practice

```bash
ls project
ls -a project
```

**Output:**

```text
build.sh  docs  readme.md  src  test
.  ..  .gitignore  build.sh  docs  readme.md  src  test
```

`-a` (all) also shows hidden files, whose names start with a dot, plus `.` (this directory) and `..` (the parent).

## Comparison

### Common shells

| Shell | Notes |
|-------|-------|
| `sh` | The POSIX shell language. On Debian/Ubuntu `/bin/sh` is **dash** (small and fast); on RHEL it is bash in POSIX mode |
| `bash` | Default interactive shell on most Linux distributions; arrays, `[[ ]]`, `$(( ))`, history, completion |
| `zsh` | Default on macOS since 2019; powerful completion and themes; mostly bash-compatible |
| `fish` | Friendly interactive shell; not POSIX-compatible syntax |

A script that starts with `#!/bin/sh` must use only POSIX syntax — bash-only features may fail under dash.

## Common Mistakes

- Using "terminal" and "shell" as synonyms in an interview. The terminal displays; the shell interprets.
- Forgetting quotes around names with spaces: `rm my file.txt` tries to remove `my` and `file.txt`.
- Pressing `Ctrl+Z` to "quit" a program. It only suspends it; the process keeps existing (see `jobs`).
- Working as root all the time. Use a normal account and `sudo` for individual commands.
- Typing a filename that starts with `-` as an argument: the command treats it as an option. Use `--` or `./-name`.

## Key Takeaways

- Terminal = window for text; shell = interpreter; bash = the most common Linux shell.
- Prompt `user@host:dir$` — `$` normal user, `#` root.
- `command -options --long-options arguments`; short options combine (`-lah`); `--` ends options.
- root (UID 0) bypasses permission checks; use `sudo` for individual privileged commands.
- `Tab`, `Ctrl+R`, `Ctrl+C`, `Ctrl+D` and `Ctrl+L` are daily tools.

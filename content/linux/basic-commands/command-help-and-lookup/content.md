# Getting Help and Finding Commands

**Module:** Basic Commands · **Interview priority:** Frequently asked

## What Is It?

Nobody memorises every option. Linux ships its documentation with the system, and the shell can tell you exactly what a command name refers to:

| Command | Answers |
|---------|---------|
| `man` | Full manual page for a command, file format or system call |
| `help` | Documentation for **bash builtins** (`cd`, `export`, `read`) |
| `--help` | Quick option summary printed by most programs |
| `whatis`, `man -k` / `apropos` | One-line descriptions; search manuals by keyword |
| `type` | What the shell will run for a name: alias, keyword, function, builtin or file |
| `which` | Which executable file in `$PATH` matches a name |
| `whereis` | Where a command's binary, source and man pages are |
| `history` | Commands you ran before, and ways to repeat them |
| `clear` | Clear the terminal screen |

## Why It Matters

- On a server without internet access, `man` and `--help` are your documentation.
- "Command not found" and "wrong version runs" problems are solved with `type`, `which` and `$PATH`.
- Interviews: "how do you find out what an option does?", "difference between `which` and `type`?", "what is a shell builtin?".

## Core Concept

### Manual sections

Man pages are grouped into numbered sections. The same name can exist in several:

| Section | Contains | Example |
|---------|----------|---------|
| 1 | User commands | `man 1 passwd` — the `passwd` command |
| 2 | System calls | `man 2 open` |
| 3 | C library functions | `man 3 printf` |
| 5 | File formats and configuration files | `man 5 passwd` — the `/etc/passwd` format, `man 5 crontab` |
| 7 | Overviews and conventions | `man 7 signal`, `man 7 hier` (filesystem layout) |
| 8 | System administration commands | `man 8 useradd`, `man 8 mount` |

Without a number, `man` shows the first section that has the page. References like `crontab(5)` in documentation mean "section 5".

### How the shell resolves a command name

When you type a name, bash checks in this order and runs the first match:

1. **Alias** (`alias ll='ls -l'`)
2. **Keyword** (`if`, `for`, `while`, `[[`)
3. **Function** defined in the shell
4. **Builtin** (`cd`, `echo`, `export`, `pwd`, `type`)
5. **Executable file** found by searching the directories in `$PATH`, left to right

If nothing matches: `command not found`. `type` follows exactly this logic; `which` only does step 5.

## Commands

### man

**Purpose:** open the manual page.

```bash
# Illustrative: interactive (uses less: / to search, q to quit)
man ls
man 5 crontab        # the crontab file format, not the crontab command
man -k password      # search names and descriptions (same as apropos)
```

A man page is organised as NAME, SYNOPSIS (syntax: `[ ]` optional, `...` repeatable), DESCRIPTION (options), EXAMPLES (on some pages), FILES and SEE ALSO.

`whatis` prints the one-line description from each section:

```bash
# Illustrative: depends on the installed man pages
whatis passwd crontab
```

**Output (varies):**

```text
passwd (1)           - change user password
passwd (1ssl)        - OpenSSL application commands
passwd (5)           - the password file
crontab (1)          - maintain crontab files for individual users (Vixie Cron)
crontab (5)          - tables for driving cron
```

**Common mistake:** minimal container images strip man pages. If `man` says "No manual entry", the page may simply not be installed.

### --help

**Purpose:** quick reference built into most programs.

```bash
ls --help | head -n 3
```

**Output:**

```text
Usage: ls [OPTION]... [FILE]...
List information about the FILEs (the current directory by default).
Sort entries alphabetically if none of -cftuvSUX nor --sort is specified.
```

Pipe long help into `less` or `grep`: `ls --help | grep -i sort`.

### help

**Purpose:** documentation for bash builtins, which have no man page of their own.

```bash
help cd | head -n 2
```

**Output:**

```text
cd: cd [-L|[-P [-e]]] [-@] [dir]
    Change the shell working directory.
```

`help` with no arguments lists all builtins.

### type

**Purpose:** show what a name means to the shell.

```bash
type ls cd if
```

**Output:**

```text
ls is /usr/bin/ls
cd is a shell builtin
if is a shell keyword
```

`type -t` prints just the kind, and `type -a` lists **every** match in resolution order:

```bash
type -t cd ls
```

**Output:**

```text
builtin
file
```

```bash
# Illustrative: interactive shell with an alias
alias ll='ls -l'
type ll              # ll is aliased to `ls -l'
type -a echo         # echo is a shell builtin / echo is /usr/bin/echo
```

### which

**Purpose:** print the path of the executable that `$PATH` lookup finds.

```bash
which ls bash
```

**Output:**

```text
/usr/bin/ls
/usr/bin/bash
```

`which` knows nothing about builtins, aliases or functions:

```bash
which cd
echo "exit status: $?"
```

**Output:**

```text
exit status: 1
```

`command -v name` is the POSIX, script-friendly alternative: it prints the path for files and the name for builtins, and fails cleanly when the name does not exist.

```bash
command -v grep
command -v cd
```

**Output:**

```text
/usr/bin/grep
cd
```

### whereis

**Purpose:** locate the binary, source and manual files for a command, searching standard system directories (not your `$PATH`).

```bash
whereis ls
```

**Output (varies):**

```text
ls: /usr/bin/ls /usr/share/man/man1/ls.1.gz
```

### history

**Purpose:** list and re-run previous commands (interactive shells only; saved to `~/.bash_history` when the shell exits).

```bash
# Illustrative: interactive shell
history 5            # last five commands, numbered
!!                   # repeat the last command
sudo !!              # repeat it with sudo — handy after "Permission denied"
!42                  # run command number 42
!grep                # run the most recent command starting with "grep"
history -c           # clear this session's history
```

`Ctrl+R` searches history interactively — usually faster than `!` expansions. `HISTSIZE` and `HISTFILESIZE` set how much is kept.

> [!WARNING]
> Commands are stored in plain text in `~/.bash_history`. Never type passwords or tokens as command arguments (`mysql -pSecret`); they end up in history and are visible in `ps` while the command runs.

### clear

**Purpose:** clear the screen (scrollback may remain). `Ctrl+L` does the same.

## Examples

### "Which java am I actually running?"

```bash
# Illustrative
type -a java              # every java on PATH, in order
readlink -f "$(command -v java)"   # resolve symlinks to the real binary
java -version
```

`readlink -f` matters because `/usr/bin/java` is usually a symbolic link managed by the alternatives system.

### Find the right command when you do not know its name

```bash
# Illustrative
man -k 'disk usage'        # du (1) - estimate file space usage
apropos -s 8 user          # admin commands about users: useradd, usermod, ...
```

## Comparison

### type vs which vs whereis vs command -v

| | `type` | `which` | `whereis` | `command -v` |
|---|---|---|---|---|
| Knows aliases, functions, builtins | Yes | No | No | Yes |
| Searches | Shell's own resolution | `$PATH` | Fixed system directories | Shell's own resolution |
| Shows man pages | No | No | Yes | No |
| Use in scripts | Bash-only | Not standardised | Rarely | **Yes (POSIX)** |

### man vs help vs --help

| | `man cmd` | `help cmd` | `cmd --help` |
|---|---|---|---|
| For | External commands, files, syscalls | Bash builtins | Most programs |
| Depth | Full manual | Medium | Short summary |
| Needs | Man pages installed | Bash | Program support |

## Common Mistakes

- Running `man cd`: on many systems it shows a generic builtins page or nothing. Use `help cd`.
- Trusting `which` to explain why a command behaves strangely — an alias or function may be shadowing it. Use `type -a`.
- Re-running `!!` without checking what the last command was, especially after a destructive one.
- Typing secrets on the command line, where they persist in history.

## Key Takeaways

- `man` (sections 1 commands, 5 file formats, 8 admin), `man -k` to search, `help` for builtins, `--help` for a quick summary.
- Resolution order: alias → keyword → function → builtin → `$PATH`.
- `type` explains what will run; `which` only searches `$PATH`; `command -v` is the script-safe check.
- `history`, `!!`, `!n`, `Ctrl+R` reuse commands; history files are plain text.

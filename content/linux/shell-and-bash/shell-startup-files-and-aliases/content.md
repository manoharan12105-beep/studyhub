# Shell Startup Files, Aliases and Configuration

**Module:** Shell, Bash and Environment · **Interview priority:** Frequently asked

## What Is It?

When bash starts, it reads **startup files** — ordinary shell scripts that set environment variables (`PATH`, `JAVA_HOME`), aliases, functions, the prompt and shell options. Which files it reads depends on **how** bash was started:

- a **login shell** (SSH login, console login, `su -`, `bash -l`) reads the *profile* files;
- an **interactive non-login shell** (a new terminal tab on a desktop, typing `bash`) reads `~/.bashrc`;
- a **non-interactive shell** (running a script, cron, `ssh host command`) reads **neither** by default.

An **alias** is a shortcut for a command (`alias ll='ls -l'`), defined in these files to be available in every interactive shell.

## Why It Matters

- "It works in my terminal but not in cron / the service / the script" is almost always a startup-file problem: the variable or `PATH` entry was defined in a file that this kind of shell never reads.
- Knowing where to put a setting (`.bashrc` vs `.profile` vs `/etc/profile.d/` vs a systemd unit) is daily DevOps work.
- Interview questions: `.bashrc` vs `.bash_profile`, login vs non-login shell, how to make an alias permanent, why aliases do not work in scripts.

## Core Concept

### Which files bash reads

```text
LOGIN shell (ssh, console, su -, bash -l)          INTERACTIVE NON-LOGIN (new terminal tab, bash)
  /etc/profile                                        /etc/bash.bashrc  (Debian/Ubuntu)
    └─ /etc/profile.d/*.sh                            ~/.bashrc
  then the FIRST that exists of:
    ~/.bash_profile → ~/.bash_login → ~/.profile    NON-INTERACTIVE (scripts, cron, ssh host cmd)
  on logout: ~/.bash_logout                           nothing (except the file named in $BASH_ENV)
```

The usual convention connects the two worlds: `~/.profile` (or `~/.bash_profile`) **sources `~/.bashrc`**, so login shells get the interactive settings too. Ubuntu's default `~/.profile` contains:

```bash
# Illustrative: excerpt from Ubuntu's default ~/.profile
if [ -n "$BASH_VERSION" ]; then
    # include .bashrc if it exists
    if [ -f "$HOME/.bashrc" ]; then
        . "$HOME/.bashrc"
    fi
fi

# set PATH so it includes user's private bin if it exists
if [ -d "$HOME/bin" ] ; then
    PATH="$HOME/bin:$PATH"
fi
```

And `~/.bashrc` starts by returning immediately when the shell is not interactive:

```bash
# Illustrative: excerpt from Ubuntu's default ~/.bashrc
case $- in
    *i*) ;;
      *) return;;
esac
```

(`$-` holds the shell's option letters; `i` means interactive.)

> [!IMPORTANT]
> If `~/.bash_profile` exists, bash ignores `~/.profile` completely. Creating an empty `~/.bash_profile` "to add one line" silently disables everything in `~/.profile` — make it source `~/.profile` or `~/.bashrc`.

### What goes where

| Setting | Put it in | Why |
|---------|-----------|-----|
| Aliases, functions, prompt (`PS1`), shell options, completion | `~/.bashrc` | Needed in every interactive shell |
| Environment variables (`PATH`, `JAVA_HOME`, `EDITOR`) | `~/.profile` (or `~/.bash_profile`) — or `~/.bashrc` if your terminals are non-login | Set once per login and inherited by everything started from it |
| Settings for all users | `/etc/profile.d/myapp.sh` (environment) or `/etc/bash.bashrc` (interactive) | Survives package upgrades better than editing `/etc/profile` |
| Simple `KEY=value` pairs for all sessions | `/etc/environment` | Read by PAM at login; not a script — no `$VAR` expansion, no `export` |
| A service's environment | The systemd unit: `Environment=` / `EnvironmentFile=` | Services do not read any shell startup file |
| A cron job's environment | Variables at the top of the crontab, or set inside the script | cron gives jobs a minimal environment |

### Applying changes

Startup files run only when a shell starts. After editing one:

```bash
# Illustrative
source ~/.bashrc        # re-read it in the current shell (same as: . ~/.bashrc)
exec bash -l            # or replace the current shell with a fresh login shell
```

Running `bash ~/.bashrc` does **not** work — it runs the file in a child shell whose settings vanish when it exits.

### Is this a login shell? Is it interactive?

```bash
# Illustrative: interactive terminal
shopt -q login_shell && echo login || echo "not a login shell"
echo $0          # -bash (leading dash) = login shell, bash = non-login
echo $-          # contains i when interactive
```

## Commands

### alias and unalias

**Purpose:** define short names for commands in interactive shells.

```bash
# Illustrative: interactive session
alias ll='ls -l'
alias              # list all aliases
ll config
type ll
\ll config         # a leading backslash bypasses the alias
unalias ll
ll config
```

**Terminal session:**

```text
$ alias ll='ls -l'
$ alias
alias ll='ls -l'
$ ll config
total 8
-rw-r--r-- 1 student student 119 Jan 15 09:30 app.conf
-rw------- 1 student student  40 Jan 15 09:30 db.conf
$ type ll
ll is aliased to `ls -l'
$ \ll config
bash: ll: command not found
$ unalias ll
$ ll config
bash: ll: command not found
```

Useful aliases people add to `~/.bashrc`:

```bash
# Illustrative: ~/.bashrc
alias ll='ls -lh'
alias la='ls -lA'
alias rm='rm -i'                       # safety net (interactive shells only)
alias grep='grep --color=auto'
alias ports='ss -tulpn'
alias gs='git status'
```

Rules:

- No spaces around `=`; quote the value.
- Aliases expand only in **interactive** shells (scripts ignore them unless `shopt -s expand_aliases`).
- Bypass an alias with `\cmd`, `command cmd` or the full path `/usr/bin/cmd`.
- Aliases cannot take arguments in the middle — use a **function** for that.

### Functions instead of complex aliases

```bash
# Illustrative: interactive session
mkcd() { mkdir -p "$1" && cd "$1"; }
mkcd work/today
pwd
```

**Terminal session:**

```text
$ mkcd() { mkdir -p "$1" && cd "$1"; }
$ mkcd work/today
$ pwd
/home/student/linux-lab/work/today
```

A function runs in the current shell, takes arguments (`$1`, `$@`) and can contain logic — and it works in scripts too.

### source

**Purpose:** run a file in the **current** shell, so its variables, aliases and functions stay.

```bash
echo 'export GREETING="hello from rc"' > myrc.sh
bash -c 'echo "[$GREETING]"'
source myrc.sh
echo "$GREETING"
```

**Output:**

```text
[]
hello from rc
```

## Examples

### Make a PATH change permanent for one user

```bash
# Illustrative
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.profile
echo 'export JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64' >> ~/.profile
# log out and back in (or: source ~/.profile)
```

### A setting for every user

```bash
# Illustrative: needs root
echo 'export MAVEN_HOME=/opt/maven' | sudo tee /etc/profile.d/maven.sh
echo 'export PATH="$MAVEN_HOME/bin:$PATH"' | sudo tee -a /etc/profile.d/maven.sh
```

### "Works in my shell, fails in cron"

```bash
# Illustrative: crontab -e
PATH=/usr/local/bin:/usr/bin:/bin:/opt/maven/bin
JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64
0 2 * * * /home/student/scripts/nightly-build.sh >> /home/student/logs/build.log 2>&1
```

cron does not read `~/.bashrc` or `~/.profile`; set what the job needs in the crontab or at the top of the script.

## Comparison

### .bashrc vs .bash_profile vs .profile

| | `~/.bashrc` | `~/.bash_profile` | `~/.profile` |
|---|---|---|---|
| Read by | Interactive non-login bash | Login bash (first choice) | Login bash if no `.bash_profile`/`.bash_login`; also `sh`/`dash` login shells |
| Typical content | Aliases, functions, prompt, options | Environment; sources `.bashrc` | Environment; sources `.bashrc` (Ubuntu default) |
| Default on Ubuntu | Present | Absent | Present |
| Default on RHEL/Fedora | Present | Present (sources `.bashrc`) | Absent |

### Login vs interactive

| Started as | Login? | Interactive? | Reads |
|-----------|--------|--------------|-------|
| `ssh user@host` | Yes | Yes | profile files (+ `.bashrc` via them) |
| New tab in a desktop terminal | Usually no | Yes | `~/.bashrc` |
| `su -` / `sudo -i` | Yes | Yes | target user's profile files |
| `bash script.sh`, `./script.sh` | No | No | none |
| `ssh host 'command'` | No | No | `~/.bashrc` (bash makes a special exception for ssh), but its interactivity guard returns early |
| cron job | No | No | none — minimal environment |
| systemd service | — | — | none — use `Environment=` |

### Alias vs function vs script

| | Alias | Function | Script |
|---|---|---|---|
| Arguments | Only appended at the end | `$1`, `$@` anywhere | `$1`, `$@` |
| Logic (if, loops) | No | Yes | Yes |
| Runs in | Current shell | Current shell (can `cd`, set variables) | Child process |
| Available in scripts | No (by default) | Yes, if defined/sourced there | Yes |
| Defined in | `~/.bashrc` | `~/.bashrc` or sourced file | A file on `PATH` |

## Common Mistakes

- Editing `~/.bashrc` and expecting already-open terminals or running services to pick it up.
- Creating `~/.bash_profile` and unknowingly disabling `~/.profile`.
- Putting environment variables only in `~/.bashrc` and then wondering why a cron job or desktop app does not see them.
- Writing `export` lines in `/etc/environment` (it is not a shell script).
- Relying on aliases inside scripts.
- Printing text from `~/.bashrc` unconditionally — it can break `scp` and `rsync`, which start non-interactive shells that expect a clean output stream.

## Key Takeaways

- Login shells read `/etc/profile`, `/etc/profile.d/*`, then the first of `~/.bash_profile`, `~/.bash_login`, `~/.profile`; interactive non-login shells read `~/.bashrc`; scripts read nothing.
- Convention: environment in `~/.profile`, interactive settings in `~/.bashrc`, and the profile sources `.bashrc`.
- `source file` applies changes to the current shell; running the file does not.
- Aliases are interactive shortcuts; functions handle arguments and logic.
- Services and cron jobs need their environment configured explicitly.

# Shell Variables, Environment Variables and PATH

**Module:** Shell, Bash and Environment · **Interview priority:** Core

## What Is It?

A **variable** is a name that holds a string. Bash has two kinds:

- **Shell variables** exist only inside the current shell.
- **Environment variables** are shell variables that have been **exported**; they are copied into the environment of every program the shell starts.

```text
shell (bash)
├── shell variables:        name=linux                 ← visible only here
└── environment (exported): HOME PATH USER LANG color  ← copied to every child
        │
        ├──► child process (java, python, bash -c …) gets a COPY of the environment
        └──► a child can change its copy, never the parent's
```

**`PATH`** is the most important environment variable: a colon-separated list of directories the shell searches, in order, to find commands.

## Why It Matters

- Applications are configured through environment variables: `JAVA_HOME`, `SPRING_PROFILES_ACTIVE`, `DATABASE_URL`, `NODE_ENV`, credentials injected by containers and CI systems.
- "command not found" and "the wrong version runs" are `PATH` problems.
- A variable that works in your shell but not in a script, a cron job or a service is almost always "not exported" or "set in a different shell".
- Interview questions: shell vs environment variables, what `export` does, how `PATH` works, how to add to `PATH` permanently.

## Core Concept

### Assigning and reading

```bash
name=linux
echo $name
echo "Hello, $name"
name = linux
```

**Output:**

```text
linux
Hello, linux
bash: name: command not found
```

- **No spaces around `=`.** `name = linux` runs a command called `name` with arguments `=` and `linux`.
- Read a value with `$name` or `${name}`. Braces separate the name from following text:

```bash
greeting="good morning"
echo "${greeting}s"
echo "[$greetings]"
```

**Output:**

```text
good mornings
[]
```

`$greetings` is a different (unset) variable, which expands to an empty string — bash does not complain unless `set -u` is active.

- Quote expansions (`"$name"`) so values containing spaces or wildcards stay one word — see [Quoting and Expansion](../quoting-and-expansion/content.md).
- By convention, environment variables are UPPERCASE (`JAVA_HOME`); local script variables are lowercase.

### export: shell variable → environment variable

```bash
color=blue
bash -c 'echo "child sees: [$color]"'
export color
bash -c 'echo "child sees: [$color]"'
```

**Output:**

```text
child sees: []
child sees: [blue]
```

Before `export`, the child shell did not receive `color`. `export name=value` assigns and exports in one step.

### Setting a variable for one command only

```bash
APP_ENV=test bash -c 'echo "APP_ENV in child: $APP_ENV"'
echo "APP_ENV in shell: [$APP_ENV]"
```

**Output:**

```text
APP_ENV in child: test
APP_ENV in shell: []
```

`VAR=value command` puts `VAR` in that command's environment only. Typical: `SPRING_PROFILES_ACTIVE=dev java -jar app.jar`, `LC_ALL=C sort file`.

### Children cannot change the parent

Environment variables are **copied** at process start. A script that does `export X=1` changes only its own environment; when it exits, your shell is unchanged. To set variables in the **current** shell from a file, `source` it (`source ./env.sh` or `. ./env.sh`).

### Common environment variables

| Variable | Holds |
|----------|-------|
| `HOME` | Your home directory (`~` expands to it) |
| `USER` / `LOGNAME` | Your username |
| `SHELL` | Your login shell |
| `PATH` | Command search directories |
| `PWD` / `OLDPWD` | Current / previous directory |
| `LANG`, `LC_*` | Locale: language, sorting, number formats |
| `EDITOR` / `VISUAL` | Preferred editor for `crontab -e`, `git commit`, `visudo` |
| `TERM` | Terminal type |
| `PS1` | The prompt format |
| `JAVA_HOME` | (Convention) the JDK directory used by build tools |

### How PATH lookup works

When a command name contains no `/`, bash searches the `PATH` directories **left to right** and runs the **first** match (after aliases, functions and builtins).

```bash
echo "$PATH" | tr ':' '\n'
```

**Output (varies):**

```text
/usr/local/sbin
/usr/local/bin
/usr/sbin
/usr/bin
/sbin
/bin
```

- A command in a directory **not** on `PATH` must be run with a path: `./script.sh` or `/opt/tool/bin/tool`.
- The current directory `.` is deliberately **not** on `PATH` (a malicious `ls` dropped into a shared directory would otherwise run).
- Bash caches lookups; after installing a program in another location, `hash -r` clears the cache.

## Commands

### Viewing variables

| Command | Shows |
|---------|-------|
| `echo "$VAR"` | One value |
| `printenv VAR` / `printenv` | One / all environment variables |
| `env` | All environment variables (and can run a command with a modified environment) |
| `set` | All shell variables **and** functions (long) |
| `declare -p VAR` | A variable with its attributes (exported, read-only, array…) |

```bash
printenv HOME
declare -p name
```

**Output:**

```text
/home/student
declare -- name="linux"
```

### unset and readonly

```bash
unset color
echo "[$color]"
readonly LIMIT=10
LIMIT=20
```

**Output:**

```text
[]
bash: LIMIT: readonly variable
```

### Adding a directory to PATH

```bash
mkdir -p ~/bin
printf '#!/bin/bash\necho "hello from my tool"\n' > ~/bin/mytool
chmod +x ~/bin/mytool
mytool
export PATH="$HOME/bin:$PATH"
mytool
command -v mytool
```

**Output:**

```text
bash: mytool: command not found
hello from my tool
/home/student/bin/mytool
```

- **Prepend** (`"$HOME/bin:$PATH"`) to take priority over system commands; **append** (`"$PATH:$HOME/bin"`) to use it only as a fallback.
- Never write `PATH=$HOME/bin` (without `:$PATH`) — every other command becomes "not found" in that shell.
- This change lasts only for the current shell. To make it permanent, add the `export` line to `~/.bashrc` or `~/.profile` (see [Shell Startup Files and Aliases](../shell-startup-files-and-aliases/content.md)).

### Useful parameter expansions

```bash
echo "${missing:-default value}"
echo "${#name}"
file=report.final.txt
echo "${file%.txt}" "${file#*.}" "${file##*.}"
echo "${name^^}"
```

**Output:**

```text
default value
5
report.final final.txt txt
LINUX
```

| Expansion | Result |
|-----------|--------|
| `${var:-default}` | `default` if `var` is unset or empty (does not assign) |
| `${var:=default}` | Same, and assigns it |
| `${var:?message}` | Exit with `message` if unset or empty (guards scripts) |
| `${#var}` | Length |
| `${var%pattern}` / `${var%%pattern}` | Remove shortest / longest match from the **end** |
| `${var#pattern}` / `${var##pattern}` | Remove shortest / longest match from the **start** |
| `${var/old/new}` | Replace first match (`//` replaces all) |
| `${var^^}` / `${var,,}` | Uppercase / lowercase |

## Examples

### Configure an application through the environment

```bash
# Illustrative
export SPRING_PROFILES_ACTIVE=prod
export DB_URL="jdbc:postgresql://db.internal:5432/inventory"
java -jar inventory.jar          # Spring Boot reads both variables
```

### Why does my script not see the variable?

```bash
# Illustrative
API_KEY=abc123          # set but NOT exported
./deploy.sh             # inside: echo "$API_KEY" → empty
export API_KEY
./deploy.sh             # now it sees abc123
```

## Comparison

### Shell variable vs environment variable

| | Shell variable | Environment variable |
|---|---|---|
| Created by | `name=value` | `export name=value` (or `export name`) |
| Visible to child processes | No | Yes (as a copy) |
| Listed by `printenv` / `env` | No | Yes |
| Listed by `set` | Yes | Yes |
| Typical use | Script internals | Configuration for programs |

### source vs running a script

| | `./env.sh` or `bash env.sh` | `source env.sh` / `. env.sh` |
|---|---|---|
| Runs in | A new child process | The current shell |
| Variables, `cd`, functions | Lost when it exits | Stay in your shell |
| Needs execute permission | `./env.sh` yes; `bash env.sh` no | No |

## Common Mistakes

- Spaces around `=`.
- Forgetting `export`, so child programs do not see the variable.
- `PATH=/new/dir` (overwriting instead of extending) — the shell can no longer find `ls`.
- Putting `.` at the front of `PATH` for convenience — a security risk.
- Expecting `./set-env.sh` to change the current shell; use `source`.
- Storing secrets in environment variables and printing them in logs (`env` in CI output, crash dumps).

## Key Takeaways

- `name=value` (no spaces), read with `"$name"` or `"${name}"`.
- `export` makes a variable part of the environment copied to child processes; children cannot modify the parent.
- `VAR=value command` sets a variable for one command.
- `PATH` is searched left to right; extend it with `export PATH="$HOME/bin:$PATH"` and make it permanent in a startup file.
- `printenv`/`env` show environment variables; `set` shows all; `unset` removes; `readonly` protects.
- `${var:-default}`, `${var:?msg}`, `${#var}`, `${var%suffix}`, `${var#prefix}` are everyday expansions.

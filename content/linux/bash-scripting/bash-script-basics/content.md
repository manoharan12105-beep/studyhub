# Bash Script Basics: Shebang, Arguments, read and Exit Codes

**Module:** Bash Scripting · **Interview priority:** Core

## What Is It?

A **bash script** is a text file of commands that bash runs from top to bottom — the same commands you type interactively, saved so they can be repeated, shared and automated. A minimal script:

```bash
#!/bin/bash
# backup.sh - copy the config directory with today's date
cp -r config "config-$(date +%F)"
echo "Backup done"
```

## Why It Matters

- Automation: backups, deployments, log cleanup, health checks, environment setup — anything you do twice.
- Glue for DevOps: CI pipelines, Docker entrypoints, cron jobs and systemd helpers are usually small bash scripts.
- Interviewers ask about `$0`, `$1`, `$#`, `$@` vs `$*`, `$?`, the shebang, and how to make a script fail safely.

## Core Concept

### The shebang

The first line `#!/bin/bash` (the **shebang**) tells the kernel which interpreter runs the file when you execute it directly (`./script.sh`).

| Shebang | Meaning |
|---------|---------|
| `#!/bin/bash` | Run with bash (use when you use bash features: `[[ ]]`, arrays, `$(( ))`…) |
| `#!/usr/bin/env bash` | Find `bash` on `PATH` — portable to systems where bash is elsewhere (e.g. `/usr/local/bin/bash`) |
| `#!/bin/sh` | POSIX shell — on Ubuntu this is `dash`, which lacks bash features |

Without a shebang, `./script.sh` is run by the current shell's fallback (usually `sh`), which may not be bash.

### Three ways to run a script

| Command | Needs `x` permission | Runs in | Shebang used |
|---------|----------------------|---------|--------------|
| `./script.sh` | Yes | New process | Yes |
| `bash script.sh` | No (only read) | New process | No (bash chosen explicitly) |
| `source script.sh` / `. script.sh` | No | **Current shell** | No |

Use `source` only for files that set variables or functions for your shell (see [Shell Startup Files and Aliases](../../shell-and-bash/shell-startup-files-and-aliases/content.md)).

### Special parameters

| Parameter | Holds |
|-----------|-------|
| `$0` | The script's name (as it was invoked) |
| `$1` … `$9`, `${10}` | Positional arguments |
| `$#` | Number of arguments |
| `"$@"` | All arguments, **each as a separate word** — use this to pass arguments on |
| `"$*"` | All arguments joined into **one** word (separated by the first char of `IFS`) |
| `$?` | Exit status of the last command |
| `$$` | PID of the script's shell |
| `$!` | PID of the last background job |

### Exit status

Every command returns 0 for success and 1–255 for failure. A script returns the status of its last command, or the value given to `exit N`. Callers (`if`, `&&`, CI systems, cron monitoring, systemd) rely on it — a script that hides failures by always exiting 0 is a bug.

| Code | Conventional meaning |
|------|----------------------|
| 0 | Success |
| 1 | General error |
| 2 | Wrong usage (bad arguments) |
| 126 | Found but not executable |
| 127 | Command not found |
| 128 + N | Killed by signal N (130 = `Ctrl+C`) |

### Safer scripts: `set -euo pipefail`

| Option | Effect |
|--------|--------|
| `set -e` | Exit as soon as a command fails (with exceptions: inside `if`, `while`, `&&`/`\|\|` lists) |
| `set -u` | Treat use of an unset variable as an error (catches typos like `$fiel`) |
| `set -o pipefail` | A pipeline fails if any stage fails, not just the last |
| `set -x` | Print each command before running it (debugging) |

Many teams start every script with `set -euo pipefail` and handle expected failures explicitly (`grep … || true`).

## Commands

All examples run in a scratch folder:

```bash
mkdir -p scripts
cd scripts
```

### Create, make executable, run

```bash
cat > hello.sh <<'EOF'
#!/bin/bash
# hello.sh - first script
echo "Hello from $0"
user=$(whoami)
echo "Running as $user"
EOF
./hello.sh
chmod +x hello.sh
./hello.sh
bash hello.sh
```

**Output:**

```text
bash: ./hello.sh: Permission denied
Hello from ./hello.sh
Running as student
Hello from hello.sh
Running as student
```

New files are not executable until `chmod +x`. `$0` shows how the script was called. (`cat > file <<'EOF'` writes the lines up to `EOF` into the file — any editor works just as well.)

### Arguments

```bash
cat > args.sh <<'EOF'
#!/bin/bash
echo "Script name : $0"
echo "First arg   : $1"
echo "Second arg  : $2"
echo "Arg count   : $#"
echo "All args    : $@"
EOF
chmod +x args.sh
./args.sh apple "banana split" cherry
```

**Output:**

```text
Script name : ./args.sh
First arg   : apple
Second arg  : banana split
Arg count   : 3
All args    : apple banana split cherry
```

Quotes on the command line keep `banana split` as one argument.

### `"$@"` vs `$*`

```bash
cat > loopargs.sh <<'EOF'
#!/bin/bash
echo 'With "$@":'
for a in "$@"; do echo "  [$a]"; done
echo 'With $*:'
for a in $*; do echo "  [$a]"; done
EOF
bash loopargs.sh one "two words"
```

**Output:**

```text
With "$@":
  [one]
  [two words]
With $*:
  [one]
  [two]
  [words]
```

Always use `"$@"` (with quotes) to loop over or forward arguments.

### shift

`shift` discards `$1` and moves the others down — the classic way to process arguments one by one:

```bash
cat > shift.sh <<'EOF'
#!/bin/bash
while [ $# -gt 0 ]; do
    echo "processing $1 ($# left)"
    shift
done
EOF
bash shift.sh a b c
```

**Output:**

```text
processing a (3 left)
processing b (2 left)
processing c (1 left)
```

### read: input from the user or a pipe

| Option | Meaning |
|--------|---------|
| `-p "Prompt: "` | Show a prompt (only when input comes from a terminal) |
| `-r` | Raw: do not treat backslashes as escapes — use it almost always |
| `-s` | Silent: do not echo (passwords) |
| `-t 10` | Time out after 10 seconds |
| `-a arr` | Read words into an array |

```bash
cat > greet.sh <<'EOF'
#!/bin/bash
read -r -p "Your name: " name
echo "Welcome, $name!"
EOF
echo Asha | bash greet.sh
```

**Output:**

```text
Welcome, Asha!
```

The prompt was not printed because input came from a pipe, not a terminal. Run `bash greet.sh` yourself to see it.

### exit and usage messages

```bash
cat > status.sh <<'EOF'
#!/bin/bash
if [ $# -lt 1 ]; then
    echo "usage: $0 FILE" >&2
    exit 2
fi
echo "checking $1"
EOF
bash status.sh
echo "exit code: $?"
bash status.sh notes.txt
echo "exit code: $?"
```

**Output:**

```text
usage: status.sh FILE
exit code: 2
checking notes.txt
exit code: 0
```

The usage message goes to stderr (`>&2`) and the exit status tells callers the script failed.

### Stop on the first error

```bash
cat > strict.sh <<'EOF'
#!/bin/bash
set -euo pipefail
echo "step 1"
cp /no/such/file /tmp/
echo "step 2 never runs"
EOF
bash strict.sh
echo "exit code: $?"
```

**Output:**

```text
step 1
cp: cannot stat '/no/such/file': No such file or directory
exit code: 1
```

Without `set -e`, "step 2" would run and the script would exit 0 — hiding the failure.

### Debugging with `-x`

```bash
bash -x args.sh demo 2>&1 | head -n 4
```

**Output:**

```text
+ echo 'Script name : args.sh'
Script name : args.sh
+ echo 'First arg   : demo'
First arg   : demo
```

Each command is printed with `+` after expansion, so you see the real values. Use `set -x` / `set +x` inside a script to trace only part of it.

## Examples

### A small, well-behaved script

```bash
cat > count-lines.sh <<'EOF'
#!/bin/bash
# count-lines.sh FILE... - print the number of lines in each file
set -euo pipefail

if [ $# -eq 0 ]; then
    echo "usage: $(basename "$0") FILE..." >&2
    exit 2
fi

for file in "$@"; do
    if [ -f "$file" ]; then
        echo "$file: $(wc -l < "$file") lines"
    else
        echo "$file: not a regular file" >&2
    fi
done
EOF
chmod +x count-lines.sh
./count-lines.sh ../app.log ../access.log ../config
```

**Output:**

```text
../app.log: 12 lines
../access.log: 10 lines
../config: not a regular file
```

It has a shebang, a header comment, strict mode, a usage message on stderr with exit code 2, quoted variables, and it handles any number of arguments with `"$@"`.

## Comparison

### `$@` vs `$*`

| | `"$@"` | `"$*"` | `$@` / `$*` unquoted |
|---|---|---|---|
| Result | One word per argument, spaces preserved | One single word | Split on whitespace and globbed |
| Use | Looping, forwarding (`exec java "$@"`) | Building a message: `echo "args: $*"` | Almost never |

### `exit` vs `return`

| | `exit N` | `return N` |
|---|---|---|
| Ends | The whole script (or shell) | Only the current function (or a sourced file) |
| Status | Script's exit status | Function's status (`$?` after the call) |

## Common Mistakes

- Forgetting `chmod +x` and the `./` prefix (the current directory is not on `PATH`).
- Writing `#!/bin/sh` and using bash features — fails on Ubuntu where `sh` is `dash`.
- Windows line endings: `/bin/bash^M: bad interpreter` — convert with `dos2unix` or `sed -i 's/\r$//'`.
- Using `$*` or unquoted `$@` to forward arguments, breaking arguments with spaces.
- Not checking the number of arguments, then running with empty `$1` (dangerous with `rm`).
- Always exiting 0, or printing errors to stdout instead of stderr.
- `read` without `-r`, which mangles backslashes.

## Key Takeaways

- Start with a shebang (`#!/bin/bash` or `#!/usr/bin/env bash`), make it executable, run with `./script.sh`.
- `$0` name, `$1…` arguments, `$#` count, `"$@"` all arguments safely, `$?` last status, `$$` PID.
- `read -r -p "…" var` reads input; `shift` walks through arguments.
- Exit 0 on success, non-zero on failure; usage errors go to stderr with `exit 2`.
- `set -euo pipefail` makes failures stop the script; `bash -x` traces it.

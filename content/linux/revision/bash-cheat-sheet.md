# Bash Cheat Sheet

Shell syntax and scripting essentials: variables, quoting, expansion, redirection, tests, loops and functions.

## Script Skeleton

```bash
# Illustrative
#!/usr/bin/env bash
set -euo pipefail                      # stop on errors, unset vars, failed pipes

usage() { echo "usage: $0 <dir> [days]" >&2; exit 1; }
[[ $# -ge 1 ]] || usage

dir=$1
days=${2:-7}                           # default value
[[ -d "$dir" ]] || { echo "no such directory: $dir" >&2; exit 2; }

find "$dir" -type f -name '*.log' -mtime +"$days" -print
```

`chmod u+x script.sh` · `./script.sh` (child process) · `source script.sh` (current shell) · `bash -x script.sh` (trace).

## Variables and Special Parameters

| Syntax | Meaning |
|--------|---------|
| `name=value` | Assign (no spaces around `=`) |
| `export NAME=value` | Make it an environment variable for child processes |
| `"$name"` / `"${name}"` | Use (always quote) |
| `$0` `$1`…`$9` `${10}` | Script name, arguments |
| `$#` | Number of arguments |
| `"$@"` | All arguments, each separate |
| `"$*"` | All arguments as one string |
| `$?` | Exit status of the last command |
| `$$` / `$!` | PID of the shell / of the last background job |
| `readonly X=1`, `local x` | Constant, function-local variable |

## Parameter Expansion

| Syntax | Result |
|--------|--------|
| `${var:-def}` | `def` if unset or empty |
| `${var:=def}` | Also assign `def` |
| `${var:?msg}` | Error and exit if unset or empty |
| `${#var}` | Length |
| `${var#pre}` / `${var##pre}` | Remove shortest / longest prefix match |
| `${var%suf}` / `${var%%suf}` | Remove shortest / longest suffix match (`${f%.log}`) |
| `${var/old/new}` / `${var//old/new}` | Replace first / all |
| `${var^^}` / `${var,,}` | Upper / lower case |
| `${var:2:3}` | Substring |

## Quoting and Expansion

- `'single'` — literal, nothing expands.
- `"double"` — `$var`, `$(cmd)`, `$((expr))`, `\` expand; no word splitting or globbing.
- `\x` — escape one character.
- `$(cmd)` command substitution · `$((a + b))` integer arithmetic · `{1..5}`, `{a,b}` brace expansion · `*`, `?`, `[abc]` globs · `~` home.
- Order: brace → tilde → parameter/command/arithmetic → word splitting → globbing → quote removal.

## Redirection

| Syntax | Meaning |
|--------|---------|
| `> f` / `>> f` | stdout to file (overwrite / append) |
| `2> f` / `2>> f` | stderr to file |
| `> f 2>&1` / `&> f` | Both to file (order matters) |
| `2>/dev/null` | Discard errors |
| `< f` | stdin from file |
| `<<EOF … EOF` / `<<'EOF'` | Here-document (quoted = no expansion) |
| `<<< "text"` | Here-string |
| `a \| b` / `a \|& b` | Pipe stdout / stdout+stderr |
| `<(cmd)` | Process substitution (`diff <(sort a) <(sort b)`) |

## Tests

| Test | True when |
|------|-----------|
| `-e f` / `-f f` / `-d f` / `-L f` | Exists / regular file / directory / symlink |
| `-r f` / `-w f` / `-x f` / `-s f` | Readable / writable / executable / non-empty |
| `-z "$s"` / `-n "$s"` | Empty / non-empty string |
| `"$a" = "$b"` / `!=` | String equality (`==` in `[[ ]]`) |
| `[[ $f == *.log ]]` / `[[ $s =~ ^[0-9]+$ ]]` | Glob / regex match |
| `-eq -ne -lt -le -gt -ge` | Integer comparison in `[ ]` |
| `(( n > 5 ))` | Arithmetic comparison |
| `&&` / `\|\|` / `!` | And / or / not (inside `[[ ]]`) |

## Control Flow

```bash
# Illustrative
if [[ -f "$file" ]]; then echo "file"; elif [[ -d "$file" ]]; then echo "dir"; else echo "missing"; fi

case "$1" in
  start|run) echo "starting" ;;
  stop)      echo "stopping" ;;
  *)         echo "usage: $0 {start|stop}" >&2; exit 1 ;;
esac

for f in *.log; do echo "$f"; done
for ((i = 1; i <= 3; i++)); do echo "$i"; done
while IFS= read -r line; do echo "$line"; done < file.txt
until ping -c 1 -W 1 db >/dev/null; do sleep 2; done

cmd && echo "ok" || echo "failed"
```

`break`, `continue`, `exit N`, `return N` (functions).

## Functions

```bash
# Illustrative
log() { printf '%s %s\n' "$(date +%T)" "$*" >&2; }
backup() {
    local src=$1 dest=${2:-/tmp}
    tar -czf "$dest/$(basename "$src").tar.gz" "$src" || return 1
}
backup ~/projects /backups && log "backup ok"
```

Output with `echo`/`printf`; status with `return`; capture with `result=$(func)`.

## Robustness

- `set -e` exit on error · `set -u` unset variables are errors · `set -o pipefail` · `set -x` trace.
- `trap 'rm -f "$tmp"' EXIT` for cleanup; `mktemp` for temporary files.
- `flock -n /tmp/x.lock cmd` to prevent parallel runs.
- Quote everything; use `--` before file names; never parse `ls`; `find -print0 | xargs -0`.
- `shellcheck script.sh` finds most mistakes.

## Startup Files

`~/.bash_profile` / `~/.profile` — login shells (environment, `PATH`) · `~/.bashrc` — interactive non-login shells (aliases, prompt, functions) · `/etc/profile`, `/etc/bash.bashrc` — system-wide · `source ~/.bashrc` reloads · `alias ll='ls -alF'`, `unalias ll`.

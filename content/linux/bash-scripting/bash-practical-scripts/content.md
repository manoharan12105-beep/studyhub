# Practical Bash Scripts

**Module:** Bash Scripting · **Interview priority:** Frequently asked

## What Is It?

Five complete, beginner-friendly scripts that combine everything from the scripting topics — arguments, conditionals, loops, functions, pipelines and exit codes — into tools you would actually use:

| Script | Does | Shows |
|--------|------|-------|
| `log-summary.sh` | Counts log levels and lists error messages | Pipelines, `grep -c`, formatting with `printf` |
| `dept-report.sh` | Headcount and average salary per department from a CSV | `while read`, associative arrays, arithmetic |
| `cleanup.sh` | Deletes old log files, with a dry-run option | `getopts`, `find -print0`, safe deletion |
| `backup.sh` | Timestamped `tar.gz` backups, keeping only the newest N | `tar`, dates, rotation |
| `disk-check.sh` | Warns when filesystems are nearly full | Parsing command output, exit codes for monitoring |

## Why It Matters

- Interviews for backend and DevOps roles often include "write a script that…" — summarise a log, clean old files, check disk space, back something up.
- These patterns (validate input → do the work → report → exit with a meaningful status) apply to every automation script.

## Core Concept

### A checklist for every script

1. **Shebang** and a one-line comment saying what it does and how to call it.
2. **`set -euo pipefail`** so failures stop the script.
3. **Validate arguments** early: `${1:?usage: …}`, `[ -d "$dir" ] || …`.
4. **Quote every variable**: `"$file"`, `"$@"`.
5. **Errors to stderr** (`>&2`), with a **non-zero exit code**.
6. **Dry-run option** for anything destructive.
7. **Idempotent**: running it twice should not break anything (`mkdir -p`, check before acting).
8. **Absolute paths or a known working directory** if it will run from cron.

## Examples

All scripts are created in `~/linux-lab/scripts` and run from `~/linux-lab`.

```bash
mkdir -p scripts
```

### Log summary

```bash
cat > scripts/log-summary.sh <<'EOF'
#!/bin/bash
# log-summary.sh LOGFILE - count log levels and list the error messages
set -euo pipefail

log=${1:?usage: log-summary.sh LOGFILE}
[ -r "$log" ] || { echo "cannot read $log" >&2; exit 1; }

echo "Summary of $log"
echo "Total lines: $(wc -l < "$log")"
for level in INFO WARN ERROR; do
    printf '  %-5s %3d\n' "$level" "$(grep -c " $level " "$log" || true)"
done
echo "Errors:"
grep ' ERROR ' "$log" | cut -d' ' -f2,4- | sed 's/^/  /'
EOF
bash scripts/log-summary.sh app.log
```

**Output:**

```text
Summary of app.log
Total lines: 12
  INFO    7
  WARN    2
  ERROR   3
Errors:
  09:15:42 [db] Connection timed out after 30s
  10:30:00 [payment] Payment gateway returned 503
  10:30:01 [payment] Order 1042 payment failed
```

Notes:

- `grep -c` exits 1 when the count is 0, which `set -e` would treat as a failure — `|| true` keeps the script going.
- Spaces around the level (`" ERROR "`) stop `ERROR` matching inside a message.
- `cut -d' ' -f2,4-` keeps the time and everything after the level; `sed 's/^/  /'` indents each line.

### Department report

```bash
cat > scripts/dept-report.sh <<'EOF'
#!/bin/bash
# dept-report.sh CSV - headcount and average salary per department
set -euo pipefail
csv=${1:?usage: dept-report.sh CSV}

declare -A count total          # associative arrays: department -> number
while IFS=, read -r id name dept salary city; do
    count[$dept]=$(( ${count[$dept]:-0} + 1 ))
    total[$dept]=$(( ${total[$dept]:-0} + salary ))
done < <(tail -n +2 "$csv")

printf '%-12s %5s %10s\n' DEPT COUNT AVG_SALARY
for dept in $(printf '%s\n' "${!count[@]}" | sort); do
    printf '%-12s %5d %10d\n' "$dept" "${count[$dept]}" $(( total[$dept] / count[$dept] ))
done
EOF
bash scripts/dept-report.sh employees.csv
```

**Output:**

```text
DEPT         COUNT AVG_SALARY
engineering      3      85000
hr               2      49000
sales            3      52666
```

- `declare -A` creates associative arrays (bash 4+); `${!count[@]}` lists their keys, which have no defined order — hence the `sort`.
- Bash arithmetic is integer-only: the sales average 52666.67 is truncated. [awk](../../find-sed-awk/awk-command/content.md) handles decimals and does this report in one line.

### Cleanup with options and a dry run

```bash
cat > scripts/cleanup.sh <<'EOF'
#!/bin/bash
# cleanup.sh [-n] [-d DAYS] DIR - delete *.log files older than DAYS (default 7); -n = dry run
set -euo pipefail

days=7
dry_run=false
while getopts "nd:" opt; do
    case "$opt" in
        n) dry_run=true ;;
        d) days=$OPTARG ;;
        *) echo "usage: cleanup.sh [-n] [-d DAYS] DIR" >&2; exit 2 ;;
    esac
done
shift $((OPTIND - 1))
dir=${1:?usage: cleanup.sh [-n] [-d DAYS] DIR}

find "$dir" -maxdepth 1 -name '*.log' -type f -mtime +"$days" -print0 | sort -z |
while IFS= read -r -d '' f; do
    if $dry_run; then
        echo "would delete $f"
    else
        rm -- "$f"
        echo "deleted $f"
    fi
done
EOF
bash scripts/cleanup.sh -n logs
bash scripts/cleanup.sh -n -d 15 logs
bash scripts/cleanup.sh -d 15 logs
ls logs
```

**Output:**

```text
would delete logs/app-2026-01-01.log
would delete logs/app-2026-01-08.log
would delete logs/app-2026-01-01.log
deleted logs/app-2026-01-01.log
app-2026-01-08.log  app-2026-01-14.log  archive  debug.log
```

- **`getopts "nd:"`** parses short options: `n` is a flag, `d:` takes a value (in `$OPTARG`). After the loop, `shift $((OPTIND - 1))` leaves only the non-option arguments.
- `find … -print0` with `read -d ''` handles any filename safely; `sort -z` makes the order predictable.
- `-mtime +7` means "modified more than 7 full days ago" (see [find](../../find-sed-awk/find-command/content.md)).

An unknown option:

```bash
bash scripts/cleanup.sh -x logs
echo "status $?"
```

**Output:**

```text
scripts/cleanup.sh: illegal option -- x
usage: cleanup.sh [-n] [-d DAYS] DIR
status 2
```

### Timestamped backups with rotation

```bash
cat > scripts/backup.sh <<'EOF'
#!/bin/bash
# backup.sh SOURCE_DIR [KEEP] - archive a directory with a timestamp, keep the newest KEEP archives
set -euo pipefail

src=${1:?usage: backup.sh SOURCE_DIR [KEEP]}
keep=${2:-3}
dest="$HOME/backups"
name="$(basename "$src")"
stamp=$(date +%Y%m%d-%H%M%S)

[ -d "$src" ] || { echo "error: $src is not a directory" >&2; exit 1; }
mkdir -p "$dest"

archive="$dest/$name-$stamp.tar.gz"
tar -czf "$archive" -C "$(dirname "$src")" "$name"
echo "created $(basename "$archive")"

# delete all but the newest $keep archives of this directory
ls -1t "$dest/$name"-*.tar.gz | tail -n +$((keep + 1)) | while read -r old; do
    rm -- "$old"
    echo "removed old backup $(basename "$old")"
done
EOF
for i in 1 2 3; do bash scripts/backup.sh config 2; sleep 1; done
ls ~/backups
```

**Output (varies):**

```text
created config-20260115-093001.tar.gz
created config-20260115-093002.tar.gz
created config-20260115-093003.tar.gz
removed old backup config-20260115-093001.tar.gz
config-20260115-093002.tar.gz  config-20260115-093003.tar.gz
```

- `tar -C "$(dirname "$src")" "$name"` stores paths relative to the parent, so the archive extracts as `config/…` instead of a full absolute path.
- `ls -1t … | tail -n +$((keep + 1))` lists archives newest first and selects everything after the first `keep` — the old ones. (The names contain no spaces, so `ls` output is safe here; for arbitrary names use `find`.)
- Timestamps sort correctly as text because the format goes from year down to second.

Scheduled nightly from cron (see [Cron and Scheduling](../../system-management/cron-scheduling/content.md)):

```bash
# Illustrative: crontab entry
30 1 * * * /home/student/linux-lab/scripts/backup.sh /home/student/projects 7 >> /home/student/backup.log 2>&1
```

### Disk space check for monitoring

```bash
cat > scripts/disk-check.sh <<'EOF'
#!/bin/bash
# disk-check.sh [THRESHOLD] - warn about filesystems above THRESHOLD percent used (default 80)
threshold=${1:-80}
status=0
while read -r fs size used avail pcent mount; do
    pct=${pcent%\%}
    if (( pct >= threshold )); then
        echo "WARNING: $mount is ${pct}% full ($avail available)"
        status=1
    fi
done < <(df -hP -x tmpfs -x devtmpfs | tail -n +2)
[ "$status" -eq 0 ] && echo "OK: all filesystems below ${threshold}%"
exit "$status"
EOF
bash scripts/disk-check.sh 101
echo "status $?"
```

**Output:**

```text
OK: all filesystems below 101%
status 0
```

With a realistic threshold, the output depends on your disks:

```bash
# Illustrative
bash scripts/disk-check.sh 80
# WARNING: /var is 91% full (2.1G available)
```

- `df -P` (POSIX format) guarantees one line per filesystem, which makes parsing reliable; `-x tmpfs` skips RAM-based filesystems.
- `${pcent%\%}` strips the `%` sign so `(( ))` can compare numbers.
- The exit status (0 OK, 1 warning) lets monitoring tools and cron wrappers act on the result.

## Common Mistakes

- Forgetting that `grep -c`, `grep -q` and `diff` return 1 for "no match/different" — under `set -e` that stops the script.
- Parsing `ls` output for arbitrary filenames instead of using globs or `find -print0`.
- No dry-run or confirmation for scripts that delete things.
- Hard-coding relative paths in scripts meant for cron.
- Using bash arithmetic for averages and money (integer-only).
- Writing a 200-line bash script for something `awk`, `find` or a proper language would do in a few lines — bash is glue, not a general-purpose application language.

## Key Takeaways

- Structure: shebang → `set -euo pipefail` → validate input → work → report → exit code.
- `getopts` parses options; `${1:?usage}` enforces required arguments.
- Use `find -print0` + `read -d ''` (or `xargs -0`) for safe file handling, and offer `-n` dry runs.
- `tar -czf` + timestamps + rotation = a basic backup; `df -P` parsing + exit codes = a basic monitor.
- Quote variables, send errors to stderr, and handle commands whose non-zero exit is not an error.

# Practical Bash Scripts — Interview Questions

## Intermediate

### Q1. Write a script that prints the 5 most frequent error messages in a log.

<details>
<summary>Answer</summary>

```bash
# Illustrative
#!/bin/bash
set -euo pipefail
log=${1:?usage: top-errors.sh LOGFILE}
grep ' ERROR ' "$log" | cut -d' ' -f4- | sort | uniq -c | sort -rn | head -n 5
```

Extract the message part, group identical messages with `sort`, count with `uniq -c`, order by count. Mention normalising variable parts (IDs, numbers) with `sed -E 's/[0-9]+/N/g'` so similar errors group together.

</details>

### Q2. How would you write a script that deletes files older than 30 days, safely?

<details>
<summary>Answer</summary>

Use `find` with explicit conditions and print first: `find /var/log/myapp -type f -name '*.log' -mtime +30 -print`. When the list is right, replace `-print` with `-delete` (or `-print0 | xargs -0 rm --`). In a script, add a dry-run flag, validate the directory argument (never allow empty or `/`), restrict depth if needed (`-maxdepth`), and log what was deleted.

</details>

### Q3. How do you parse options like `-v -o file` in a bash script?

<details>
<summary>Answer</summary>

With the `getopts` builtin:

```bash
# Illustrative
verbose=false; out=/dev/stdout
while getopts "vo:" opt; do
    case $opt in
        v) verbose=true ;;
        o) out=$OPTARG ;;
        *) echo "usage: $0 [-v] [-o file] args" >&2; exit 2 ;;
    esac
done
shift $((OPTIND - 1))      # "$@" now holds the remaining arguments
```

A colon after a letter means it takes a value. `getopts` handles short options only; long options need manual parsing or GNU `getopt`.

</details>

### Q4. How would you check whether a service is running and restart it if not, from a script?

<details>
<summary>Answer</summary>

```bash
# Illustrative
if ! systemctl is-active --quiet nginx; then
    echo "$(date '+%F %T') nginx down, restarting" >> /var/log/nginx-watch.log
    systemctl restart nginx
fi
```

`systemctl is-active --quiet` returns 0 when active. In practice, `Restart=on-failure` in the unit file is better than a cron watchdog; the script is useful for extra checks (e.g. an HTTP health endpoint with `curl -sf`).

</details>

### Q5. A script works when you run it but fails from cron. What do you check?

<details>
<summary>Answer</summary>

Cron's environment: a minimal `PATH` (commands not found), no `~/.bashrc` variables, a different working directory (relative paths break), no terminal (interactive prompts hang or fail), and output going nowhere. Fix with absolute paths, setting `PATH` and needed variables in the crontab or script, `cd` to a known directory, and redirecting `>> log 2>&1` so errors are visible. Also check that the file is executable and has a proper shebang.

</details>

## Advanced

### Q6. How do you prevent two copies of a cron script from running at the same time?

<details>
<summary>Answer</summary>

Use a lock. The simplest robust way is `flock`:

```bash
# Illustrative
exec 9> /var/lock/backup.lock
flock -n 9 || { echo "already running" >&2; exit 1; }
# … script body …
```

Or in the crontab: `flock -n /var/lock/backup.lock /opt/scripts/backup.sh`. The kernel releases the lock automatically when the process exits, even after a crash — unlike a hand-made PID file.

</details>

### Q7. How do you make a script clean up temporary files even if it fails?

<details>
<summary>Answer</summary>

```bash
# Illustrative
tmpdir=$(mktemp -d)
trap 'rm -rf -- "$tmpdir"' EXIT
```

`mktemp` creates a unique, private directory; the `EXIT` trap runs on normal exit, on `exit` after errors (including `set -e` aborts) and after `INT`/`TERM` if those are trapped to `exit`. It cannot run after `SIGKILL`.

</details>

### Q8. When would you stop writing bash and use Python (or another language)?

<details>
<summary>Answer</summary>

When the script needs complex data structures, JSON/YAML handling, floating-point maths, robust error handling and retries, unit tests, more than a few hundred lines, or portability to Windows. Bash is excellent glue for running commands and pipelines; beyond that, a general-purpose language is easier to maintain.

</details>

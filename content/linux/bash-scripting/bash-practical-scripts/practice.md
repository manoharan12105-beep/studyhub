# Practical Bash Scripts — Practice

All items start in `~/linux-lab`.

### P1. Count requests per status

**Difficulty:** Easy · **Type:** Script · **Concepts:** pipelines in a script

Write `scripts/status-count.sh LOGFILE` that prints each HTTP status code from an access log with its count, most frequent first. Run it on `access.log`.

<details>
<summary>Answer</summary>

```bash
mkdir -p scripts
cat > scripts/status-count.sh <<'EOF'
#!/bin/bash
set -euo pipefail
log=${1:?usage: status-count.sh LOGFILE}
cut -d' ' -f9 "$log" | sort | uniq -c | sort -rn
EOF
bash scripts/status-count.sh access.log
```

**Output:**

```text
      6 200
      2 404
      1 500
      1 302
```

</details>

### P2. Required argument

**Difficulty:** Easy · **Type:** Output · **Concepts:** ${1:?}

What happens when `status-count.sh` is run without an argument?

```bash
bash scripts/status-count.sh || echo "failed as expected"
```

<details>
<summary>Answer</summary>

**Output:**

```text
scripts/status-count.sh: line 3: 1: usage: status-count.sh LOGFILE
failed as expected
```

`${1:?message}` prints the message to stderr and exits non-zero when `$1` is missing.

</details>

### P3. Highest salary per department

**Difficulty:** Medium · **Type:** Script · **Concepts:** sort, loops

Write a pipeline or short script that prints, for each department in `employees.csv`, the employee with the highest salary.

<details>
<summary>Answer</summary>

```bash
tail -n +2 employees.csv | sort -t, -k3,3 -k4,4nr | awk -F, '!seen[$3]++ {print $3": "$2" ("$4")"}'
```

**Output:**

```text
engineering: meena (92000)
hr: divya (50000)
sales: fatima (61000)
```

Sorting by department and then salary descending puts each department's top earner first; `awk '!seen[$3]++'` keeps the first line per department.

</details>

### P4. Dry run first

**Difficulty:** Medium · **Type:** Conceptual · **Concepts:** safe destructive scripts

Name four safeguards a script that deletes files should have.

<details>
<summary>Answer</summary>

Any four of: a dry-run mode that only prints what would be deleted; validation that the target directory argument is non-empty, exists and is not `/` or a system path (`${dir:?}`); precise selection (`find` with `-type f`, `-name`, `-mtime`, `-maxdepth`); safe filename handling (`-print0`/`-0`, `--`); logging of every deletion; `set -euo pipefail`; a lock so it cannot run twice; running as a low-privilege user.

</details>

### P5. getopts

**Difficulty:** Medium · **Type:** Output · **Concepts:** getopts, OPTARG, OPTIND

What does this print?

```bash
cat > scripts/opts.sh <<'EOF'
#!/bin/bash
level=info
while getopts "ql:" o; do
    case $o in
        q) quiet=yes ;;
        l) level=$OPTARG ;;
    esac
done
shift $((OPTIND - 1))
echo "quiet=${quiet:-no} level=$level rest=$*"
EOF
bash scripts/opts.sh -q -l debug file1 file2
```

<details>
<summary>Answer</summary>

**Output:**

```text
quiet=yes level=debug rest=file1 file2
```

</details>

### P6. Make cron-safe

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** cron environment

This script works by hand but in cron writes an empty report:

```bash
# Illustrative
#!/bin/bash
cd reports
mysqldump shop > shop.sql
```

List what you would change.

<details>
<summary>Answer</summary>

Use absolute paths (`cd /home/student/reports || exit 1`), call tools by full path or set `PATH` at the top, add `set -euo pipefail`, redirect errors to a log in the crontab entry (`>> /home/student/logs/dump.log 2>&1`), and provide credentials through a protected option file (`~/.my.cnf`, mode 600) because cron cannot answer a password prompt.

</details>

### P7. Prevent overlap

**Difficulty:** Hard · **Type:** Command · **Concepts:** flock

A cron job runs every 5 minutes but sometimes takes 7 minutes, so two copies overlap. Change the crontab line to skip a run if the previous one is still active.

<details>
<summary>Answer</summary>

```bash
# Illustrative: crontab entry
*/5 * * * * flock -n /tmp/sync.lock /opt/scripts/sync.sh >> /var/log/sync.log 2>&1
```

`flock -n` exits immediately if another process holds the lock; the lock is released automatically when `sync.sh` finishes.

</details>

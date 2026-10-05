# find: Searching for Files

**Module:** find, sed and awk · **Interview priority:** Core

## What Is It?

`find` walks a directory tree and selects files by their **attributes** — name, type, size, modification time, permissions, owner — then performs an **action** on each match: print it (the default), delete it, or run a command on it.

```text
find [starting-points] [expression]

find  /var/log   -name '*.log' -size +100M -mtime +7   -exec ls -lh {} +
      └──┬───┘   └─────────────── tests ────────────┘  └───── action ─────┘
      where to look        which files                  what to do with them
```

## Why It Matters

- "Which file is filling the disk?", "which logs are older than 30 days?", "who left world-writable files?", "where is that config file?" — all `find` questions.
- Bulk operations (change permissions, compress, delete) on exactly the right files.
- Interviewers expect `find` by name, type, size and time, plus `-exec` and the difference between `{} \;` and `{} +`.

## Core Concept

### How find evaluates an expression

For **each file** it visits, `find` evaluates the expression **left to right**:

- Tests placed next to each other are joined by an implicit **AND** (`-a`). Evaluation stops at the first false test (short-circuit), so cheap tests should come first.
- `-o` means OR; `!` or `-not` negates; `\( … \)` groups (escaped so the shell does not interpret the parentheses).
- If the expression contains no action, `-print` is added at the end.

```text
file ./logs/debug.log:   -name '*.log' ✔ → -size +1M ✔ → -print → printed
file ./app.log:          -name '*.log' ✔ → -size +1M ✘ → stop, not printed
file ./notes.txt:        -name '*.log' ✘ → stop
```

### Tests

| Test | Selects | Example |
|------|---------|---------|
| `-name 'pattern'` | Name matches a glob (case-sensitive) | `-name '*.java'` |
| `-iname 'pattern'` | Same, case-insensitive | `-iname 'readme*'` |
| `-path 'pattern'` | Whole path matches | `-path '*/test/*'` |
| `-type f` / `d` / `l` | Regular file / directory / symlink | `-type d` |
| `-size +N` / `-N` / `N` | Larger / smaller / exactly (units: `c` bytes, `k`, `M`, `G`) | `-size +100M` |
| `-mtime +N` / `-N` | Modified more / less than N days ago | `-mtime +30` |
| `-mmin +N` / `-N` | Modified more / less than N minutes ago | `-mmin -10` |
| `-newer file` | Modified more recently than `file` | `-newer deploy.marker` |
| `-perm MODE` | Permission bits (see below) | `-perm -o=w` |
| `-user name` / `-group name` | Owner / group | `-user www-data` |
| `-nouser` | Owner UID has no account | Orphaned files |
| `-empty` | Empty file or directory | `-type f -empty` |
| `-maxdepth N` / `-mindepth N` | Limit recursion depth (put first) | `-maxdepth 1` |

**Quote patterns** (`-name '*.log'`). Unquoted, the shell may expand `*.log` against the current directory before `find` runs.

### Time: what `+7` really means

`-mtime N` compares the file's age in **whole days, rounded down**:

| Test | True when the age (truncated to days) is | In practice |
|------|------------------------------------------|-------------|
| `-mtime +7` | greater than 7 | at least 8 full days old |
| `-mtime 7` | exactly 7 | between 7 and 8 days old |
| `-mtime -7` | less than 7 | modified within the last 7 days |

### Size: units round up

`-size` rounds a file's size **up** to whole units before comparing. With `M`, a 500-byte file counts as 1 MiB — so `-size -1M` ("less than 1 unit") matches only empty files. Use bytes (`c`) or `k` for small thresholds: `-size -100c`, `-size -500k`.

### Permissions: three forms

| Form | Matches when | Example |
|------|--------------|---------|
| `-perm 644` | Mode is **exactly** 644 | |
| `-perm -644` | **All** of these bits are set (others may be too) | `-perm -u=x` executable by owner |
| `-perm /022` | **Any** of these bits is set | `-perm /o=w` world-writable |

### Actions

| Action | Does |
|--------|------|
| `-print` | Print the path (default) |
| `-print0` | Print paths separated by NUL — for `xargs -0` |
| `-printf 'fmt'` | Custom output: `%p` path, `%f` name, `%s` size, `%TY-%Tm-%Td` date (GNU) |
| `-ls` | `ls -dils`-style line |
| `-delete` | Delete the file (implies `-depth`) |
| `-exec cmd {} \;` | Run `cmd` once **per file** (`{}` = the path) |
| `-exec cmd {} +` | Run `cmd` with **many files at once** (faster) |
| `-ok cmd {} \;` | Like `-exec … \;` but asks for confirmation |
| `-prune` | Do not descend into the matched directory |

## Commands

### By name and type

```bash
find . -name '*.java' | sort
```

**Output:**

```text
./project/src/Main.java
./project/src/Order.java
./project/src/OrderService.java
./project/src/PaymentService.java
./project/test/OrderServiceTest.java
```

`find` lists files in directory order, which differs between filesystems — the examples pipe into `sort` for stable output.

```bash
find . -iname 'readme*'
find . -type d | sort
```

**Output:**

```text
./project/readme.md
.
./config
./logs
./logs/archive
./project
./project/docs
./project/src
./project/test
```

Several names with OR (note the escaped parentheses):

```bash
find . \( -name '*.conf' -o -name '*.csv' \) | sort
```

**Output:**

```text
./config/app.conf
./config/db.conf
./employees.csv
```

Only the current directory, and excluding a path:

```bash
find . -maxdepth 1 -type f -name '*.log' | sort
find . -name '*.log' -not -path './logs/*' | sort
```

**Output:**

```text
./access.log
./app.log
./access.log
./app.log
```

### By size

```bash
find . -size +1M
find . -type f -name '*.log' -size -100c | sort
```

**Output:**

```text
./logs/debug.log
./logs/app-2026-01-01.log
./logs/app-2026-01-08.log
./logs/app-2026-01-14.log
```

The rounding trap — no file here is under 1 MiB *and* matched, except empty ones:

```bash
touch empty.txt
find . -type f -size -1M
```

**Output:**

```text
./empty.txt
```

### By modification time

In the lab, the dated logs were modified 20, 10 and 2 days ago, and the archive 30 days ago:

```bash
find logs -mtime +7 | sort
```

**Output:**

```text
logs/app-2026-01-01.log
logs/app-2026-01-08.log
logs/archive/app-2025-12-01.log.gz
```

```bash
find logs -type f -mtime -7 | sort
```

**Output:**

```text
logs/app-2026-01-14.log
logs/debug.log
```

```bash
find logs -mtime +15 | sort
```

**Output:**

```text
logs/app-2026-01-01.log
logs/archive/app-2025-12-01.log.gz
```

### By permissions and owner

```bash
find . -perm 600
chmod u+x project/build.sh
find . -type f -perm -u=x
```

**Output:**

```text
./config/db.conf
./project/build.sh
```

Security audits look for world-writable files: `find / -xdev -type f -perm /o=w 2>/dev/null`.

### Custom output

```bash
find . -type f -name 'v*.txt' -printf '%s %p\n' | sort
find project -type f -name '*.java' -printf '%f\n' | sort
```

**Output:**

```text
74 ./v1.txt
96 ./v2.txt
Main.java
Order.java
OrderService.java
OrderServiceTest.java
PaymentService.java
```

### -exec: run a command on the results

```bash
find . -name '*.java' -exec wc -l {} + | sort
```

**Output:**

```text
  2 ./project/test/OrderServiceTest.java
  3 ./project/src/Main.java
  3 ./project/src/Order.java
  3 ./project/src/OrderService.java
  3 ./project/src/PaymentService.java
 14 total
```

With `+`, `find` passed all five files to **one** `wc` (hence the total). With `\;`, it runs the command once per file:

```bash
find . -name '*.java' -exec grep -l TODO {} \; | sort
```

**Output:**

```text
./project/src/Main.java
./project/src/Order.java
./project/src/OrderService.java
./project/src/PaymentService.java
```

`{}` is replaced by each path; `\;` (escaped so the shell passes `;` to `find`) ends the command.

### -delete

```bash
find logs -name '*.log' -mtime +15 -print
find logs -name '*.log' -mtime +15 -delete
ls logs
```

**Output:**

```text
logs/app-2026-01-01.log
app-2026-01-08.log  app-2026-01-14.log  archive  debug.log
```

> [!CAUTION]
> Always run the command with `-print` first and read the list, then replace `-print` with `-delete`. Put `-delete` **last**: `find . -delete -name '*.tmp'` deletes **everything**, because `-delete` runs before the name test. The same care applies to `-exec rm`, and to `-exec chmod`/`chown` on large trees.

### Errors

```bash
find nosuch
```

**Output:**

```text
find: ‘nosuch’: No such file or directory
```

Searching system directories as a normal user prints many "Permission denied" lines; add `2>/dev/null` to hide them.

## Examples

### The largest files under a directory

```bash
# Illustrative
find /var -xdev -type f -size +100M -exec ls -lh {} + 2>/dev/null | sort -k5 -h | tail
find /var -xdev -type f -printf '%s %p\n' 2>/dev/null | sort -n | tail -n 10
```

`-xdev` stays on one filesystem (does not descend into other mounts).

### Logs older than 30 days: compress, then delete after 90

```bash
# Illustrative
find /var/log/myapp -name '*.log' -mtime +30 -exec gzip {} +
find /var/log/myapp -name '*.log.gz' -mtime +90 -delete
```

### Files changed in the last hour (what did that deploy touch?)

```bash
# Illustrative
find /etc /opt/app -mmin -60 -type f 2>/dev/null
```

### Fix permissions: directories 755, files 644

```bash
# Illustrative
find /srv/site -type d -exec chmod 755 {} +
find /srv/site -type f -exec chmod 644 {} +
```

### Skip a directory entirely

```bash
# Illustrative
find . -path ./node_modules -prune -o -name '*.js' -print
```

`-prune` stops descent into `node_modules`; `-o … -print` handles everything else (the explicit `-print` is needed so pruned directories are not printed).

## Comparison

### find vs locate vs grep -r

| | `find` | `locate` | `grep -r` |
|---|---|---|---|
| Searches | Live filesystem, by attributes | A prebuilt database of names | File **contents** |
| Speed | Slower on big trees | Instant | Depends on data size |
| Up to date | Always | Only since the last `updatedb` | Always |
| Criteria | Name, size, time, perms, owner, type… | Name only | Text patterns |

### `-exec {} \;` vs `-exec {} +` vs `xargs`

| | `-exec cmd {} \;` | `-exec cmd {} +` | `-print0 \| xargs -0 cmd` |
|---|---|---|---|
| Runs `cmd` | Once per file | Once per batch | Once per batch |
| Speed for thousands of files | Slow | Fast | Fast |
| `{}` position | Anywhere | Must be last | Last (or `-I {}`) |
| Parallel | No | No | `-P N` |

## Common Mistakes

- Unquoted patterns: `find . -name *.log`.
- `-size -1M` expecting "smaller than a megabyte" (only empty files match).
- Misreading `-mtime +7` as "7 days or older" (it is 8+ full days).
- Putting `-delete` (or a broad `-exec rm`) before the tests.
- Forgetting `\(` `\)` around `-o` combinations: `find . -name '*.log' -o -name '*.txt' -delete` deletes only `.txt` files and prints nothing for `.log` (the action binds to the last test).
- Searching `/` without `-xdev` and `2>/dev/null`, drowning in `/proc` and permission errors.

## Key Takeaways

- `find PATH tests actions`; tests are ANDed left to right; default action `-print`.
- Key tests: `-name`/`-iname`, `-type f|d|l`, `-size +100M`, `-mtime +30`/`-mmin -60`, `-perm`, `-user`, `-empty`, `-maxdepth`.
- `-mtime +N` = older than N whole days; `-size` rounds up to units.
- Actions: `-print0`, `-printf`, `-delete` (last, after a `-print` dry run), `-exec … {} +` (batched) or `{} \;` (per file).
- `find` searches names and attributes; `grep` searches contents; combine them with `-exec grep -l … {} +`.

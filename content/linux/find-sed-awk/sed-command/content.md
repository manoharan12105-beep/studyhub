# sed: The Stream Editor

**Module:** find, sed and awk · **Interview priority:** Core

## What Is It?

`sed` (stream editor) reads text line by line, applies editing commands to each line, and writes the result to standard output. It edits without opening an editor, which makes it ideal for pipelines and scripts.

```text
sed [options] 'script' [file ...]

                    for each line:
input ──► read into pattern space ──► apply commands (s, d, p, …) ──► print (unless -n) ──► output
```

The commands you will use 90 % of the time:

| Command | Does | Example |
|---------|------|---------|
| `s/old/new/` | Substitute (replace) | `sed 's/dev/prod/' app.conf` |
| `d` | Delete the line | `sed '/^#/d' app.conf` |
| `p` | Print the line (with `-n`) | `sed -n '3,5p' app.log` |

## Why It Matters

- Change configuration values in scripts and Dockerfiles (`sed -i 's/^port=.*/port=9090/' app.conf`).
- Clean data in pipelines: strip comments, blank lines, prefixes, Windows line endings.
- Print exact line ranges or the text between two markers in a log.
- Interview staples: replace text in a file, delete lines matching a pattern, print specific lines, in-place editing.

## Core Concept

### Substitution in detail

```text
s/REGEX/REPLACEMENT/FLAGS
```

| Part | Notes |
|------|-------|
| `REGEX` | Basic regular expression by default; `-E` for extended (`+ ? \| () {}` without backslashes) |
| `REPLACEMENT` | `&` = the whole match; `\1`…`\9` = captured groups |
| `g` flag | Replace **every** match on the line (default: only the first) |
| `N` flag | Replace only the Nth match |
| `I` flag | Case-insensitive (GNU) |
| `p` flag | Print the line if a substitution was made (use with `-n`) |
| Delimiter | Any character: `s|/usr/local|/opt|` avoids escaping slashes |

### Addresses: which lines a command applies to

| Address | Selects |
|---------|---------|
| *(none)* | Every line |
| `3` | Line 3 |
| `$` | The last line |
| `3,5` | Lines 3 to 5 |
| `/regex/` | Lines matching the regex |
| `/start/,/end/` | From a line matching `start` to the next line matching `end` |
| `addr!` | Every line **not** matching the address |

```text
sed '/^#/d'          delete lines that start with #
sed '2,10d'          delete lines 2–10
sed -n '/ERROR/p'    print only matching lines (like grep)
sed '5!d'            delete everything except line 5
```

### `-n` and `p`

By default sed prints every line after processing. `-n` turns that off, so only lines you explicitly `p`rint appear. Without `-n`, `sed '/ERROR/p'` prints error lines **twice**.

### Options

| Option | Meaning |
|--------|---------|
| `-n` | Do not print lines automatically |
| `-e 'cmd'` | Add a command (repeatable); or separate commands with `;` |
| `-E` (or `-r`) | Extended regular expressions |
| `-i` | Edit the file **in place** |
| `-i.bak` | In place, keeping a backup with suffix `.bak` |
| `-f script.sed` | Read commands from a file |

> [!CAUTION]
> `sed -i` overwrites the file. Run the same command **without** `-i` first and check the output, or use `-i.bak` to keep a backup. On macOS (BSD sed), `-i` needs an argument: `sed -i '' 's/a/b/' file`; the GNU form `sed -i 's/a/b/' file` fails there.

## Commands

### Replace text

```bash
sed 's/INFO/info/' app.log | head -n 3
```

**Output:**

```text
2026-01-15 09:00:01 info  [main] Application starting
2026-01-15 09:00:02 info  [main] Loading configuration from config/app.conf
2026-01-15 09:00:03 WARN  [db] Connection pool size not set, using default 10
```

The file itself is unchanged — `sed` wrote the result to stdout.

First match, every match, the Nth match:

```bash
echo "one one one" | sed 's/one/two/'
echo "one one one" | sed 's/one/two/g'
echo "one one one" | sed 's/one/two/2'
```

**Output:**

```text
two one one
two two two
one two one
```

Case-insensitive:

```bash
sed 's/linux/Linux/I' notes.txt
```

**Output:**

```text
Linux is a kernel.
GNU tools run on Linux.
The shell reads commands.
Bash is a popular shell.
Linux distributions bundle the kernel with software.
```

A different delimiter for paths:

```bash
sed 's|config/app.conf|/etc/app/app.conf|' app.log | sed -n 2p
```

**Output:**

```text
2026-01-15 09:00:02 INFO  [main] Loading configuration from /etc/app/app.conf
```

### Using the match: `&` and groups

```bash
echo "port=8080" | sed 's/[0-9]\+/[&]/'
echo "2026-01-15" | sed -E 's/([0-9]{4})-([0-9]{2})-([0-9]{2})/\3\/\2\/\1/'
```

**Output:**

```text
port=[8080]
15/01/2026
```

`&` inserted the whole match; `\1`, `\2`, `\3` reordered the captured parts of the date.

### Print specific lines

```bash
sed -n '3,5p' app.log
```

**Output:**

```text
2026-01-15 09:00:03 WARN  [db] Connection pool size not set, using default 10
2026-01-15 09:00:05 INFO  [http] Server listening on port 8080
2026-01-15 09:15:42 ERROR [db] Connection timed out after 30s
```

```bash
sed -n '$p' app.log
sed -n '1p;$p' numbers.txt
```

**Output:**

```text
2026-01-15 12:00:00 INFO  [main] Scheduled cleanup finished
10
25
```

Everything between two markers — here, the database incident:

```bash
sed -n '/timed out/,/established/p' app.log
```

**Output:**

```text
2026-01-15 09:15:42 ERROR [db] Connection timed out after 30s
2026-01-15 09:15:43 INFO  [db] Retrying connection (attempt 2)
2026-01-15 09:15:44 INFO  [db] Connection established
```

### Delete lines

```bash
sed '/^#/d' config/app.conf
```

**Output:**

```text
app.name=inventory
app.port=8080
app.env=dev
db.host=localhost
db.port=5432
log.level=INFO
```

```bash
sed '2,10d' app.log
```

**Output:**

```text
2026-01-15 09:00:01 INFO  [main] Application starting
2026-01-15 11:45:12 INFO  [http] GET /api/health 200
2026-01-15 12:00:00 INFO  [main] Scheduled cleanup finished
```

Common one-liners: `sed '/^$/d'` (blank lines), `sed '/^\s*#/d; /^\s*$/d'` (comments and blank lines), `sed 's/\r$//'` (Windows line endings), `sed 's/[[:space:]]*$//'` (trailing whitespace).

### Insert, append and change lines

```bash
sed '1i # employees export' employees.csv | head -n 2
sed '/app.port/a app.timeout=30' config/app.conf | sed -n '3,5p'
sed '/log.level/c log.level=DEBUG' config/app.conf | tail -n 2
```

**Output:**

```text
# employees export
id,name,dept,salary,city
app.port=8080
app.timeout=30
app.env=dev
db.port=5432
log.level=DEBUG
```

`i` inserts before, `a` appends after, `c` replaces the whole line (GNU one-line syntax).

### Several commands

```bash
sed -e 's/sales/SALES/' -e 's/hr/HR/' employees.csv | head -n 5
```

**Output:**

```text
id,name,dept,salary,city
101,asha,engineering,85000,chennai
102,ravi,SALES,52000,mumbai
103,meena,engineering,92000,bengaluru
104,john,HR,48000,chennai
```

### Quit early

```bash
sed '3q' numbers.txt
```

**Output:**

```text
10
2
33
```

`q` stops reading — on a huge file, `sed 10q` is as fast as `head`.

### Edit a file in place

```bash
cp config/app.conf app.test.conf
sed -i 's/app.env=dev/app.env=prod/' app.test.conf
grep app.env app.test.conf
sed -i.bak 's/^log.level=.*/log.level=WARN/' app.test.conf
grep log.level app.test.conf app.test.conf.bak
```

**Output:**

```text
app.env=prod
app.test.conf:log.level=WARN
app.test.conf.bak:log.level=INFO
```

Anchoring with `^…=.*` replaces the whole value whatever it was — the reliable way to set a config key.

## Examples

### Extract a field with a capture group

```bash
sed -n 's/.*\[\(.*\)\].*/\1/p' app.log | sort -u
```

**Output:**

```text
db
http
main
payment
```

`-n` with the `p` flag prints only lines where the substitution matched, leaving just the captured component name.

### Prefix every line

```bash
sed 's/^/> /' list1.txt
```

**Output:**

```text
> apple
> banana
> cherry
> mango
```

### Replace a value in many files

```bash
# Illustrative
grep -rl 'old-db.internal' config/ | xargs sed -i.bak 's/old-db\.internal/new-db.internal/g'
```

Escape the dots in the pattern — unescaped, `.` matches any character.

## Comparison

### sed vs grep vs awk vs tr

| | `sed` | `grep` | `awk` | `tr` |
|---|---|---|---|---|
| Main job | Edit lines (substitute, delete, insert) | Select matching lines | Process fields, compute, report | Translate/delete characters |
| Works on | Lines + regex | Lines + regex | Records and fields | Characters |
| In-place editing | `-i` | No | GNU `-i inplace` | No |
| Calculations | No | No | Yes | No |
| Typical | `sed 's/a/b/g'` | `grep ERROR` | `awk '{s+=$3} END{print s}'` | `tr -d '\r'` |

### `sed 's/x/y/'` vs `sed 's/x/y/g'`

| | No flag | `g` |
|---|---|---|
| Replaces | First match on each line | All matches on each line |

## Common Mistakes

- Forgetting `g` and replacing only the first occurrence per line.
- Using `sed -n '…'` without `p` (prints nothing) or `p` without `-n` (prints twice).
- Not escaping `.`, `/`, `*`, `[` in patterns; choose another delimiter for paths.
- Running `sed -i` without testing first, or without a backup.
- Using double quotes around a script that contains `$` (the shell expands it) — prefer single quotes; switch to double quotes only when you need a shell variable: `sed "s/PORT/$port/"`.
- Writing `sed 's/a/b/' file > file` — the redirection empties the file first; use `-i`.
- Assuming GNU features (`-i` without suffix, `I` flag, `\+`) on macOS/BSD.

## Key Takeaways

- `sed 's/old/new/g'` substitutes; `&` is the match, `\1` a group; `-E` for extended regex; any delimiter works.
- Addresses select lines: `3`, `$`, `3,5`, `/re/`, `/a/,/b/`, `!`.
- `d` deletes, `p` prints (with `-n`), `i`/`a`/`c` insert/append/change, `q` quits.
- `sed -i` edits in place (`-i.bak` keeps a backup); test without `-i` first.
- Typical uses: change config values, strip comments and blank lines, print ranges, clean line endings.

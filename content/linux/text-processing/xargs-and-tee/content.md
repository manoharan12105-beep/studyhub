# xargs and tee

**Module:** Text Processing · **Interview priority:** Frequently asked

## What Is It?

Two commands that extend what pipelines can do:

- **`xargs`** reads items from standard input and runs a command with those items as **arguments**. It bridges the gap between programs that produce lists (`find`, `grep -l`, `ls`) and programs that only accept arguments (`rm`, `cp`, `wc`, `chmod`).
- **`tee`** copies its standard input to standard output **and** to one or more files — like a T-shaped pipe fitting.

```text
find … | xargs rm             list on stdin → arguments of rm
cmd | tee out.log | next      stream continues, a copy is saved in out.log
```

## Why It Matters

- Many commands ignore stdin. `find . -name '*.tmp' | rm` does nothing; `| xargs rm` works.
- `xargs` batches arguments, so one `rm` handles thousands of files instead of starting one process per file.
- `tee` lets you watch a long command while also saving its output, and is the standard way to write to a root-owned file with `sudo`.

## Commands

### xargs

**Purpose:** build and run command lines from standard input.

**Syntax:**

```text
producer | xargs [options] [command [initial-arguments]]
```

| Option | Meaning |
|--------|---------|
| `-n N` | Use at most N arguments per command run |
| `-I {}` | Run once per input line, replacing `{}` with the line |
| `-0` | Items are separated by NUL characters (pair with `find -print0`) |
| `-r` | Do not run the command at all if the input is empty (GNU) |
| `-t` | Print each command before running it |
| `-p` | Ask for confirmation before each run |
| `-P N` | Run up to N processes in parallel |

By default `xargs` splits the input on whitespace and appends as many items as fit to one command:

```bash
echo "a b c" | xargs echo
echo "a b c" | xargs -n 1 echo
```

**Output:**

```text
a b c
a
b
c
```

See the command it builds with `-t`:

```bash
printf '%s\n' one two three | xargs -t touch
ls one two three
```

**Output:**

```text
touch one two three
one  three  two
```

Count lines in every Java file — `wc` receives the filenames as arguments:

```bash
ls project/src/*.java | xargs wc -l
```

**Output:**

```text
  3 project/src/Main.java
  3 project/src/Order.java
  3 project/src/OrderService.java
  3 project/src/PaymentService.java
 12 total
```

Search inside the files that `find` lists:

```bash
find logs -name '*.log' | xargs grep -l ERROR
```

**Output:**

```text
logs/app-2026-01-08.log
```

#### One run per item with `-I`

`-I {}` reads one line at a time and substitutes it wherever `{}` appears — needed when the item is not the last argument:

```bash
printf '%s\n' list1.txt list2.txt | xargs -I {} cp {} {}.bak
ls *.bak
```

**Output:**

```text
list1.txt.bak  list2.txt.bak
```

#### Filenames with spaces: `-print0` and `-0`

Splitting on whitespace breaks names that contain spaces:

```bash
touch "my file.txt"
ls "my file.txt" | xargs rm
ls my*
```

**Output:**

```text
rm: cannot remove 'my': No such file or directory
rm: cannot remove 'file.txt': No such file or directory
'my file.txt'
```

`xargs` passed `my` and `file.txt` as two names. Use NUL separators, which cannot occur in filenames:

```bash
find . -name 'my file.txt' -print0 | xargs -0 rm -v
```

**Output:**

```text
removed './my file.txt'
```

> [!IMPORTANT]
> Whenever `find` feeds `xargs`, use `find … -print0 | xargs -0 …`. It is the only form that is safe for every possible filename.

#### Empty input

GNU `xargs` runs the command once even when there is no input, which can surprise you (`find … | xargs rm` then complains about a missing operand). `-r` prevents it:

```bash
printf '' | xargs echo "ran anyway"
printf '' | xargs -r echo "not printed"
echo "(done)"
```

**Output:**

```text
ran anyway
(done)
```

#### Grouping and parallelism

```bash
seq 1 6 | xargs -n 2
```

**Output:**

```text
1 2
3 4
5 6
```

With no command, `xargs` runs `echo`. `-P 4` runs four commands at a time — for example compressing many files in parallel: `find logs -name '*.log' -print0 | xargs -0 -n 1 -P 4 gzip`.

> [!CAUTION]
> `… | xargs rm` deletes whatever the producer printed. Run the pipeline with `echo` in front first (`… | xargs echo rm`) or use `-p`, and check the list before deleting.

### tee

**Purpose:** read stdin, write it to stdout and to files.

| Option | Meaning |
|--------|---------|
| `-a` | Append to the files instead of overwriting |

Save a result and still see it:

```bash
grep -c ERROR app.log | tee count.txt
cat count.txt
```

**Output:**

```text
3
3
```

Save an intermediate stage of a pipeline while it continues:

```bash
grep ERROR app.log | tee errors.txt | wc -l
cat errors.txt
```

**Output:**

```text
3
2026-01-15 09:15:42 ERROR [db] Connection timed out after 30s
2026-01-15 10:30:00 ERROR [payment] Payment gateway returned 503
2026-01-15 10:30:01 ERROR [payment] Order 1042 payment failed
```

Append, and write to several files at once:

```bash
echo "second run" | tee -a count.txt
cat count.txt
echo "fan out" | tee f1.txt f2.txt > /dev/null
cat f1.txt f2.txt
```

**Output:**

```text
second run
3
second run
fan out
fan out
```

#### Writing to a root-owned file

```bash
# Illustrative: needs sudo
echo "10.0.0.20 db.internal" | sudo tee -a /etc/hosts
sudo echo "x" >> /etc/hosts          # fails: Permission denied
```

The second form fails because the **redirection is performed by your own shell** (as your user) before `sudo` runs; only `echo` runs as root. With `sudo tee`, the process that opens the file is root.

Keep a log of a long build while watching it:

```bash
# Illustrative
./gradlew build 2>&1 | tee build.log
```

## Examples

### Delete old temporary files safely

```bash
# Illustrative
find /tmp/myapp -name '*.tmp' -mtime +7 -print0 | xargs -0 -r rm -v
```

### Replace a string in every file that contains it

```bash
# Illustrative
grep -rlZ 'old-host.example.com' config/ | xargs -0 sed -i 's/old-host\.example\.com/new-host.example.com/g'
```

`grep -Z` ends each filename with NUL, matching `xargs -0`.

## Comparison

### Pipe alone vs xargs

| | `producer \| cmd` | `producer \| xargs cmd` |
|---|---|---|
| `cmd` receives the data as | Standard input | Command-line arguments |
| Works with | Filters: `grep`, `sort`, `wc`, `sed` | Argument-takers: `rm`, `cp`, `chmod`, `mkdir`, `kill` |
| Example | `ls \| wc -l` counts names | `ls *.log \| xargs wc -l` counts lines inside each file |

### xargs vs find -exec

| | `find … -print0 \| xargs -0 cmd` | `find … -exec cmd {} +` | `find … -exec cmd {} \;` |
|---|---|---|---|
| Processes started | Few (batched) | Few (batched) | One per file |
| Safe with odd filenames | Yes (with `-0`) | Yes | Yes |
| Parallel | `-P N` | No | No |
| Works with any producer | Yes (`grep -l`, `ls`, a file of names) | Only `find` | Only `find` |

## Common Mistakes

- Piping names into `rm`, `cp` or `kill` without `xargs` — they ignore stdin.
- `find | xargs` without `-print0`/`-0` — breaks on spaces, quotes and newlines in names.
- Forgetting `-r`: the command runs once with no arguments when the input is empty.
- `sudo echo text > /root/file` — the redirection is not run as root; use `sudo tee`.
- Forgetting `-a` with `tee` and overwriting a log.

## Key Takeaways

- `xargs` turns stdin into arguments: `-n` per run, `-I {}` placeholder, `-0` with `find -print0`, `-r` skip when empty, `-P` parallel, `-t` show commands.
- Use `xargs` for commands that do not read stdin (`rm`, `cp`, `chmod`).
- `tee` saves a copy of a stream and passes it on; `-a` appends; `sudo tee` writes root-owned files.

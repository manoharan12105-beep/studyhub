# Viewing Files: cat, less, head, tail, file and stat

**Module:** Basic Commands · **Interview priority:** Core

## What Is It?

Linux keeps configuration and logs as plain text, so reading files is a constant task. Each viewing command fits a different situation:

| Command | Use it to |
|---------|-----------|
| `cat` | Print a short file (or join several files) |
| `less` | Page through a long file, search, scroll both ways |
| `more` | Older, simpler pager (forward only on many systems) |
| `head` | See the first lines of a file |
| `tail` | See the last lines — and follow a growing log with `tail -f` |
| `file` | Identify what kind of data a file contains |
| `stat` | Show a file's metadata: size, permissions, owner, inode, timestamps |

## Why It Matters

- Reading logs is the core of troubleshooting: `tail -f` while reproducing a bug, `less` with search for the stack trace, `head` to check a CSV header.
- Opening a 5 GB log with `cat` floods the terminal; `less` opens it instantly. Choosing the right tool saves time on real servers.
- `stat` and `file` answer "why does this file behave oddly?" — wrong type, wrong owner, unexpected timestamp.

## Commands

### cat

**Purpose:** con**cat**enate files and print them to standard output.

**Syntax:**

```text
cat [options] [file ...]
```

| Option | Meaning |
|--------|---------|
| `-n` | Number all lines |
| `-b` | Number non-blank lines only |
| `-A` | Show invisible characters: `$` at line ends, `^I` for tabs, `^M` for Windows carriage returns |
| `-s` | Squeeze repeated blank lines into one |

```bash
cat notes.txt
```

**Output:**

```text
Linux is a kernel.
GNU tools run on linux.
The shell reads commands.
Bash is a popular shell.
linux distributions bundle the kernel with software.
```

Several files are printed one after the other — that is the "concatenate" in the name. `-n` numbers the combined output:

```bash
cat -n list1.txt list2.txt
```

**Output:**

```text
     1  apple
     2  banana
     3  cherry
     4  mango
     5  banana
     6  grape
     7  mango
     8  orange
```

Show hidden characters — the tool for "my config looks right but does not work":

```bash
printf 'key=value \r\n' > crlf.txt
cat -A crlf.txt
rm crlf.txt
```

**Output:**

```text
key=value ^M$
```

The trailing space and the `^M` (a Windows carriage return) are now visible. Both break scripts and config parsers.

**Common mistake:** `cat` on a huge or binary file. It floods the terminal and can leave it garbled (`reset` fixes the terminal). Use `less`, `head` or `file` first.

### less

**Purpose:** view a file one screen at a time, scrolling forward and backward, with search. It does not load the whole file first, so it opens large logs immediately.

```bash
# Illustrative: interactive
less app.log
less -N app.log        # with line numbers
less +F app.log        # follow mode, like tail -f; Ctrl+C stops following, F resumes
```

| Key | Action |
|-----|--------|
| `Space` / `b` | Next / previous page |
| `↓` `↑` or `j` `k` | One line down / up |
| `g` / `G` | Start / end of file |
| `/text` | Search forward; `n` next match, `N` previous |
| `?text` | Search backward |
| `&pattern` | Show only lines matching pattern |
| `q` | Quit |

`man` pages are displayed with `less`, so the same keys work there.

### more

**Purpose:** the original Unix pager. `Space` for the next page, `q` to quit. It cannot always scroll backward and has fewer features; prefer `less` ("less is more").

### head

**Purpose:** print the first lines (default 10).

| Option | Meaning |
|--------|---------|
| `-n 5` (or `-5`) | First 5 lines |
| `-n -10` | Everything **except** the last 10 lines |
| `-c 20` | First 20 bytes |

```bash
head -n 3 app.log
```

**Output:**

```text
2026-01-15 09:00:01 INFO  [main] Application starting
2026-01-15 09:00:02 INFO  [main] Loading configuration from config/app.conf
2026-01-15 09:00:03 WARN  [db] Connection pool size not set, using default 10
```

Check a CSV's header before processing it:

```bash
head -n 1 employees.csv
```

**Output:**

```text
id,name,dept,salary,city
```

### tail

**Purpose:** print the last lines (default 10), or follow a file as it grows.

| Option | Meaning |
|--------|---------|
| `-n 5` | Last 5 lines |
| `-n +11` | Everything **from** line 11 to the end |
| `-f` | Follow: keep printing new lines as they are appended |
| `-F` | Follow by name and retry — survives log rotation |
| `-c 100` | Last 100 bytes |

```bash
tail -n 2 app.log
```

**Output:**

```text
2026-01-15 11:45:12 INFO  [http] GET /api/health 200
2026-01-15 12:00:00 INFO  [main] Scheduled cleanup finished
```

`+N` counts from the start — the standard way to skip a header line:

```bash
tail -n +2 employees.csv | head -n 3
```

**Output:**

```text
101,asha,engineering,85000,chennai
102,ravi,sales,52000,mumbai
103,meena,engineering,92000,bengaluru
```

Lines 5 to 6 of a file, combining `head` and `tail`:

```bash
head -n 6 app.log | tail -n 2
```

**Output:**

```text
2026-01-15 09:15:42 ERROR [db] Connection timed out after 30s
2026-01-15 09:15:43 INFO  [db] Retrying connection (attempt 2)
```

Watching a live log:

```bash
# Illustrative: runs until Ctrl+C
tail -f /var/log/syslog
tail -F /opt/app/logs/app.log        # keeps working after the log is rotated
tail -f app.log | grep ERROR         # follow only the errors
```

**Common mistake:** `tail -f` on a log that gets rotated (renamed and recreated) keeps watching the old, renamed file and shows nothing new. Use `tail -F`.

### file

**Purpose:** identify the type of data in a file by inspecting its content, not its name.

```bash
file notes.txt project/build.sh config
```

**Output:**

```text
notes.txt:        ASCII text
project/build.sh: Bourne-Again shell script, ASCII text executable
config:           directory
```

`build.sh` was identified from its `#!/bin/bash` first line. Linux does not rely on file extensions; `file` tells you what something really is before you `cat` it:

```bash
file /usr/bin/bash
```

**Output (varies):**

```text
/usr/bin/bash: ELF 64-bit LSB pie executable, x86-64, version 1 (SYSV), dynamically linked, interpreter /lib64/ld-linux-x86-64.so.2, BuildID[sha1]=a292b52b679fb438b940f1c17e2e4951ac52ac89, for GNU/Linux 3.2.0, stripped
```

**ELF** is the Linux executable format.

### stat

**Purpose:** show all metadata stored in a file's inode.

```bash
stat notes.txt
```

**Output (varies):**

```text
  File: notes.txt
  Size: 147             Blocks: 8          IO Block: 4096   regular file
Device: 8,48    Inode: 16052       Links: 1
Access: (0644/-rw-r--r--)  Uid: ( 1000/ student)   Gid: ( 1000/ student)
Access: 2026-01-15 09:30:07.748729630 +0000
Modify: 2026-01-15 09:30:07.722717534 +0000
Change: 2026-01-15 09:30:07.744729630 +0000
 Birth: 2026-01-15 09:30:07.720958583 +0000
```

| Field | Meaning |
|-------|---------|
| Size / Blocks | Bytes of content / 512-byte blocks allocated on disk |
| Inode | The file's inode number (see [Inodes and Links](../../storage/inodes-and-links/content.md)) |
| Links | Number of hard links (names) |
| Access (mode) | Permissions in octal and symbolic form |
| Uid / Gid | Owner and group |
| Access time (atime) | Last read |
| Modify time (mtime) | Last change of **content** |
| Change time (ctime) | Last change of **metadata** (permissions, owner, links) or content |
| Birth | Creation time, where the filesystem records it |

A custom format is handy in scripts:

```bash
stat -c '%n %s bytes, mode %a, owner %U' notes.txt config/db.conf
```

**Output:**

```text
notes.txt 147 bytes, mode 644, owner student
config/db.conf 40 bytes, mode 600, owner student
```

**Common mistake:** believing ctime is "creation time". It is the **change** time of the inode; Linux records creation as "Birth" only on filesystems that support it.

## Examples

### Errors you will see

```bash
cat nofile.txt
cat config
```

**Output:**

```text
cat: nofile.txt: No such file or directory
cat: config: Is a directory
```

### Middle of a file

Print lines 3 to 5 of `numbers.txt`:

```bash
head -n 5 numbers.txt | tail -n 3
```

**Output:**

```text
33
4
100
```

## Comparison

### cat vs less vs more

| | `cat` | `less` | `more` |
|---|---|---|---|
| Output | Whole file at once | One screen, interactive | One screen, interactive |
| Scroll back | No (terminal scrollback only) | Yes | Limited |
| Search | No (pipe to `grep`) | `/`, `?`, `n`, `N` | `/` forward only |
| Large files | Floods terminal | Opens instantly | Fine |
| In pipelines | Yes — writes to stdout | As the last command only | As the last command only |
| Best for | Short files, joining files, scripts | Logs and long files | Minimal systems without `less` |

### head vs tail

| | `head` | `tail` |
|---|---|---|
| Default | First 10 lines | Last 10 lines |
| `-n N` | First N | Last N |
| Signed form | `-n -N`: all but the last N | `-n +N`: from line N onward |
| Live updates | — | `-f` / `-F` |

## Common Mistakes

- Using `cat file | less` or `cat file | grep x` — `less file` and `grep x file` do the same with one process less.
- `tail -f` on rotated logs instead of `tail -F`.
- Assuming a `.txt` extension means text. Check with `file`.
- Reading mtime and ctime as "modified" and "created".
- Running `cat` on a binary and leaving the terminal unreadable — type `reset` and press Enter.

## Key Takeaways

- `cat` prints and joins short files; `cat -A` reveals tabs, trailing spaces and `^M`.
- `less` is the pager for long files: `/` search, `G` end, `q` quit; `less +F` follows.
- `head -n N` and `tail -n N`; `tail -n +2` skips a header; `head | tail` extracts a range.
- `tail -f` follows a growing log; `tail -F` survives rotation.
- `file` identifies content; `stat` shows size, mode, owner, inode, links and atime/mtime/ctime.

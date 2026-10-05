# Paths and Navigation

**Module:** Filesystem and Navigation · **Interview priority:** Core

## What Is It?

A **path** names a location in the directory tree. Every shell has a **current working directory**; commands that receive a relative name look for it there. Three commands do almost all navigation:

- `pwd` — print where you are,
- `cd` — change where you are,
- `ls` — list what is here (or somewhere else).

## Why It Matters

- Every other command takes paths as arguments. Getting a path wrong means acting on the wrong file — dangerous with `rm` and `chmod`.
- Scripts that use relative paths break when run from a different directory; knowing the difference is essential when writing cron jobs and services.
- `ls -l` is how you read permissions, owners, sizes and timestamps — needed in nearly every later topic.

## Core Concept

### Absolute vs relative paths

| | Absolute path | Relative path |
|---|---|---|
| Starts with | `/` | Anything else |
| Resolved from | The root directory | The current working directory |
| Example | `/home/student/linux-lab/app.log` | `app.log`, `project/src`, `../notes.txt` |
| Same result from any directory? | Yes | No |
| Use in | Scripts, cron jobs, configuration | Interactive work, short commands |

### Special names

| Name | Means | Example |
|------|-------|---------|
| `.` | The current directory | `./build.sh` runs a script here |
| `..` | The parent directory | `cd ..` goes up one level |
| `~` | Your home directory (expanded by the shell) | `cd ~/linux-lab` |
| `~alice` | Alice's home directory | `ls ~alice` |
| `-` | (with `cd`) the previous directory | `cd -` toggles back |

`.` and `..` exist in every directory (`ls -a` shows them). `/..` is `/` itself — you cannot go above the root.

### How a path is resolved

```text
current directory: /home/student/linux-lab

project/src          → /home/student/linux-lab/project/src
../linux-lab/app.log → /home/student/linux-lab/app.log
./config/app.conf    → /home/student/linux-lab/config/app.conf
/etc/hosts           → /etc/hosts               (absolute: current directory ignored)
config/../project    → /home/student/linux-lab/project
```

### Reading `ls -l`

```text
-rw-r--r-- 1 student student   63 Jan 15 09:30 build.sh
│└───┬───┘ │ └──┬──┘ └──┬──┘ └┬┘ └─────┬────┘ └──┬───┘
│ permissions │ owner   group  size  modified    name
type     link count
```

- **type**: `-` file, `d` directory, `l` link (see [The Linux Filesystem Hierarchy](../filesystem-hierarchy/content.md)).
- **permissions**: read/write/execute for owner, group, others (see [File Permissions](../../permissions/file-permissions/content.md)).
- **link count**: number of hard links (for a directory: 2 + number of subdirectories).
- **size** in bytes (`-h` for K/M/G); for a directory, the size of its listing, not of its contents.
- **modified**: last modification time; files older than six months show the year instead of the time.

## Commands

### pwd

**Purpose:** print the absolute path of the current working directory.

```bash
pwd
```

**Output:**

```text
/home/student/linux-lab
```

**Common mistake:** confusing `pwd` (where the *shell* is) with where a script file lives. A script run as `bash project/build.sh` still has the caller's working directory.

### cd

**Purpose:** change the current working directory.

**Syntax:**

```text
cd [directory]
```

| Form | Goes to |
|------|---------|
| `cd dir` | `dir` relative to here |
| `cd /abs/path` | That absolute path |
| `cd ..` | Parent directory |
| `cd` or `cd ~` | Home directory |
| `cd -` | Previous directory (and prints it) |

```bash
cd project/src
pwd
cd ..
pwd
cd -
cd
pwd
cd ~/linux-lab
```

**Output:**

```text
/home/student/linux-lab/project/src
/home/student/linux-lab/project
/home/student/linux-lab/project/src
/home/student
```

`cd -` printed the directory it switched back to. Plain `cd` took us home.

`cd` reports why it fails:

```bash
cd notes.txt
cd nosuchdir
```

**Output:**

```text
bash: cd: notes.txt: Not a directory
bash: cd: nosuchdir: No such file or directory
```

**Why `cd` is a builtin:** a child process cannot change its parent's working directory. If `cd` were a separate program, it would change its own directory and exit, leaving the shell where it was.

### ls

**Purpose:** list directory contents, or details about files.

**Syntax:**

```text
ls [options] [file-or-directory ...]
```

| Option | Meaning |
|--------|---------|
| `-l` | Long format: type, permissions, links, owner, group, size, time, name |
| `-a` | All, including hidden names that start with `.` |
| `-A` | Like `-a` but without `.` and `..` |
| `-h` | Human-readable sizes (with `-l`): `4.0K`, `3.0M` |
| `-t` | Sort by modification time, newest first |
| `-S` | Sort by size, largest first |
| `-r` | Reverse the sort order |
| `-R` | Recursive: list subdirectories too |
| `-d` | List the directory itself, not its contents |
| `-1` | One entry per line |
| `-i` | Show inode numbers |

Long listing:

```bash
ls -l project
```

**Output:**

```text
total 20
-rw-r--r-- 1 student student   63 Jan 15 09:30 build.sh
drwxr-xr-x 2 student student 4096 Jan 15 09:30 docs
-rw-r--r-- 1 student student   64 Jan 15 09:30 readme.md
drwxr-xr-x 2 student student 4096 Jan 15 09:30 src
drwxr-xr-x 2 student student 4096 Jan 15 09:30 test
```

`total 20` is the disk space used by the listed entries, in 1 KiB blocks.

Hidden files and human-readable sizes:

```bash
ls -lah project
```

**Output:**

```text
total 32K
drwxr-xr-x 5 student student 4.0K Jan 15 09:30 .
drwxr-xr-x 5 student student 4.0K Jan 15 09:30 ..
-rw-r--r-- 1 student student   16 Jan 15 09:30 .gitignore
-rw-r--r-- 1 student student   63 Jan 15 09:30 build.sh
drwxr-xr-x 2 student student 4.0K Jan 15 09:30 docs
-rw-r--r-- 1 student student   64 Jan 15 09:30 readme.md
drwxr-xr-x 2 student student 4.0K Jan 15 09:30 src
drwxr-xr-x 2 student student 4.0K Jan 15 09:30 test
```

Largest first — the quickest way to spot a big file in one directory:

```bash
ls -lS logs
```

**Output:**

```text
total 3088
-rw-r--r-- 1 student student 3145728 Jan 15 09:30 debug.log
drwxr-xr-x 2 student student    4096 Jan 15 09:30 archive
-rw-r--r-- 1 student student      68 Jan  5 09:30 app-2026-01-08.log
-rw-r--r-- 1 student student      32 Dec 26 09:30 app-2026-01-01.log
-rw-r--r-- 1 student student      32 Jan 13 09:30 app-2026-01-14.log
```

Newest first, and oldest first with `-r`:

```bash
ls -t logs
ls -tr logs
```

**Output:**

```text
archive  debug.log  app-2026-01-14.log  app-2026-01-08.log  app-2026-01-01.log
app-2026-01-01.log  app-2026-01-08.log  app-2026-01-14.log  debug.log  archive
```

The directory itself instead of its contents:

```bash
ls -ld project
```

**Output:**

```text
drwxr-xr-x 5 student student 4096 Jan 15 09:30 project
```

The whole tree:

```bash
ls -R project
```

**Output:**

```text
project:
build.sh  docs  readme.md  src  test

project/docs:
design.md

project/src:
Main.java  Order.java  OrderService.java  PaymentService.java

project/test:
OrderServiceTest.java
```

The `tree` command draws the same thing as a diagram, but it is not installed by default (`sudo apt install tree`).

**Common mistake:** parsing `ls` output in scripts (`for f in $(ls)`). Filenames with spaces break it; use a glob (`for f in *`) or `find`.

## Examples

### Moving around with relative and absolute paths

```bash
cd /usr/share
pwd
cd ../..
pwd
cd ~/linux-lab
```

**Output:**

```text
/usr/share
/
```

`../..` went up two levels from `/usr/share` to `/`.

### A path can pass through `..`

```bash
ls -l config/../project/readme.md
```

**Output:**

```text
-rw-r--r-- 1 student student 64 Jan 15 09:30 config/../project/readme.md
```

The shell does not simplify the path; the kernel resolves each component in turn: `config` → back up → `project` → `readme.md`.

## Comparison

### `ls -a` vs `ls -A` vs `ls -d`

| Command | Shows |
|---------|-------|
| `ls dir` | Visible entries inside `dir` |
| `ls -a dir` | Also hidden entries, plus `.` and `..` |
| `ls -A dir` | Hidden entries without `.` and `..` |
| `ls -d dir` | `dir` itself (useful with `-l` to see its own permissions) |

## Common Mistakes

- Writing relative paths in cron jobs or systemd units. They run with a different working directory (often `/` or the home directory); use absolute paths.
- Typing `cd/etc` without a space, or `cd ..` as `cd..` (works only in Windows `cmd`).
- Expecting `~` to expand inside quotes: `cd "~/linux-lab"` fails — the shell expands `~` only when it is unquoted at the start of a word.
- Reading the directory size in `ls -l` (4096) as the size of everything inside it. Use `du -sh dir` for that.
- Forgetting that names are case-sensitive: `cd Project` is not `cd project`.

## Key Takeaways

- Absolute paths start with `/`; relative paths start from the current directory.
- `.` here · `..` parent · `~` home · `cd -` previous directory.
- `pwd` shows where you are; `cd` with no argument goes home; `cd` must be a shell builtin.
- `ls -l` columns: type+permissions, links, owner, group, size, modified time, name.
- Useful `ls` options: `-a` hidden, `-h` human sizes, `-t` by time, `-S` by size, `-r` reverse, `-R` recursive, `-d` the directory itself.

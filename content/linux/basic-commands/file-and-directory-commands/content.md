# Creating, Copying, Moving and Deleting Files

**Module:** Basic Commands · **Interview priority:** Core

## What Is It?

Six commands manage files and directories:

| Command | Does |
|---------|------|
| `mkdir` | Make directories |
| `touch` | Create an empty file, or update a file's timestamps |
| `cp` | Copy files and directories |
| `mv` | Move or rename files and directories |
| `rm` | Remove files (and directories with `-r`) |
| `rmdir` | Remove **empty** directories |

## Why It Matters

- They are the most frequently typed commands after `cd` and `ls`.
- `rm` and `mv` have **no undo and no recycle bin**. Knowing exactly what an option does is what keeps you from deleting the wrong thing.
- Interview favourites: `cp` vs `mv`, `rm -r` vs `rmdir`, "how do you copy a directory?", "what does `rm -rf` do and why is it dangerous?".

## Core Concept

### Source and destination

`cp` and `mv` take one or more **sources** and one **destination**:

- `cp a.txt b.txt` — if `b.txt` is not a directory, the copy is named `b.txt` (an existing `b.txt` is **overwritten silently**).
- `cp a.txt b.txt reports/` — with several sources, the destination must be a directory; the files keep their names inside it.
- A trailing `/` on the destination (`reports/`) documents your intent and makes the command fail if `reports` is not a directory, instead of creating a file named `reports`.

### Renaming is moving

There is no separate rename command for single files: `mv old.txt new.txt` renames. Within one filesystem, `mv` only changes directory entries — it is instant even for huge files. Across filesystems (to another disk), `mv` copies the data and then deletes the original.

### Deleting is permanent

`rm` removes a directory entry. When no names and no running processes refer to the file any more, its space is freed. There is no trash folder on the command line; recovery requires backups.

> [!CAUTION]
> `rm -rf` removes recursively **and** suppresses every prompt and error. A typo or an empty variable can wipe a project or a system: `rm -rf "$DIR/"` with `DIR` unset becomes `rm -rf /`. Check the path with `ls` first, quote variables, prefer `rm -ri` or `rm -I` for large deletions, and never run it as root unless you are certain.

## Commands

Work in a scratch folder inside the lab:

```bash
mkdir practice
cd practice
```

### mkdir

**Purpose:** create directories.

**Syntax:**

```text
mkdir [-p] [-v] [-m mode] directory ...
```

| Option | Meaning |
|--------|---------|
| `-p` | Create missing parent directories; no error if the directory already exists |
| `-v` | Print each directory created |
| `-m 700` | Set permissions at creation time |

```bash
mkdir reports
mkdir a/b/c
```

**Output:**

```text
mkdir: cannot create directory ‘a/b/c’: No such file or directory
```

Without `-p`, the parents `a` and `a/b` must already exist.

```bash
mkdir -p a/b/c
mkdir -pv backup/2026/jan
```

**Output:**

```text
mkdir: created directory 'backup'
mkdir: created directory 'backup/2026'
mkdir: created directory 'backup/2026/jan'
```

**Common mistake:** scripts that use `mkdir dir` fail on the second run because the directory exists. `mkdir -p` is idempotent.

### touch

**Purpose:** create empty files, or set an existing file's modification and access times to now.

```bash
touch todo.txt
ls -l todo.txt
touch a.txt b.txt c.txt
ls
```

**Output:**

```text
-rw-r--r-- 1 student student 0 Jan 15 09:30 todo.txt
a  a.txt  b.txt  backup  c.txt  reports  todo.txt
```

Size 0: `touch` never writes content. On an existing file it only updates the timestamp — build tools and `find -newer` rely on this. `touch -d '2 days ago' file` sets a specific time.

### cp

**Purpose:** copy files and directories.

**Syntax:**

```text
cp [options] source destination
cp [options] source ... directory
```

| Option | Meaning |
|--------|---------|
| `-r` / `-R` | Recursive: required to copy a directory |
| `-i` | Ask before overwriting |
| `-n` | Never overwrite an existing file |
| `-v` | Verbose: show each copy |
| `-p` | Preserve mode, ownership and timestamps |
| `-a` | Archive: `-r` + preserve everything + keep symlinks as links (best for backups) |
| `-u` | Copy only when the source is newer than the destination |

```bash
cp todo.txt todo.bak
cp ../notes.txt reports/
ls reports
```

**Output:**

```text
notes.txt
```

Copying a directory needs `-r`:

```bash
cp reports backup
cp -r reports backup/
ls backup
```

**Output:**

```text
cp: -r not specified; omitting directory 'reports'
2026  reports
```

Several sources into one directory, verbosely:

```bash
cp -v ../fruits.txt ../numbers.txt reports/
```

**Output:**

```text
'../fruits.txt' -> 'reports/fruits.txt'
'../numbers.txt' -> 'reports/numbers.txt'
```

```bash
# Illustrative: interactive overwrite prompt
cp -i ../notes.txt reports/
# cp: overwrite 'reports/notes.txt'?   ← answer y or n
```

**Common mistake:** `cp` overwrites an existing destination without asking. Use `-i` or `-n` when that matters (some distributions alias `cp` to `cp -i` for root).

### mv

**Purpose:** move files and directories, or rename them.

**Syntax:**

```text
mv [options] source destination
mv [options] source ... directory
```

| Option | Meaning |
|--------|---------|
| `-i` | Ask before overwriting |
| `-n` | Never overwrite |
| `-v` | Verbose |

No `-r` is needed: moving a directory moves everything in it.

```bash
mv todo.bak todo-old.txt
mv a.txt b.txt reports/
ls
ls reports
```

**Output:**

```text
a  backup  c.txt  reports  todo-old.txt  todo.txt
a.txt  b.txt  fruits.txt  notes.txt  numbers.txt
```

Move and rename in one step:

```bash
mv -v c.txt reports/c-renamed.txt
```

**Output:**

```text
renamed 'c.txt' -> 'reports/c-renamed.txt'
```

**Common mistake:** `mv draft.txt report.txt` silently replaces an existing `report.txt`. Use `mv -i` when unsure.

### rmdir

**Purpose:** remove directories **only if they are empty** — a safe alternative to `rm -r`.

```bash
rmdir reports
rmdir a/b/c
rmdir -p a/b
ls
```

**Output:**

```text
rmdir: failed to remove 'reports': Directory not empty
backup  reports  todo-old.txt  todo.txt
```

`rmdir -p a/b` removed `a/b` and then its now-empty parent `a`. `reports` still has files, so it stays.

### rm

**Purpose:** remove files; with `-r`, directories and everything inside them.

**Syntax:**

```text
rm [options] file ...
```

| Option | Meaning |
|--------|---------|
| `-r` / `-R` | Recursive: remove directories and their contents |
| `-i` | Ask before every removal |
| `-I` | Ask once before removing more than three files or recursing |
| `-f` | Force: ignore missing files, never prompt |
| `-v` | Verbose |

```bash
rm todo-old.txt
rm reports
```

**Output:**

```text
rm: cannot remove 'reports': Is a directory
```

`rm` without `-r` refuses directories. Recursively, verbosely:

```bash
rm -rv backup
```

**Output:**

```text
removed 'backup/reports/notes.txt'
removed directory 'backup/reports'
removed directory 'backup/2026/jan'
removed directory 'backup/2026'
removed directory 'backup'
```

`-f` hides the error for a missing file, and the command still succeeds (exit status 0):

```bash
rm missing.txt
rm -f missing.txt
echo "exit status: $?"
```

**Output:**

```text
rm: cannot remove 'missing.txt': No such file or directory
exit status: 0
```

**Common mistake:** using `rm -rf` out of habit. `-f` hides typos and permission problems; use `rm -r` and read the errors.

## Examples

### Copy a project safely before editing

```bash
cd ~/linux-lab
cp -a project project.bak
ls -d project*
```

**Output:**

```text
project  project.bak
```

`-a` keeps permissions, timestamps and hidden files such as `.gitignore`.

### Clean up only what you created

```bash
rm -r practice project.bak
ls
```

**Output:**

```text
access.log  config         fruits.txt  list2.txt  notes.txt    project  v2.txt
app.log     employees.csv  list1.txt   logs       numbers.txt  v1.txt
```

## Comparison

### cp vs mv

| | `cp` | `mv` |
|---|---|---|
| Original afterwards | Kept | Gone (moved) |
| Directories | Needs `-r` | Moves the whole tree, no option needed |
| Same filesystem | Copies all data (slow for big files) | Renames entries (instant) |
| Extra disk space | Yes, a full copy | None (same filesystem) |
| Timestamps/permissions | New file gets current time unless `-p`/`-a` | Unchanged |

### rm -r vs rmdir

| | `rm -r dir` | `rmdir dir` |
|---|---|---|
| Non-empty directory | Deletes everything inside | Refuses |
| Risk | High | None — cannot lose files |
| Use when | You have checked the contents | Removing empty folders, cleanup scripts |

## Common Mistakes

- `rm -rf $DIR/*` with an unset `DIR` runs `rm -rf /*`. Quote and guard variables: `rm -rf -- "${DIR:?}"/*` stops if `DIR` is empty.
- Forgetting `-r` when copying a directory (cp omits it with a message) or adding `-r` to `mv` (unneeded).
- Overwriting a file with `cp`/`mv` because the destination name already existed.
- `mv file dir` when `dir` does not exist — the file is renamed to `dir` instead of moved into it. Write `dir/` to make that an error.
- Running `rm *` in the wrong directory. Run `pwd` and `ls` first, or use `rm -i`.
- Expecting `touch` to clear a file. It only updates timestamps; use `: > file` or `truncate -s 0 file` to empty it.

## Key Takeaways

- `mkdir -p` creates parents and tolerates existing directories.
- `touch` creates empty files or refreshes timestamps.
- `cp -r` copies directories; `cp -a` copies with everything preserved; `cp` overwrites silently unless `-i`/`-n`.
- `mv` both moves and renames; instant on the same filesystem.
- `rm` is permanent; `-r` for directories, `-i`/`-I` for confirmation, `-f` hides errors.
- `rmdir` removes only empty directories — the safe choice.

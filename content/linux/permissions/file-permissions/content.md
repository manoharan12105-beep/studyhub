# File Permissions and chmod

**Module:** File Permissions · **Interview priority:** Core

## What Is It?

Every file and directory has an **owner** (a user), a **group**, and nine **permission bits**: read, write and execute, for each of three classes of users:

```text
-rwxr-x---  1 student developers  63 Jan 15 09:30 build.sh
 └┬┘└┬┘└┬┘     └──┬──┘ └───┬────┘
  │  │  │      owner     group
  │  │  └─ others: ---  (no access)
  │  └──── group:  r-x  (read, execute)
  └─────── owner:  rwx  (read, write, execute)
```

`chmod` (change mode) changes these bits, either with **symbolic** notation (`u+x`, `g-w`, `o=r`) or **numeric** (octal) notation (`755`, `644`).

## Why It Matters

- "Permission denied" is one of the most common errors on Linux — scripts that are not executable, config files a service cannot read, directories a user cannot enter.
- Secrets (private SSH keys, database passwords) must be readable only by their owner; SSH refuses to use a key that others can read.
- Interviews always include: "what does 755 mean?", "how do you make a script executable?", "what does execute mean on a directory?", "why can I read a file but not execute it?".

## Core Concept

### Three classes

| Class | Letter | Who |
|-------|--------|-----|
| User (owner) | `u` | The file's owner |
| Group | `g` | Members of the file's group |
| Others | `o` | Everyone else |
| All | `a` | `u` + `g` + `o` (used with `chmod`) |

### The kernel checks **one** class only

When a process accesses a file, the kernel picks exactly one class and uses only its bits:

1. If the process runs as **root** → permission checks are bypassed (execute still needs at least one `x` bit set somewhere).
2. Else if the process's user **is the owner** → the **owner** bits decide.
3. Else if the user is **in the file's group** → the **group** bits decide.
4. Otherwise → the **others** bits decide.

There is no fallback. If the owner bits deny access, the owner is denied even when "others" would be allowed:

```bash
echo data > mine.txt
chmod 007 mine.txt
ls -l mine.txt
cat mine.txt
```

**Output:**

```text
-------rwx 1 student student 5 Jan 15 09:30 mine.txt
cat: mine.txt: Permission denied
```

### r, w, x mean different things for files and directories

| Bit | On a file | On a directory |
|-----|-----------|----------------|
| `r` read | Read the contents (`cat`, `less`, `cp` from it) | List the names inside (`ls`) |
| `w` write | Change the contents (edit, append, truncate) | Create, delete and rename entries inside (needs `x` too) |
| `x` execute | Run it as a program or script | **Enter** it and access anything inside by name (`cd`, open `dir/file`) |

Two consequences that surprise people:

- **Deleting a file needs write permission on the directory, not on the file.** A read-only file in a directory you own can be deleted.
- **To open `dir/file` you need `x` on `dir`** (and on every directory above it), plus the right bit on the file itself.

### Numeric (octal) notation

Each permission has a value; add them per class:

| Permission | Value |
|------------|-------|
| `r` | 4 |
| `w` | 2 |
| `x` | 1 |
| none | 0 |

```text
 rwx   r-x   r--
4+2+1 4+0+1 4+0+0
  7     5     4      → 754
```

| Digit | Bits | Meaning |
|-------|------|---------|
| 7 | `rwx` | Everything |
| 6 | `rw-` | Read and write |
| 5 | `r-x` | Read and execute |
| 4 | `r--` | Read only |
| 3 | `-wx` | Write and execute (rare) |
| 2 | `-w-` | Write only (rare) |
| 1 | `--x` | Execute only (directories: pass through without listing) |
| 0 | `---` | Nothing |

### Common modes to know by heart

| Mode | Symbolic | Typical use |
|------|----------|-------------|
| `755` | `rwxr-xr-x` | Scripts, programs, public directories |
| `644` | `rw-r--r--` | Normal files: owner edits, everyone reads |
| `700` | `rwx------` | Private directory (`~/.ssh`) |
| `600` | `rw-------` | Private file (`~/.ssh/id_ed25519`, credentials) |
| `750` | `rwxr-x---` | Directory for owner and team only |
| `640` | `rw-r-----` | Config file readable by a service's group |
| `777` | `rwxrwxrwx` | Everyone can do everything — almost always a mistake |

### Symbolic notation

```text
chmod [ugoa][+-=][rwxX] file

  who:  u owner · g group · o others · a all (default: a, filtered by umask)
  op:   + add · - remove · = set exactly (others cleared)
  perm: r · w · x · X (execute only for directories, or files already executable by someone)
```

| Command | Effect |
|---------|--------|
| `chmod u+x f` | Add execute for the owner |
| `chmod g-w f` | Remove write from the group |
| `chmod o+r f` | Add read for others |
| `chmod a+r f` | Add read for everyone |
| `chmod u=rw,g=r,o= f` | Set exactly `rw-r-----` |
| `chmod go-rwx f` | Remove everything from group and others |

Symbolic changes are **relative** (they keep other bits); numeric modes set **all** bits at once.

## Commands

### Reading permissions

```bash
ls -l project/build.sh config/db.conf
ls -ld project
stat -c '%a %A %n' config/db.conf
```

**Output:**

```text
-rw------- 1 student student 40 Jan 15 09:30 config/db.conf
-rw-r--r-- 1 student student 63 Jan 15 09:30 project/build.sh
drwxr-xr-x 5 student student 4096 Jan 15 09:30 project
600 -rw------- config/db.conf
```

### chmod

**Purpose:** change permission bits. Only the owner (or root) can change a file's mode.

**Syntax:**

```text
chmod [options] MODE file ...
```

| Option | Meaning |
|--------|---------|
| `-R` | Recursive |
| `-v` | Report every change |
| `-c` | Report only actual changes |
| `--reference=ref` | Copy the mode of another file |

#### Making a script executable

```bash
./project/build.sh
```

**Output:**

```text
bash: ./project/build.sh: Permission denied
```

```bash
chmod u+x project/build.sh
ls -l project/build.sh
./project/build.sh
```

**Output:**

```text
-rwxr--r-- 1 student student 63 Jan 15 09:30 project/build.sh
Building inventory...
Build finished
```

#### Numeric modes

```bash
chmod 755 project/build.sh
ls -l project/build.sh
chmod 644 project/build.sh
ls -l project/build.sh
```

**Output:**

```text
-rwxr-xr-x 1 student student 63 Jan 15 09:30 project/build.sh
-rw-r--r-- 1 student student 63 Jan 15 09:30 project/build.sh
```

#### Symbolic changes

```bash
chmod u=rw,g=r,o= notes.txt
ls -l notes.txt
chmod a+x notes.txt
ls -l notes.txt
chmod -v 640 notes.txt
```

**Output:**

```text
-rw-r----- 1 student student 147 Jan 15 09:30 notes.txt
-rwxr-x--x 1 student student 147 Jan 15 09:30 notes.txt
mode of 'notes.txt' changed from 0751 (rwxr-x--x) to 0640 (rw-r-----)
```

#### Invalid modes

```bash
chmod 9 notes.txt
```

**Output:**

```text
chmod: invalid mode: ‘9’
Try 'chmod --help' for more information.
```

Octal digits only go up to 7.

## Examples

### What each directory bit allows

Create a directory with a file and remove one permission at a time:

```bash
mkdir secret
echo hi > secret/file.txt
chmod u-x secret
ls secret
cd secret
cat secret/file.txt
chmod u+x secret
```

**Output:**

```text
file.txt
bash: cd: secret: Permission denied
cat: secret/file.txt: Permission denied
```

Without `x`, the names can still be listed (that needs `r`), but you cannot enter the directory or reach any file inside it.

```bash
chmod u-r secret
ls secret
cat secret/file.txt
chmod u+r secret
```

**Output:**

```text
ls: cannot open directory 'secret': Permission denied
hi
```

Without `r`, listing fails — but a file whose name you know is still reachable through `x`.

```bash
chmod u-w secret
touch secret/new.txt
rm secret/file.txt
echo "edit ok" >> secret/file.txt
cat secret/file.txt
chmod u+w secret
```

**Output:**

```text
touch: cannot touch 'secret/new.txt': Permission denied
rm: cannot remove 'secret/file.txt': Permission denied
hi
edit ok
```

Without `w` on the directory you cannot create or delete entries — but you **can** still modify an existing file, because that depends on the file's own `w` bit.

### A read-only file can still be deleted

```bash
chmod 444 v1.txt
echo more >> v1.txt
rm -f v1.txt
ls v1.txt
```

**Output:**

```text
bash: v1.txt: Permission denied
ls: cannot access 'v1.txt': No such file or directory
```

Writing to `v1.txt` was denied (no `w` on the file), but deleting it succeeded because deletion is a change to the **directory**, which is writable. (Plain `rm` would have asked "remove write-protected regular file?" first.)

### Recursive changes with capital X

`chmod -R 755 dir` would make every **file** executable too. Capital `X` adds execute only to directories (and to files already executable by someone):

```bash
chmod -R u=rwX,go=rX project
ls -l project | head -n 3
```

**Output:**

```text
total 20
-rw-r--r-- 1 student student   63 Jan 15 09:30 build.sh
drwxr-xr-x 2 student student 4096 Jan 15 09:30 docs
```

> [!CAUTION]
> `chmod -R` changes every file under the path in one go and cannot be undone. `chmod -R 777 /var/www` (a common "fix") exposes everything to every user; `chmod -R 000` on the wrong directory can break a system. Check the path, prefer `X` over `x`, and use `find` with `-type f` / `-type d` for precise changes.

## Comparison

### Symbolic vs numeric

| | Symbolic (`u+x`) | Numeric (`755`) |
|---|---|---|
| Changes | Only the bits you mention | All nine bits (plus special bits with 4 digits) |
| Readability | Self-explanatory | Compact, needs translation |
| Recursive safety | `X` available | No equivalent of `X` |
| Best for | Small adjustments | Setting a known final state |

### Why can I read a file but not execute it?

| Situation | Explanation |
|-----------|-------------|
| `-rw-r--r--` and `./script.sh` → Permission denied | No `x` bit for your class; `chmod u+x script.sh` (or run `bash script.sh`, which only needs `r`) |
| `x` is set but the filesystem is mounted `noexec` (common for `/tmp`) | The mount option forbids execution; run it from elsewhere |
| `x` is set, "bad interpreter: No such file or directory" | The shebang path is wrong, or the file has Windows line endings (`#!/bin/bash\r`) |

## Common Mistakes

- `chmod 777` to "fix" permission errors — it removes all protection. Find which class needs which bit.
- Forgetting that directories need `x` to be entered, or that every parent directory on a path needs `x`.
- Thinking the owner can fall back to group or other permissions.
- Using `chmod -R 755` and making every file executable; use `u=rwX,go=rX`.
- Trying to `chmod` a file you do not own — only the owner or root can.
- Expecting `chmod` to change who owns a file — that is `chown`.

## Key Takeaways

- Classes: owner (`u`), group (`g`), others (`o`); the kernel checks one class only, root bypasses checks.
- `r`=4, `w`=2, `x`=1; `755` = `rwxr-xr-x`, `644` = `rw-r--r--`, `600` = `rw-------`, `700` = `rwx------`.
- Directory `r` lists, `w` creates/deletes (with `x`), `x` enters and reaches files.
- Deleting a file depends on the directory's permissions, not the file's.
- `chmod u+x`, `g-w`, `o=r`, `a+r`; `-R` with `X` for safe recursive changes.

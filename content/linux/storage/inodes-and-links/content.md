# Inodes, Hard Links and Symbolic Links

**Module:** Filesystems and Storage · **Interview priority:** Core

## What Is It?

On Linux filesystems, a file's **name** and the file **itself** are separate:

- An **inode** is the on-disk record of a file: its type, permissions, owner, size, timestamps, link count and the location of its data blocks. It has a number, but **no name**.
- A **directory** is a list of entries, each mapping a **name** to an **inode number**.
- A **hard link** is simply another directory entry pointing to the **same inode** — a second name for the same file.
- A **symbolic link** (symlink, soft link) is a **separate small file** whose content is a **path** to another file.

```text
HARD LINKS                                  SYMBOLIC LINK

original.txt ──┐                            soft.txt ──► inode 32686 (type: link)
               ├──► inode 32685 ──► data               content: "original.txt"
hard.txt ──────┘    links = 2                                   │ resolved by path
                                                                ▼
                                            original.txt ──► inode 32685 ──► data
```

## Why It Matters

- It explains everyday behaviour: why `mv` is instant, why deleting a file does not always free space, why a symlink can break, how `ls -l` shows a link count.
- Symlinks are everywhere in operations: `/bin → usr/bin`, `current → releases/2026-01-15` deployments, `sites-enabled` in nginx, `/etc/alternatives`.
- "Hard link vs symbolic link" is one of the most frequently asked Linux interview questions.

## Core Concept

### What the inode stores — and what it does not

| In the inode | Not in the inode |
|--------------|------------------|
| File type, permissions, owner, group | The file's **name** (that is in the directory) |
| Size, timestamps (atime, mtime, ctime) | The directory it lives in |
| **Link count** (number of names) | |
| Pointers to the data blocks | |

`ls -i` and `stat` show inode numbers. Inode numbers are unique **within one filesystem**.

### When is a file really deleted?

`rm` removes a **name** (directory entry) and decrements the inode's link count. The data is freed only when **both**:

1. the link count reaches 0 (no names left), and
2. no process still has the file open.

That is why deleting one hard link leaves the file intact, and why deleting a log that a process still writes does not free space.

### Hard links

- Every name is equal — there is no "original"; `ls -l` shows the count in the second column.
- Same inode → same content, permissions, owner and timestamps; a change through one name is visible through all.
- **Restrictions:** cannot span filesystems (inode numbers are per filesystem) and cannot point to directories (to keep the tree free of loops; only the kernel creates `.` and `..`).

### Symbolic links

- A separate inode of type `l` whose content is a path (absolute or relative).
- Can point to directories, to other filesystems, even to paths that do not exist.
- If the target is deleted or moved, the symlink is **dangling** (broken).
- A **relative** target is resolved relative to the **directory containing the link**, not your current directory.
- Most commands follow symlinks transparently (`cat`, `cd`); some act on the link itself (`ls -l`, `rm`, `readlink`).
- Permissions shown on a symlink (`lrwxrwxrwx`) are irrelevant; access is decided by the target's permissions.

## Commands

### ln

**Purpose:** create links.

**Syntax:**

```text
ln TARGET LINK_NAME          hard link
ln -s TARGET LINK_NAME       symbolic link
```

| Option | Meaning |
|--------|---------|
| `-s` | Symbolic link |
| `-f` | Replace an existing link name |
| `-n` | Treat an existing symlink to a directory as a file (use with `-sfn` to repoint) |
| `-v` | Verbose |

```bash
mkdir links
cd links
echo "version 1" > original.txt
ln original.txt hard.txt
ln -s original.txt soft.txt
ls -li
```

**Output (varies):**

```text
total 8
32685 -rw-r--r-- 2 student student 10 Jan 15 09:30 hard.txt
32685 -rw-r--r-- 2 student student 10 Jan 15 09:30 original.txt
32686 lrwxrwxrwx 1 student student 12 Jan 15 09:30 soft.txt -> original.txt
```

- `original.txt` and `hard.txt` share inode 32685, and the link count is **2**.
- `soft.txt` has its own inode 32686, type `l`, size 12 — the length of the text `original.txt`.

Check without depending on inode numbers:

```bash
stat -c '%h %F %n' original.txt hard.txt soft.txt
[ original.txt -ef hard.txt ] && echo "same file"
```

**Output:**

```text
2 regular file original.txt
2 regular file hard.txt
1 symbolic link soft.txt
same file
```

### A change through any name is visible through all

```bash
echo "version 2" >> hard.txt
cat original.txt
cat soft.txt
```

**Output:**

```text
version 1
version 2
version 1
version 2
```

### Deleting the original

```bash
rm original.txt
cat hard.txt
cat soft.txt
ls -l soft.txt
stat -c '%h %n' hard.txt
```

**Output:**

```text
version 1
version 2
cat: soft.txt: No such file or directory
lrwxrwxrwx 1 student student 12 Jan 15 09:30 soft.txt -> original.txt
1 hard.txt
```

- The hard link still reaches the data; the link count dropped to 1.
- The symlink is now **dangling**: it still exists and still says `original.txt`, but that path no longer exists.

Recreate a file with the old name:

```bash
echo "brand new" > original.txt
cat soft.txt
cat hard.txt
```

**Output:**

```text
brand new
version 1
version 2
```

The symlink follows the **path**, so it now shows the new file. The hard link still refers to the **old inode** — two completely different files now.

### readlink

```bash
readlink soft.txt
readlink -f soft.txt
```

**Output:**

```text
original.txt
/home/student/linux-lab/links/original.txt
```

`readlink` prints the stored target; `-f` resolves it fully to an absolute path (following chains of links).

### What links cannot do

```bash
ln ../config hardlinked-dir
ln ../notes.txt /tmp/notes-link
```

**Output:**

```text
ln: ../config: hard link not allowed for directory
ln: failed to create hard link '/tmp/notes-link' => '../notes.txt': Invalid cross-device link
```

`/tmp` is a different filesystem here (tmpfs), so a hard link is impossible. A symlink works across both cases.

### The relative-path trap

```bash
ln -s ../../config cfg
ls -l cfg
find . -xtype l
```

**Output:**

```text
lrwxrwxrwx 1 student student 12 Jan 15 09:30 cfg -> ../../config
./cfg
```

(`soft.txt` is not listed: it works again since `original.txt` was recreated.) The target `../../config` is resolved from the link's directory (`links/`), giving `~/config`, which does not exist — the link is dangling. `find -xtype l` lists broken symlinks. The correct target here is `../config`.

## Examples

### Zero-downtime deployments with a symlink

```bash
# Illustrative
/srv/app/releases/2026-01-14/
/srv/app/releases/2026-01-15/
ln -sfn /srv/app/releases/2026-01-15 /srv/app/current   # switch atomically
# the service runs /srv/app/current/app.jar; rollback = point the link back
```

`-n` makes `ln` replace the `current` link itself instead of creating a link inside the directory it points to.

### Symlinks you will meet on every system

```bash
# Illustrative
ls -l /bin                         # /bin -> usr/bin (merged /usr)
ls -l /etc/nginx/sites-enabled/    # links to files in sites-available
readlink -f "$(command -v java)"   # /usr/bin/java -> /etc/alternatives/java -> the real JDK
```

### Why `mv` is instant and `rm` may not free space

- `mv` within one filesystem creates a new directory entry for the same inode and removes the old one — no data is copied.
- `rm` only removes a name; the space is freed when the link count is 0 **and** no process holds the file open (`lsof +L1` finds the latter).

## Comparison

### Hard link vs symbolic link

| | Hard link | Symbolic link |
|---|---|---|
| What it is | Another name (directory entry) for the same inode | A separate file containing a path |
| Inode | Same as the target | Its own |
| Create | `ln target name` | `ln -s target name` |
| Across filesystems | No | Yes |
| To directories | No | Yes |
| Target deleted | Data stays reachable (until the last link is gone) | Link breaks (dangling) |
| Target moved/renamed | Still works | Breaks (unless the target path is recreated) |
| `ls -l` shows | `-` type, link count > 1 | `l` type and `-> target` |
| Size | The file's size | Length of the path string |
| Typical use | Backups with snapshots (rsync `--link-dest`), rare in daily work | Versions, shortcuts, `current` releases, config activation |

### Copy vs hard link vs symlink

| | `cp a b` | `ln a b` | `ln -s a b` |
|---|---|---|---|
| Disk space | Doubles | None extra | Tiny |
| Edit `b` changes `a`? | No | Yes | Yes (edits the target) |
| Delete `a` | `b` unaffected | `b` unaffected | `b` broken |

## Common Mistakes

- Expecting a hard link to break when the "original" is deleted — there is no original; all names are equal.
- Creating relative symlinks from the wrong directory (`../../config` vs `../config`).
- `ln -s` with the arguments reversed (`ln -s linkname target`). Remember: like `cp`, **source first**.
- Using `ln -sf newtarget current` on a link that points to a directory without `-n` — it creates a link inside the old target.
- `rm -r symlink-to-dir/` with a trailing slash can delete the **target's contents**; remove links with `rm symlink` (no slash) or `unlink`.
- Thinking `chmod` on a symlink changes the link — it changes the target.

## Key Takeaways

- An inode holds a file's metadata and data location; names live in directories and point to inodes.
- Hard link = extra name for the same inode (same filesystem, not directories); the file survives until the last name is removed and it is closed.
- Symlink = separate file storing a path; works across filesystems and for directories; breaks when the target path disappears.
- `ls -li`, `stat`, `readlink -f`, `find -xtype l` inspect links; `ln` / `ln -s` / `ln -sfn` create them.
- `rm` removes a name; space returns only when no names and no open handles remain.

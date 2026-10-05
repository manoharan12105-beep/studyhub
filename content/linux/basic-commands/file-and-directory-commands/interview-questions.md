# Creating, Copying, Moving and Deleting Files — Interview Questions

## Beginner

### Q1. What is the difference between `cp` and `mv`?

<details>
<summary>Answer</summary>

`cp` creates a second, independent copy and leaves the original; `mv` moves (or renames) the original, so only one exists afterwards. `cp` needs `-r` for directories; `mv` moves whole directories without options. On the same filesystem `mv` is instant because it only changes directory entries.

</details>

### Q2. How do you rename a file in Linux?

<details>
<summary>Answer</summary>

With `mv old-name new-name`. Renaming is a move within the same directory. (For bulk renames there is also the `rename` utility on some distributions.)

</details>

### Q3. How do you copy a directory with all its contents?

<details>
<summary>Answer</summary>

`cp -r source/ destination/`. For backups use `cp -a`, which also preserves permissions, ownership, timestamps and symbolic links.

</details>

### Q4. What is the difference between `rm -r` and `rmdir`?

<details>
<summary>Answer</summary>

`rmdir` removes a directory only if it is empty, so it can never delete files. `rm -r` removes the directory and everything inside it, recursively.

</details>

### Q5. What does `mkdir -p` do?

<details>
<summary>Answer</summary>

It creates any missing parent directories (`mkdir -p a/b/c`) and does not fail if the directory already exists — which makes it safe to run repeatedly in scripts.

</details>

### Q6. What does `touch` do to an existing file?

<details>
<summary>Answer</summary>

It updates the file's access and modification timestamps to the current time without changing its content. On a missing file it creates an empty one (unless `-c` is given).

</details>

## Intermediate

### Q7. What does `rm -rf` do, and why is it dangerous?

<details>
<summary>Answer</summary>

`-r` deletes directories recursively; `-f` never prompts and ignores errors such as missing files. Together they delete everything under the given paths silently and permanently. A typo, a space (`rm -rf / tmp/x`), or an empty variable (`rm -rf "$DIR"/*` with `DIR` unset) can destroy a project or the system. Safer habits: `ls` the target first, quote variables and guard them with `${DIR:?}`, use `rm -I`, and avoid running as root.

</details>

### Q8. Can you recover a file deleted with `rm`?

<details>
<summary>Answer</summary>

Not with normal tools — there is no trash on the command line. The data blocks are marked free and may be overwritten at any time. Options are backups or snapshots, a still-running process that holds the file open (`/proc/<pid>/fd/`), or forensic tools on an unmounted disk with no guarantee. Prevention matters more than recovery.

</details>

### Q9. Why is `mv` of a 50 GB file instant on one disk but slow to another disk?

<details>
<summary>Answer</summary>

Within one filesystem, `mv` just creates a new directory entry pointing to the same inode and removes the old entry — no data moves. Across filesystems an inode cannot be shared, so `mv` copies all the data to the new filesystem and then deletes the original.

</details>

### Q10. What does `cp -a` preserve that plain `cp -r` does not?

<details>
<summary>Answer</summary>

With plain `cp -r`, the copies get the current time as their modification time, the copying user as owner, and the source's permission bits filtered through the umask (special bits such as SUID are dropped). `cp -a` (= `-dR --preserve=all`) keeps the original timestamps, ownership (when run as root), full mode, ACLs and extended attributes, hard-link relationships inside the copied tree, and copies symbolic links as links. Use `-a` for backups and migrations.

</details>

## Advanced

### Q11. How would you safely delete everything in a directory given by a variable in a script?

<details>
<summary>Answer</summary>

Fail if the variable is empty, quote it, and stop option parsing:

```bash
# Illustrative
rm -rf -- "${TARGET_DIR:?TARGET_DIR is not set}"/*
```

Better still, add `set -u` (error on unset variables), check that the directory exists and is the one you expect (`[[ -d $TARGET_DIR && $TARGET_DIR == /srv/app/cache* ]]`), and log what is removed.

</details>

### Q12. A file cannot be deleted even though you own it. What could be the reasons?

<details>
<summary>Answer</summary>

Deleting needs write and execute permission on the **directory**, not on the file. Other causes: the directory has the sticky bit and someone else owns the file; the file has the immutable attribute (`lsattr` shows `i`; remove with `chattr -i` as root); the filesystem is mounted read-only; the name contains odd characters (use `rm -- name` or `rm -i ./*` or delete by inode with `find . -inum N -delete`).

</details>

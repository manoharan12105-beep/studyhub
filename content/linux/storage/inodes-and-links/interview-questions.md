# Inodes, Hard Links and Symbolic Links — Interview Questions

## Beginner

### Q1. What is an inode?

<details>
<summary>Answer</summary>

The data structure a Linux filesystem uses to describe a file: type, permissions, owner, group, size, timestamps, link count and pointers to the data blocks. It does not contain the file name — names are stored in directories, which map names to inode numbers. `ls -i` and `stat` show inode numbers.

</details>

### Q2. What is the difference between a hard link and a symbolic link?

<details>
<summary>Answer</summary>

A hard link is an additional directory entry pointing to the same inode — another name for the same file; deleting one name leaves the data reachable through the others. It cannot span filesystems or point to directories. A symbolic link is a separate file containing a path to the target; it can cross filesystems and point to directories, but breaks (dangles) if the target is moved or deleted.

</details>

### Q3. How do you create each type of link?

<details>
<summary>Answer</summary>

`ln target linkname` for a hard link and `ln -s target linkname` for a symbolic link. The target comes first, as with `cp`.

</details>

### Q4. What happens to a symlink when you delete its target?

<details>
<summary>Answer</summary>

It remains but becomes dangling: `ls -l` still shows `link -> target`, while accessing it gives "No such file or directory". If a new file is later created at the target path, the symlink works again and points to the new file.

</details>

## Intermediate

### Q5. What does the link count in `ls -l` mean?

<details>
<summary>Answer</summary>

The number of directory entries (hard links) referring to the inode. A regular file normally has 1; each extra hard link adds one. A directory has at least 2 (its name in the parent and its own `.`) plus one for each subdirectory (their `..` entries).

</details>

### Q6. Why can't you create a hard link to a directory?

<details>
<summary>Answer</summary>

Directory hard links could create cycles in the filesystem tree, breaking tools that walk it (`find`, `du`, backups) and making it impossible to determine a directory's single parent (`..`). The kernel only creates the special `.` and `..` entries itself.

</details>

### Q7. Why can't a hard link span two filesystems?

<details>
<summary>Answer</summary>

A directory entry stores an inode number, and inode numbers are only unique within one filesystem. An entry on filesystem A cannot refer to an inode on filesystem B, so `ln` fails with "Invalid cross-device link". Symlinks store a path instead, so they work anywhere.

</details>

### Q8. When does the disk space of a deleted file actually get freed?

<details>
<summary>Answer</summary>

When the inode's link count reaches zero (no names left) **and** no process has the file open. Deleting one of several hard links frees nothing; deleting a file that a running process still uses frees space only after that process closes it (find such files with `lsof +L1`).

</details>

### Q9. Why is `mv` within the same filesystem so fast?

<details>
<summary>Answer</summary>

It only creates a new directory entry pointing to the existing inode and removes the old entry — no data blocks are copied. Across filesystems the inode cannot be shared, so `mv` copies the data and deletes the original.

</details>

## Advanced

### Q10. How are symlinks used for zero-downtime deployments?

<details>
<summary>Answer</summary>

Each release is unpacked into its own directory (`releases/2026-01-15`), and a symlink `current` points to the active one. Switching is a single atomic rename of the link (`ln -sfn new current` — or create a temporary link and `mv -T` it over `current`); rollback just points it back. Services and web servers reference `current`, so they pick up the new version on restart or reload.

</details>

### Q11. A relative symlink works in one place but breaks after you move it. Why?

<details>
<summary>Answer</summary>

A relative target is resolved from the directory containing the link. Moving the link to another directory changes that starting point, so `../config` now points somewhere else. Moving the link together with its target (keeping the relative layout) keeps it working; absolute targets survive moving the link but break if the target moves.

</details>

### Q12. Why is `rm -rf link/` dangerous when `link` is a symlink to a directory?

<details>
<summary>Answer</summary>

With the trailing slash the path refers to the directory the link points to, so `rm -rf` can delete the **target's contents** instead of the link itself (behaviour varies by tool and options). To remove only the link use `rm link` or `unlink link` — no trailing slash.

</details>

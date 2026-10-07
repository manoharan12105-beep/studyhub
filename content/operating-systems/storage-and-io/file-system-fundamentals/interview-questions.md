# File System Fundamentals — Interview Questions

## Beginner

### Q1. What is a file system?

**Style:** Direct

<details>
<summary>Answer</summary>

The part of the OS that organises data on storage devices into files and directories, maps them to disk blocks, manages free space, and enforces access control. Examples: ext4 and XFS on Linux, NTFS on Windows, APFS on macOS, FAT32/exFAT on removable drives.

</details>

### Q2. What are the file allocation methods?

**Style:** Direct

<details>
<summary>Answer</summary>

**Contiguous** (each file in consecutive blocks), **linked** (each block points to the next, or a FAT table holds the chain) and **indexed** (an index block — or inode — lists the file's blocks). Contiguous is fastest but suffers external fragmentation; linked avoids fragmentation but random access is slow; indexed supports direct access at the cost of index blocks.

</details>

### Q3. What is an inode?

**Style:** Direct

<details>
<summary>Answer</summary>

A data structure in UNIX-like file systems that stores a file's metadata — type, size, owner, permissions, timestamps, link count — and pointers to its data blocks (direct pointers plus single-, double- and triple-indirect pointers). Each file has one inode, identified by an inode number. The file's name is stored in directory entries, not in the inode.

</details>

## Intermediate

### Q4. Compare contiguous, linked and indexed allocation for random access.

**Style:** Comparison

<details>
<summary>Answer</summary>

To read block i of a file: **contiguous** computes start + i — one read; **linked** must follow i pointers from the first block — i + 1 reads (unless a FAT is cached in memory); **indexed** reads the index block (often cached) and then block i directly — about two reads. Hence databases and random-access files favour contiguous-like extents or indexing.

</details>

### Q5. What is the difference between a hard link and a symbolic link?

**Style:** Comparison

<details>
<summary>Answer</summary>

A **hard link** is an additional directory entry pointing to the same inode; all names are equal, and the data is freed only when the link count reaches zero. Hard links cannot cross file systems and usually cannot point to directories. A **symbolic link** is a separate small file containing a path to the target; it can cross file systems and point to directories, but it breaks (dangles) if the target is moved or deleted.

</details>

### Q6. How does an OS keep track of free disk blocks?

**Style:** How

<details>
<summary>Answer</summary>

With a **bitmap** (one bit per block, easy to find contiguous free runs, small: a 1 TB disk with 4 KB blocks needs 32 MB) or a **free list** (free blocks linked together — no extra space, but slow to scan). Variants group several free block numbers per block or store (start, count) runs of free blocks.

</details>

## Advanced

### Q7. What problem does journaling solve?

**Style:** Why

<details>
<summary>Answer</summary>

Updating a file can require several separate disk writes (inode, bitmap, directory, data). A crash in between leaves the file system inconsistent — leaked blocks or a directory pointing to garbage — and recovery used to need a full scan (`fsck`). A journaling file system first writes the intended changes to a log; after the log record is committed it applies them. On reboot it replays committed records and discards incomplete ones, restoring consistency quickly.

</details>

### Q8. Why can a file still exist after you delete its name?

**Style:** Trap

<details>
<summary>Answer</summary>

Deleting a name removes one directory entry and decrements the inode's link count. The data is freed only when the link count is zero **and** no process has the file open. If another hard link exists, or a process still holds an open descriptor (a common cause of "disk full but I deleted the log"), the inode and its blocks remain until the last link and the last descriptor are gone.

</details>

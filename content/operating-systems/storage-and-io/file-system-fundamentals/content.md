# File System Fundamentals

**Module:** Storage and I/O · **Interview priority:** Frequently asked

## Concept

A **file system** is the part of the OS that organises data on storage into **files** and **directories**, maps them onto **disk blocks**, and controls access to them.

- A **file** is a named collection of related data, with **attributes**: name, type, size, location (which blocks), owner, permissions, timestamps.
- A **directory** maps names to files (or to their metadata) and organises them into a hierarchy.

## Why It Matters

Disks only understand numbered blocks. The file system turns them into `report.pdf` in `/home/asha/docs`, decides which blocks hold it, and keeps that consistent when the power fails. Interviews ask about allocation methods (contiguous, linked, indexed), inodes, and free-space management.

## How It Works

### File operations and access methods

- Operations (system calls): create, open, read, write, seek (reposition), close, delete, truncate.
- **Open-file table**: `open()` looks up the file once and returns a descriptor; later reads and writes use it instead of searching the directory again.
- **Sequential access**: read records in order (logs, media files). **Direct (random) access**: jump to any block (databases).

### Directory structures

| Structure | Idea | Limitation |
|-----------|------|------------|
| Single-level | One directory for everyone | Name clashes; no organisation |
| Two-level | One directory per user | No subfolders; hard to share |
| **Tree** | Directories inside directories; absolute and relative paths | Sharing a file in two places needs links |
| Acyclic graph | Tree plus links that share files or directories | Deleting shared files needs reference counts |

Modern systems use a tree with **links**: a **hard link** is a second directory entry pointing to the same file data (inode); a **symbolic (soft) link** is a small file containing a path.

### Allocation methods: which blocks hold a file?

| Method | How | Pros | Cons |
|--------|-----|------|------|
| **Contiguous** | File occupies consecutive blocks; directory stores start + length | Fast sequential and direct access | External fragmentation; files hard to grow |
| **Linked** | Each block points to the next; directory stores first block | No external fragmentation; easy growth | Direct access is slow (follow the chain); a broken pointer loses the rest |
| **FAT** (linked variant) | Pointers kept in a separate File Allocation Table | Table can be cached → faster direct access | Table must fit in memory; still a chain |
| **Indexed** | An index block lists all the file's block numbers | Direct access, no external fragmentation | Index block overhead; large files need multi-level or combined indexing |

### Inodes (UNIX/Linux)

Each file has an **inode** holding its metadata — size, owner, permissions, timestamps, link count — and **block pointers**: several direct pointers, then a single-indirect, a double-indirect and a triple-indirect pointer. Small files are reached through direct pointers in one step; huge files through indirect blocks. The **file name is not in the inode**; it lives in the directory entry, which is why one inode can have several names (hard links).

### Free-space management

- **Bitmap (bit vector)**: one bit per block — 1 free, 0 used (or the reverse). Easy to find runs of free blocks; costs one bit per block.
- **Linked list** of free blocks — no wasted space, but slow to traverse.
- **Grouping / counting** — store several free block numbers or (start, count) runs together.

### Consistency: journaling

A crash in the middle of an update can leave metadata inconsistent (a block marked used but not in any file). **Journaling** file systems (ext4, NTFS, XFS) first write the intended metadata changes to a log, then apply them; after a crash they replay or discard the log instead of scanning the whole disk.

## Example

A 1 TB disk with 4 KB blocks has 1 TB ÷ 4 KB = 2⁴⁰ ÷ 2¹² = 2²⁸ ≈ 268 million blocks. A **bitmap** needs one bit per block: 2²⁸ bits = 2²⁵ bytes = **32 MB**.

Reading byte 10,000,000 of a 20 MB file with 4 KB blocks means reading logical block 10,000,000 ÷ 4096 = **2441** of the file:

- **Contiguous:** start block + 2441 → one calculation, one read.
- **Linked:** follow 2441 pointers from the first block — 2442 reads without caching.
- **Indexed:** read the index entry 2441, then the data block.

## Important Points

- File = named data + attributes; directory = name → file mapping, organised as a tree with links.
- Allocation: contiguous (fast, fragmentation), linked (no fragmentation, slow direct access), indexed (direct access, index overhead).
- Inode = metadata + block pointers (direct, single, double, triple indirect); names live in directories.
- Free space: bitmap or free list.
- Journaling keeps metadata consistent after crashes.

## Common Confusion

> [!WARNING]
> **"The inode stores the file name."** It does not. The directory entry maps a name to an inode number; that is why renaming within a file system is cheap and why hard links are possible.

- **Hard link vs soft link:** a hard link is another name for the same inode (the file survives until the last link is removed); a symbolic link is a path that breaks if the target is deleted.
- **Contiguous allocation's fragmentation is external**, like contiguous memory allocation.

## Interview Perspective

- *"Explain contiguous, linked and indexed allocation."* — with one pro and one con each.
- *"What is an inode? What does it contain?"* — metadata and block pointers, not the name.
- *"Hard link vs soft link?"* (Linux practice: [Inodes and Links](../../../linux/storage/inodes-and-links/content.md).)
- *"How is free space tracked?"* — bitmap vs free list.

## Quick Revision

- Contiguous: start + length; fast; external fragmentation.
- Linked/FAT: chain of blocks; no fragmentation; slow random access.
- Indexed/inode: index of block pointers; direct access.
- Inode: metadata + pointers, no name. Bitmap: 1 bit per block.
- Journaling: log first, then apply.

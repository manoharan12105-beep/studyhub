# Filesystem and Storage Cheat Sheet

The directory layout, paths, disks, mounting, inodes and links.

## Filesystem Hierarchy

| Directory | Contains |
|-----------|----------|
| `/` | Root of the single directory tree |
| `/bin`, `/sbin` | Essential commands (today usually links to `/usr/bin`, `/usr/sbin`) |
| `/usr` | Installed programs, libraries, documentation (`/usr/bin`, `/usr/lib`, `/usr/share`) |
| `/usr/local` | Software installed locally by the administrator |
| `/opt` | Optional, self-contained third-party software |
| `/etc` | System-wide configuration (text files) |
| `/home/<user>` | Users' home directories (`~`) |
| `/root` | Root's home directory |
| `/var` | Variable data: `/var/log` logs, `/var/lib` application state, `/var/cache`, `/var/spool` |
| `/tmp` | Temporary files, sticky bit `1777`, often cleared at boot |
| `/dev` | Device files (`/dev/sda`, `/dev/null`, `/dev/zero`) |
| `/proc`, `/sys` | Virtual files exposing kernel and process information |
| `/boot` | Kernel and boot loader files |
| `/mnt`, `/media` | Mount points for temporary / removable media |
| `/run` | Runtime data since boot (PID files, sockets) |

## Paths

- Absolute: starts with `/` — `/home/student/linux-lab/app.log`.
- Relative: from the current directory — `logs/debug.log`, `../notes.txt`.
- `.` current · `..` parent · `~` home · `~alice` alice's home · `-` (with `cd`) previous directory.
- Hidden files start with `.` (`ls -a`).

## Disk Usage

| Command | Shows |
|---------|-------|
| `df -h` | Size / used / available per mounted filesystem |
| `df -i` | Inode usage per filesystem |
| `df -h /var` | The filesystem containing `/var` |
| `du -sh dir` | Total size of a directory |
| `du -h --max-depth=1 dir \| sort -h` | Size of each subdirectory, largest last |
| `du -ah dir \| sort -h \| tail` | Largest files and directories |
| `find / -xdev -type f -size +500M` | Large files on one filesystem |
| `lsof +L1` | Deleted files still held open (space not freed) |

## Disks and Mounting

| Command | Purpose |
|---------|---------|
| `lsblk` | Block devices, partitions, mount points (tree) |
| `lsblk -f` / `blkid` | Filesystem types, labels, UUIDs |
| `findmnt` / `mount` | What is mounted where, with options |
| `sudo mount /dev/sdb1 /data` | Mount a filesystem |
| `sudo umount /data` | Unmount (`target is busy` → `lsof +D /data`, `fuser -vm /data`) |
| `sudo mount -a` | Mount everything in `/etc/fstab` — test fstab edits with this |
| `sudo fdisk -l` / `parted` | Partition tables (**destructive** when writing) |
| `sudo mkfs.ext4 /dev/sdb1` | Create a filesystem (**erases data**) |

`/etc/fstab` line: `UUID=… /data ext4 defaults,nofail 0 2` — device, mount point, type, options, dump, fsck order.

> [!CAUTION]
> `mkfs`, `fdisk`/`parted` writes and `dd of=/dev/…` destroy data on the target device. Confirm the device with `lsblk` first, never run them on a disk you have not identified, and have a backup.

## Inodes and Links

- **Inode**: metadata (type, mode, owner, size, timestamps, link count, block pointers) — everything except the name. `ls -i`, `stat`.
- **Directory**: a table of name → inode number.
- **Hard link** `ln a b`: second name for the same inode; link count +1; same filesystem only; no directories.
- **Symbolic link** `ln -s a b`: a separate inode whose content is a path; can cross filesystems; breaks if the target moves.
- Data is freed when the link count is 0 **and** no process has the file open.
- `find -L dir -type l` lists broken symlinks; `readlink -f link` resolves the final target.

## File Types in `ls -l`

`-` regular · `d` directory · `l` symlink · `c` character device · `b` block device · `p` named pipe · `s` socket

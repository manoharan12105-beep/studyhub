# Disks, Partitions, Filesystems and Mounting — Practice

These items involve devices and root. Try them only in a VM with spare virtual disks.

### P1. Name the layers

**Difficulty:** Easy · **Type:** Conceptual · **Concepts:** disk, partition, filesystem, mount point

In `/dev/nvme0n1p2` formatted as ext4 and mounted at `/home`, identify the disk, the partition, the filesystem and the mount point.

<details>
<summary>Answer</summary>

Disk `/dev/nvme0n1`, partition `/dev/nvme0n1p2` (the second one), filesystem ext4, mount point `/home`.

</details>

### P2. See the tree

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** lsblk

Which command shows disks and partitions as a tree with their mount points?

- A) `df -h`
- B) `lsblk`
- C) `du -sh /`
- D) `mount -a`

<details>
<summary>Answer</summary>

**Answer:** B) `lsblk`

**Explanation:** `df` lists only mounted filesystems with usage; `mount -a` mounts fstab entries.

</details>

### P3. Mount read-only

**Difficulty:** Easy · **Type:** Command · **Concepts:** mount -o

Mount `/dev/sdb1` read-only at `/mnt/evidence` (create the directory first).

<details>
<summary>Answer</summary>

```bash
# Illustrative: needs root
sudo mkdir -p /mnt/evidence
sudo mount -o ro /dev/sdb1 /mnt/evidence
```

</details>

### P4. Busy target

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** umount, lsof

`sudo umount /mnt/backup` fails with "target is busy". Give two commands that reveal what is using it, and the most common cause.

<details>
<summary>Answer</summary>

```bash
# Illustrative
sudo lsof +D /mnt/backup
sudo fuser -vm /mnt/backup
```

Most common cause: a shell (often your own, in another terminal) whose current directory is inside the mount, or a process with an open file there.

</details>

### P5. Write the fstab line

**Difficulty:** Medium · **Type:** Command · **Concepts:** /etc/fstab

`blkid` reports `UUID="5c1e9e2a-7d0f-4b1d-9c55-2b6f0e9d1a77" TYPE="xfs"` for a data disk. Write the fstab line to mount it at `/srv/data` at boot, without blocking boot if the disk is missing, and the commands to test it.

<details>
<summary>Answer</summary>

```text
UUID=5c1e9e2a-7d0f-4b1d-9c55-2b6f0e9d1a77  /srv/data  xfs  defaults,nofail  0  2
```

```bash
# Illustrative
sudo mkdir -p /srv/data
sudo findmnt --verify
sudo mount -a && df -h /srv/data
```

</details>

### P6. Hidden files

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** mount hides directory contents

An application wrote 30 GB into `/data` while the data disk was not mounted (a boot without the disk). Now the disk is mounted again, `ls /data` shows only the disk's content, but `/` is full. Explain.

<details>
<summary>Answer</summary>

The 30 GB were written into the `/data` directory **on the root filesystem**. Mounting the disk on `/data` hides that directory's original contents, so they are invisible but still use space on `/`. Unmount `/data` (or bind-mount `/` elsewhere), move the files onto the disk, then remount. Use `nofail` with monitoring, or make the application fail if its data disk is not mounted.

</details>

### P7. Wrong device

**Difficulty:** Hard · **Type:** Scenario · **Concepts:** destructive commands

A runbook says "run `sudo mkfs.ext4 /dev/sdb`". On your server, `lsblk` shows `sdb` is mounted at `/var/lib/postgresql`. What do you do?

<details>
<summary>Answer</summary>

Stop. `mkfs` would destroy the PostgreSQL data. Device names differ between machines; the runbook's `/dev/sdb` is not this server's empty disk. Identify the correct new disk by size, absence of partitions/mount points and serial (`lsblk -o NAME,SIZE,TYPE,MOUNTPOINTS,SERIAL`), confirm with the team, update the runbook to use a verified device (or `/dev/disk/by-id/…` path), and take a backup before any formatting.

</details>

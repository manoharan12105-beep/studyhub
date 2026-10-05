# Disks, Partitions, Filesystems and Mounting — Interview Questions

## Beginner

### Q1. What does "mounting" mean in Linux?

<details>
<summary>Answer</summary>

Attaching a filesystem (on a partition, disk, network share or image) to a directory in the single directory tree, called the mount point. After `mount /dev/sdb1 /data`, everything under `/data` is stored on `/dev/sdb1`. There are no drive letters.

</details>

### Q2. How do you list disks and partitions?

<details>
<summary>Answer</summary>

`lsblk` shows disks, partitions, sizes and mount points as a tree; `lsblk -f` adds filesystem types and UUIDs; `sudo fdisk -l` shows partition tables; `blkid` shows UUIDs and types; `df -hT` shows mounted filesystems with usage.

</details>

### Q3. What is `/etc/fstab`?

<details>
<summary>Answer</summary>

The table of filesystems to mount automatically at boot: device (preferably `UUID=`), mount point, filesystem type, mount options, dump flag and fsck order. `sudo mount -a` mounts all entries without rebooting — the way to test changes.

</details>

### Q4. How do you unmount a filesystem, and what does "target is busy" mean?

<details>
<summary>Answer</summary>

`sudo umount /mnt/point`. "Target is busy" means a process still uses files there or has its working directory inside. Find it with `sudo lsof +D /mnt/point` or `sudo fuser -vm /mnt/point`, stop it or `cd` out, then unmount.

</details>

## Intermediate

### Q5. What is the difference between MBR and GPT?

<details>
<summary>Answer</summary>

MBR supports disks up to 2 TiB and four primary partitions (more via an extended partition), with a single partition table. GPT supports huge disks and 128+ partitions, keeps a backup table at the end of the disk with checksums, and is used with UEFI. GPT is the default for new systems.

</details>

### Q6. Why use UUIDs instead of `/dev/sdb1` in `/etc/fstab`?

<details>
<summary>Answer</summary>

Device names are assigned in detection order and can change when disks are added, removed or detected in a different order, so `/dev/sdb1` might suddenly be another disk. A filesystem UUID is stored in the filesystem itself and stays the same.

</details>

### Q7. What is the difference between ext4 and xfs?

<details>
<summary>Answer</summary>

Both are mature journaling filesystems. ext4 (Debian/Ubuntu default) can be grown and shrunk (shrinking offline) and is a strong general-purpose choice. xfs (RHEL default) excels with large files, large filesystems and parallel I/O and can grow online, but cannot be shrunk.

</details>

### Q8. What does the `nofail` option do in fstab?

<details>
<summary>Answer</summary>

If the device is missing or fails to mount at boot, the system continues booting instead of stopping in emergency mode. Use it for non-essential data disks and removable or network storage (with `_netdev` for network filesystems).

</details>

## Advanced

### Q9. Walk through adding a new 100 GB disk to a server and mounting it permanently at `/data`.

<details>
<summary>Answer</summary>

1. `lsblk` — identify the new empty disk (e.g. `/dev/vdb`), confirming size and no mount points.
2. Partition it: `sudo parted /dev/vdb --script mklabel gpt mkpart data ext4 0% 100%` (or `fdisk`).
3. `sudo mkfs.ext4 /dev/vdb1` (or `mkfs.xfs`).
4. `sudo mkdir /data`; `sudo blkid /dev/vdb1` for the UUID.
5. Add `UUID=… /data ext4 defaults,nofail 0 2` to `/etc/fstab`.
6. `sudo mount -a`, `findmnt /data`, `df -h /data`; set ownership/permissions for the application.

</details>

### Q10. A script in `/tmp` fails with "Permission denied" even after `chmod +x`. Why?

<details>
<summary>Answer</summary>

`/tmp` is probably mounted with `noexec` (a common hardening option), which forbids executing any file on that filesystem regardless of permission bits. Check with `findmnt /tmp`. Run it with `bash script.sh` or place it on a filesystem that allows execution.

</details>

### Q11. After a change, a remote server boots into emergency mode. You suspect `/etc/fstab`. How do you recover?

<details>
<summary>Answer</summary>

Use the provider's or hypervisor's console. In emergency mode, enter the root password (or boot with `systemd.unit=emergency.target` / `init=/bin/bash` if needed), remount root read-write (`mount -o remount,rw /`), fix or comment out the bad fstab line, run `findmnt --verify` and `mount -a`, then reboot. Prevention: test with `mount -a` and use `nofail` for non-root mounts.

</details>

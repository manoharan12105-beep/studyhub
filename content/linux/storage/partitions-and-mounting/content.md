# Disks, Partitions, Filesystems and Mounting

**Module:** Filesystems and Storage · **Interview priority:** Frequently asked

## What Is It?

Storage on Linux is built in layers:

```text
physical disk        /dev/sda, /dev/nvme0n1          (block device)
  └─ partition       /dev/sda1, /dev/nvme0n1p2        (a slice of the disk)
       └─ filesystem ext4, xfs, btrfs, vfat           (structure for files and directories)
            └─ mount point /, /home, /data            (where it appears in the single directory tree)
```

- A **partition** divides a disk into independent areas, described by a **partition table** (MBR or GPT).
- A **filesystem** organises a partition (or a whole disk, LVM volume, or file) into files, directories, inodes and free space.
- **Mounting** attaches a filesystem to a directory, the **mount point**. Everything under that directory now lives on that filesystem.

## Why It Matters

- Adding a data disk to a server, extending storage, mounting network shares and USB drives are routine operations.
- A wrong `/etc/fstab` line can stop a server from booting; a wrong `fdisk`/`mkfs` target destroys data.
- Interview topics: what mounting means, MBR vs GPT, ext4 vs xfs, `/etc/fstab`, "target is busy".

## Core Concept

### Device names

| Name | Device |
|------|--------|
| `/dev/sda`, `/dev/sdb` | SATA/SCSI/USB disks (and virtual disks) — first, second… |
| `/dev/sda1`, `/dev/sda2` | Partitions on `sda` |
| `/dev/nvme0n1`, `/dev/nvme0n1p1` | NVMe disk and its first partition |
| `/dev/vda`, `/dev/xvda` | Virtual disks in KVM / Xen clouds |
| `/dev/mapper/vg-lv` | LVM logical volumes or encrypted devices |

Names can change between boots when disks are added; **UUIDs** (unique filesystem IDs) do not, which is why `/etc/fstab` uses them.

### Partition tables: MBR vs GPT

| | MBR (msdos) | GPT |
|---|---|---|
| Maximum disk size | 2 TiB | Practically unlimited (8 ZiB) |
| Partitions | 4 primary (or 3 + extended with logical) | 128 by default |
| Redundancy | Single table at the start | Primary + backup table, checksums |
| Boot | Legacy BIOS | UEFI (and BIOS with a small boot partition) |
| Use today | Old systems, small disks | Default for new systems |

### Common filesystems

| Filesystem | Notes |
|------------|-------|
| `ext4` | Default on Debian/Ubuntu; mature, journaling, can grow and shrink (offline) |
| `xfs` | Default on RHEL; great for large files and parallel I/O; can grow, **cannot shrink** |
| `btrfs` | Copy-on-write, snapshots, checksums, subvolumes (default on Fedora, openSUSE) |
| `vfat` / `exfat` | USB sticks and the EFI system partition; no Unix permissions |
| `tmpfs` | Lives in RAM (`/tmp`, `/run`); contents vanish at reboot |
| `nfs`, `cifs` | Network filesystems |
| `swap` | Not a filesystem for files — extra virtual memory |

A **journaling** filesystem records pending changes in a journal first, so after a crash it can recover quickly to a consistent state instead of scanning the whole disk.

### /etc/fstab: mounts at boot

One line per filesystem to mount at boot:

```text
# <device>                                 <mount point> <type> <options>          <dump> <pass>
UUID=af0141ac-80de-489c-bdbf-8092df1509cc  /             ext4   defaults,errors=remount-ro 0  1
UUID=4f3c2b1a-1111-2222-3333-444455556666  /data         xfs    defaults,nofail      0      2
UUID=77316447-3159-4483-aa52-3a48622f42da  none          swap   sw                   0      0
```

| Field | Meaning |
|-------|---------|
| device | `UUID=…` (preferred), `LABEL=…`, or `/dev/…` |
| mount point | Directory (must exist) |
| type | `ext4`, `xfs`, `nfs`, `swap`, … |
| options | `defaults` (= rw, suid, dev, exec, auto, nouser, async), `ro`, `noexec`, `nosuid`, `nofail` (do not stop the boot if missing), `_netdev` (network filesystem) |
| dump | Legacy backup flag, usually 0 |
| pass | `fsck` order at boot: 1 for `/`, 2 for others, 0 to skip |

> [!WARNING]
> A typo in `/etc/fstab` (wrong UUID, missing device without `nofail`) can drop the server into emergency mode at the next boot — painful on a remote cloud machine. After editing, always run `sudo findmnt --verify` and `sudo mount -a` (mounts everything listed) **before** rebooting.

## Commands

### lsblk: block devices

```bash
# Illustrative: output depends on the machine
lsblk
lsblk -f
```

**Output (varies):**

```text
NAME MAJ:MIN RM   SIZE RO TYPE MOUNTPOINTS
sda    8:0    0 356.9M  1 disk
sdb    8:16   0 159.4M  1 disk
sdc    8:32   0     2G  0 disk [SWAP]
sdd    8:48   0     1T  0 disk /
NAME FSTYPE FSVER LABEL UUID                                 FSAVAIL FSUSE% MOUNTPOINTS
sdc  swap   1           77316447-3159-4483-aa52-3a48622f42da                [SWAP]
sdd  ext4   1.0         af0141ac-80de-489c-bdbf-8092df1509cc  953.2G     0% /
```

(These are WSL's virtual disks, used without partitions.) A typical cloud server looks like:

```text
NAME    MAJ:MIN RM  SIZE RO TYPE MOUNTPOINTS
vda     252:0    0   50G  0 disk
├─vda1  252:1    0 49.9G  0 part /
├─vda14 252:14   0    4M  0 part
└─vda15 252:15   0  106M  0 part /boot/efi
vdb     252:16   0  100G  0 disk            ← a new, empty data disk
```

`blkid` prints UUIDs and filesystem types of devices.

### findmnt and mount: what is mounted where

```bash
# Illustrative
findmnt /
```

**Output (varies):**

```text
TARGET SOURCE   FSTYPE OPTIONS
/      /dev/sdd ext4   rw,relatime,discard,errors=remount-ro,data=ordered
```

`findmnt` alone shows the whole mount tree; `findmnt -t ext4,xfs` filters by type; `mount` (no arguments) lists everything in an older format; `df -hT` adds usage.

### Mounting and unmounting

```bash
# Illustrative: needs root
sudo mkdir -p /mnt/usb
sudo mount /dev/sdb1 /mnt/usb                 # type is usually detected automatically
sudo mount -o ro /dev/sdb1 /mnt/usb           # read-only
sudo mount -t nfs fileserver:/exports/share /mnt/share
sudo umount /mnt/usb                          # note: umount, not "unmount"
```

Whatever was in `/mnt/usb` before mounting is hidden (not deleted) until you unmount.

**"target is busy"** — a process uses something under the mount point (an open file, or a shell whose current directory is inside):

```bash
# Illustrative
sudo lsof +D /mnt/usb          # or: sudo fuser -vm /mnt/usb
cd ~                           # leave the directory yourself
sudo umount /mnt/usb
```

`umount -l` (lazy) detaches immediately and cleans up when no longer busy — use with care.

### Preparing a new disk (overview)

```bash
# Illustrative: DESTRUCTIVE — double-check the device name; never practise on a real data disk
lsblk                                         # 1. identify the new, empty disk (e.g. /dev/vdb)
sudo fdisk /dev/vdb                           # 2. interactive: g (new GPT), n (new partition), w (write)
sudo mkfs.ext4 /dev/vdb1                      # 3. create a filesystem on the partition
sudo mkdir -p /data
sudo blkid /dev/vdb1                          # 4. get its UUID
echo 'UUID=<uuid> /data ext4 defaults,nofail 0 2' | sudo tee -a /etc/fstab
sudo mount -a && df -h /data                  # 5. mount from fstab and verify
```

> [!CAUTION]
> `fdisk`, `parted`, `mkfs` and `dd` operate on whole devices with no undo. Running `mkfs` on the wrong device (for example `/dev/vda` instead of `/dev/vdb`) destroys the operating system. Confirm the target with `lsblk` immediately before, prefer device paths you have just verified, and practise only in a VM with throwaway disks.

`fdisk -l` (read-only) lists partition tables; `parted` and `gdisk` are alternatives for GPT. Growing a filesystem after enlarging a disk uses `growpart` then `resize2fs` (ext4) or `xfs_growfs` (xfs).

### Swap

```bash
# Illustrative
swapon --show
free -h
```

**Output (varies):**

```text
NAME     TYPE      SIZE USED PRIO
/dev/sdc partition   2G   0B   -2
```

Swap is disk space used as overflow memory; heavy swapping makes systems very slow.

## Examples

### A USB stick

```bash
# Illustrative
lsblk                         # the stick appears, e.g. sdb with partition sdb1
sudo mount /dev/sdb1 /mnt/usb
cp report.pdf /mnt/usb/
sudo umount /mnt/usb          # flushes pending writes; only then remove the stick
```

Desktop systems mount removable media automatically under `/media/<user>/<label>`.

### Why mount options matter

Mounting `/tmp` with `noexec,nosuid,nodev` prevents running programs dropped there by an attacker — and explains why a script in `/tmp` fails with "Permission denied" even with `chmod +x`.

## Comparison

### mount vs /etc/fstab

| | `mount` command | `/etc/fstab` entry |
|---|---|---|
| Lasts | Until unmount or reboot | Every boot |
| Typical use | Testing, temporary media | Permanent disks and shares |
| Apply without reboot | Immediate | `sudo mount -a` |

### ext4 vs xfs

| | ext4 | xfs |
|---|---|---|
| Default on | Debian, Ubuntu | RHEL, Rocky, Alma |
| Grow online | Yes | Yes |
| Shrink | Yes (unmounted) | No |
| Strengths | General purpose, mature | Large files, parallel I/O, big filesystems |
| Repair tool | `e2fsck` | `xfs_repair` |

### Partition vs filesystem vs mount point

| Term | Is | Example |
|------|----|---------|
| Partition | A region of a disk | `/dev/vdb1` |
| Filesystem | The structure written into it | ext4 |
| Mount point | The directory where it is attached | `/data` |

## Common Mistakes

- Running `mkfs` or `fdisk` on the wrong device.
- Using `/dev/sdX` names in fstab instead of UUIDs; device names can change.
- Rebooting after editing fstab without testing with `mount -a` / `findmnt --verify`.
- Forgetting `nofail` on non-critical disks, so a missing disk blocks the boot.
- Writing data into a mount-point directory while the disk is not mounted — it lands on the root filesystem and is hidden later.
- Pulling a USB stick without `umount` (data still in the write cache).
- Typing `unmount` — the command is `umount`.

## Key Takeaways

- Disk → partition (MBR/GPT) → filesystem (ext4, xfs…) → mounted on a directory in the single tree.
- `lsblk`, `lsblk -f`, `blkid`, `findmnt`, `df -hT` show devices, filesystems, UUIDs and mounts.
- `mount DEVICE DIR` / `umount DIR`; "target is busy" → `lsof +D DIR` / `fuser -vm DIR`.
- `/etc/fstab` with UUIDs and `nofail` makes mounts permanent; test with `mount -a` before rebooting.
- `fdisk`, `mkfs`, `dd` are destructive — verify the device with `lsblk` first.

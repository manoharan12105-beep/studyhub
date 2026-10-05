# The Linux Filesystem Hierarchy

**Module:** Filesystem and Navigation · **Interview priority:** Core

## What Is It?

Linux has **one directory tree** that starts at the **root directory** `/`. There are no drive letters: every disk, USB stick and network share is attached (**mounted**) somewhere inside this tree. The **Filesystem Hierarchy Standard (FHS)** describes what each top-level directory is for, so a Linux administrator can find configuration, logs and programs on almost any distribution.

```text
/
├── bin  → usr/bin      essential user commands (ls, cp, bash)
├── boot                kernel and boot loader files
├── dev                 device files (disks, terminals, /dev/null)
├── etc                 system-wide configuration
├── home                users' home directories (/home/student)
├── lib  → usr/lib      shared libraries and kernel modules
├── media               auto-mounted removable media
├── mnt                 temporary manual mounts
├── opt                 optional, self-contained third-party software
├── proc                virtual: processes and kernel information
├── root                root user's home directory
├── run                 runtime data since boot (PID files, sockets)
├── sbin → usr/sbin     system administration commands
├── srv                 data served by this machine (some setups)
├── sys                 virtual: devices and kernel settings
├── tmp                 temporary files, writable by everyone
├── usr                 installed software: programs, libraries, docs
└── var                 variable data: logs, caches, databases, spools
```

## Why It Matters

- Troubleshooting starts with knowing where to look: configuration in `/etc`, logs in `/var/log`, application data in `/var/lib`.
- Disk-full incidents almost always involve `/var` (logs, databases, container images) or `/tmp`.
- Interviewers ask "what is in `/etc`?", "difference between `/bin` and `/sbin`?", "what is `/proc`?".

## Core Concept

### The important directories

| Directory | Purpose | Practical example |
|-----------|---------|-------------------|
| `/` | Root of the whole tree | Every absolute path starts here |
| `/home` | One directory per normal user | `/home/student` (shown as `~`) |
| `/root` | Home of the root user — **not** under `/home` | Accessible only by root |
| `/bin` | Essential commands for all users | `ls`, `cp`, `cat`, `bash` |
| `/sbin` | System administration commands | `ip`, `fdisk`, `mkfs`, `reboot` |
| `/usr` | Installed software, read-only in normal use | `/usr/bin` (most commands), `/usr/lib`, `/usr/share/man` |
| `/usr/local` | Software you install by hand (not by the package manager) | `/usr/local/bin/mytool` |
| `/etc` | System-wide configuration files (text) | `/etc/passwd`, `/etc/hosts`, `/etc/ssh/sshd_config`, `/etc/nginx/` |
| `/var` | Data that changes while the system runs | `/var/log` (logs), `/var/lib/postgresql` (database files), `/var/cache/apt`, `/var/spool/cron` |
| `/tmp` | Temporary files for any user | Often cleared at boot; may be in RAM (`tmpfs`) |
| `/dev` | Device files created by the kernel | `/dev/sda` (disk), `/dev/null`, `/dev/zero`, `/dev/random`, `/dev/tty` |
| `/proc` | Virtual filesystem: one folder per process plus kernel data | `/proc/1234/`, `/proc/cpuinfo`, `/proc/meminfo` |
| `/sys` | Virtual filesystem: devices, drivers, kernel parameters | `/sys/class/net/eth0/` |
| `/opt` | Add-on packages kept in their own directory | `/opt/google/chrome`, `/opt/jdk-21` |
| `/mnt` | Mount point for temporary, manual mounts | `mount /dev/sdb1 /mnt` |
| `/media` | Mount points for removable media, created automatically | `/media/student/USB_DRIVE` |
| `/boot` | Kernel images, initramfs, GRUB configuration | `vmlinuz-6.x`, `grub/grub.cfg` |
| `/run` | Runtime state since the last boot (tmpfs) | `/run/sshd.pid`, sockets |

### `/bin` vs `/sbin` vs `/usr/bin` — and "merged /usr"

Historically `/bin` and `/sbin` held the small set of commands needed to boot and repair the system before `/usr` (often a separate disk) was mounted, while `/usr/bin` and `/usr/sbin` held everything else. `sbin` directories hold administration commands, mostly used by root.

Modern distributions (Fedora, Debian, Ubuntu, Arch) have **merged** them: `/bin`, `/sbin` and `/lib` are symbolic links into `/usr`.

```bash
# Illustrative: merged /usr on Ubuntu
ls -ld /bin /sbin /lib
```

**Output (varies):**

```text
lrwxrwxrwx 1 root root 7 Apr 20 08:46 /bin -> usr/bin
lrwxrwxrwx 1 root root 7 Apr 20 08:46 /lib -> usr/lib
lrwxrwxrwx 1 root root 8 Apr 20 08:46 /sbin -> usr/sbin
```

The `l` at the start and the `->` arrow mark symbolic links.

### `/etc`: configuration lives in text files

Almost every service is configured by editing a text file under `/etc`, which is why Linux administration is so scriptable:

| File | Contains |
|------|----------|
| `/etc/passwd` | User accounts (no passwords despite the name) |
| `/etc/shadow` | Password hashes — readable only by root |
| `/etc/group` | Groups and their members |
| `/etc/hosts` | Static hostname → IP mappings, checked before DNS |
| `/etc/resolv.conf` | DNS servers |
| `/etc/fstab` | Filesystems to mount at boot |
| `/etc/crontab`, `/etc/cron.d/` | System scheduled jobs |
| `/etc/ssh/sshd_config` | SSH server settings |
| `/etc/systemd/system/` | Local systemd unit files and overrides |
| `/etc/os-release` | Distribution name and version |

### `/var`: the directory that fills up

| Path | Holds |
|------|-------|
| `/var/log` | System and application logs (`syslog` or `messages`, `auth.log` or `secure`, `nginx/`) |
| `/var/lib` | Persistent application state: databases (`postgresql/`, `mysql/`), `docker/`, package database (`dpkg/`) |
| `/var/cache` | Re-creatable caches (`apt/archives` holds downloaded packages) |
| `/var/spool` | Queues waiting to be processed (mail, print, cron tabs) |
| `/var/tmp` | Temporary files that should survive a reboot |

### `/tmp` vs `/var/tmp`

Both are world-writable with the sticky bit (users cannot delete each other's files). `/tmp` is commonly cleared at boot and may live in RAM; `/var/tmp` is kept across reboots. Neither is a place for data you need to keep.

### `/proc` and `/sys`: windows into the kernel

These are **virtual filesystems** — nothing is stored on disk; the kernel generates the content when you read it.

```bash
grep -c processor /proc/cpuinfo
grep MemTotal /proc/meminfo
```

**Output (varies):**

```text
12
MemTotal:        7975568 kB
```

The first line counts CPU cores the kernel sees; the second is total RAM. Every running process has a directory `/proc/<PID>/` with its command line (`cmdline`), environment, open files (`fd/`) and status.

### File types

Everything in the tree is a file of some type. The first character of `ls -l` shows which:

| Char | Type | Example |
|------|------|---------|
| `-` | Regular file | `notes.txt`, `/usr/bin/ls` |
| `d` | Directory | `/etc` |
| `l` | Symbolic link | `/bin -> usr/bin` |
| `c` | Character device (byte stream) | `/dev/null`, `/dev/tty` |
| `b` | Block device (blocks, e.g. disks) | `/dev/sda` |
| `p` | Named pipe (FIFO) | created with `mkfifo` |
| `s` | Socket | `/run/systemd/notify` |

```bash
# Illustrative: device files
ls -l /dev/null /dev/sda
```

**Output (varies):**

```text
crw-rw-rw- 1 root root 1, 3 Oct  5 09:28 /dev/null
brw-rw---- 1 root disk 8, 0 Oct  5 09:28 /dev/sda
```

Device files show two numbers (major, minor) instead of a size: they identify the driver and the device.

## Examples

### Find where things live

| Question | Where to look |
|----------|---------------|
| "Where is nginx configured?" | `/etc/nginx/nginx.conf` and `/etc/nginx/sites-enabled/` (Ubuntu) |
| "Why did SSH reject my login?" | `/var/log/auth.log` (Debian/Ubuntu) or `/var/log/secure` (RHEL), or `journalctl -u ssh` |
| "Where does PostgreSQL keep its data?" | `/var/lib/postgresql/<version>/main` (Ubuntu) |
| "Where is the `java` binary?" | `which java` → often `/usr/bin/java`, a link managed by `alternatives` into `/usr/lib/jvm/` |
| "Where should I install a vendor's tarball?" | `/opt/<vendor>` or `/usr/local` |
| "Where do I put a quick test file?" | `/tmp` (or your home directory) |

### Explore the top level

```bash
ls /
```

**Output (varies):**

```text
bin   dev  home  lib    lost+found  mnt  proc  run   snap  sys  usr
boot  etc  init  lib64  media       opt  root  sbin  srv   tmp  var
```

`lost+found` is where filesystem repair (`fsck`) puts recovered fragments; `snap` exists on Ubuntu for snap packages; `init` here is specific to WSL.

## Comparison

### Linux vs Windows layout

| Need | Linux | Windows |
|------|-------|---------|
| Programs | `/usr/bin`, `/opt` | `C:\Program Files` |
| Configuration | `/etc` (text files) | Registry, `C:\ProgramData` |
| User files | `/home/<user>` | `C:\Users\<user>` |
| Logs | `/var/log` | Event Viewer |
| Temporary | `/tmp` | `%TEMP%` |
| Another disk | Mounted anywhere, e.g. `/mnt/data` | New drive letter `D:\` |

## Common Mistakes

- Looking for root's files in `/home/root`. Root's home is `/root`.
- Editing files under `/usr` by hand. They are owned by the package manager and get overwritten on upgrade; put local changes in `/etc` or `/usr/local`.
- Storing important data in `/tmp`. It is cleared at boot on many systems.
- Running `du` across `/` and including `/proc`: it is virtual and produces errors and nonsense sizes. Use `du -x` to stay on one filesystem.
- Deleting "big" files in `/var/lib` to free space — that is where databases live. Look in `/var/log` and `/var/cache` first.

## Key Takeaways

- One tree from `/`; disks are mounted into it, not given letters.
- `/etc` config · `/var` changing data (logs, databases) · `/usr` installed software · `/home` users · `/root` root's home · `/tmp` temporary.
- `/dev` holds device files; `/proc` and `/sys` are virtual views of the kernel.
- `/bin`, `/sbin`, `/lib` are symlinks into `/usr` on modern distributions; `sbin` = admin commands.
- `/opt` and `/usr/local` are for software not managed by the package manager.
- `ls -l` type characters: `- d l c b p s`.

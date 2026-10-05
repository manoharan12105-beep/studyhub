# The Linux Filesystem Hierarchy — Practice

### P1. Where is the configuration?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** /etc

You need to change the SSH server's port. In which directory is its configuration file?

- A) `/var/ssh`
- B) `/usr/bin`
- C) `/etc/ssh`
- D) `/home/ssh`

<details>
<summary>Answer</summary>

**Answer:** C) `/etc/ssh`

**Explanation:** System-wide configuration lives in `/etc`; the server's file is `/etc/ssh/sshd_config`.

</details>

### P2. Where are the logs?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** /var/log

Which directory holds system and service logs on a traditional Linux system?

- A) `/var/log`
- B) `/etc/log`
- C) `/tmp/log`
- D) `/proc/log`

<details>
<summary>Answer</summary>

**Answer:** A) `/var/log`

**Explanation:** Logs change constantly, so they belong in `/var` (variable data). systemd's journal also keeps persistent logs in `/var/log/journal`.

</details>

### P3. Match the directory

**Difficulty:** Easy · **Type:** Conceptual · **Concepts:** FHS

Match each item to its directory: (1) the root user's files, (2) disk device files, (3) a vendor's self-contained application, (4) downloaded package cache, (5) live information about process 4242.

<details>
<summary>Answer</summary>

1. `/root`
2. `/dev` (e.g. `/dev/sda`)
3. `/opt` (e.g. `/opt/vendor-app`)
4. `/var/cache` (e.g. `/var/cache/apt/archives`)
5. `/proc/4242/`

</details>

### P4. File types

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** ls -l type character

A line of `ls -l` starts with `brw-rw----`. What kind of file is it?

- A) A directory
- B) A symbolic link
- C) A block device such as a disk
- D) A broken file

<details>
<summary>Answer</summary>

**Answer:** C) A block device such as a disk

**Explanation:** `b` = block device. `d` is a directory and `l` a symbolic link.

</details>

### P5. Count CPUs from /proc

**Difficulty:** Medium · **Type:** Command · **Concepts:** /proc

Write a command that prints the number of CPU cores the kernel reports, using only `/proc` and `grep`. Name one other command that answers the same question.

<details>
<summary>Answer</summary>

```bash
grep -c processor /proc/cpuinfo
```

`-c` counts matching lines; each core has a `processor : N` line. The `nproc` command prints the same number (the cores available to the current process).

</details>

### P6. The disk is full

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** /var

`df -h` shows `/` at 100 %. Which directories do you investigate first, and which should you avoid deleting from blindly?

<details>
<summary>Answer</summary>

Investigate `/var/log` (growing logs), `/var/cache` (package caches — `apt clean` is safe), `/tmp` and `/var/tmp`, `/home` (user downloads), and `/var/lib/docker` (images and containers — clean with Docker's own commands). Do not delete blindly from `/var/lib` (databases, package database) or `/usr` (installed software). See [Troubleshooting Disk and Files](../../troubleshooting/troubleshooting-disk-and-files/content.md).

</details>

### P7. Installing by hand

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** /opt, /usr/local, /usr

You download a vendor's JDK as a tarball. A colleague suggests extracting it into `/usr/lib/jvm` next to the packaged JDKs. Is there a better location, and why?

<details>
<summary>Answer</summary>

Use `/opt` (e.g. `/opt/jdk-21`) — or `/usr/local` for a hand-built tool. `/usr` is managed by the package manager; files you add there can collide with or be removed by package upgrades, and nobody knows which files came from where. Then put its `bin` directory on `PATH` or register it with `update-alternatives`.

</details>

### P8. Recover a deleted log

**Difficulty:** Hard · **Type:** Troubleshooting · **Concepts:** /proc/PID/fd

Someone deleted `/opt/app/app.log` while the application (PID 2001) was still writing to it. The space was not freed and the team wants a copy of the log. What do you do?

<details>
<summary>Answer</summary>

The process still has the file open, so its data is reachable through `/proc`:

```bash
# Illustrative: needs permission to read the process's files
ls -l /proc/2001/fd | grep deleted
cp /proc/2001/fd/<n> /tmp/app.log.recovered
```

The space is freed only when the process closes the file — restart the application, or truncate the open file with `: > /proc/2001/fd/<n>` once you have your copy.

</details>

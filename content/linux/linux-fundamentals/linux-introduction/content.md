# What Is Linux?

**Module:** Linux Fundamentals · **Interview priority:** Core

## What Is It?

**Linux** is, strictly, a **kernel** — the core program that controls the CPU, memory, disks, network cards and every other piece of hardware, and lets other programs use them safely. Linus Torvalds started it in 1991 as a free, Unix-like kernel, and it is released under the GNU General Public License version 2.

In everyday speech, "Linux" means a complete **operating system** built around that kernel: the kernel plus a shell, core command-line tools, libraries, a package manager and usually much more. Many of those tools come from the **GNU project** (bash, coreutils such as `ls` and `cp`, the C library glibc, the gcc compiler), which is why the whole system is sometimes called **GNU/Linux**.

A **distribution** ("distro") is a ready-to-install bundle of the kernel, tools, a package manager, default configuration and support policy — Ubuntu, Debian, Fedora, Red Hat Enterprise Linux, Alpine and so on.

## Why It Matters

- Most servers on the internet, most cloud virtual machines, nearly all containers and every one of the TOP500 supercomputers run Linux. Android phones run the Linux kernel.
- Backend code you write — a Spring Boot service, a database, a message broker — is usually deployed to Linux. Debugging it in production means using the Linux command line.
- DevOps tools (Docker, Kubernetes, CI runners, Ansible, cloud CLIs) assume Linux knowledge.
- Interviews for backend, DevOps and support roles routinely include Linux questions: permissions, processes, logs, networking commands and troubleshooting.

## Core Concept

### Kernel vs operating system

| | Kernel | Operating system (distribution) |
|---|---|---|
| What | The core program running in privileged mode | Kernel + shell + tools + libraries + package manager + services |
| Examples | Linux 6.x | Ubuntu 24.04, RHEL 9, Debian 12 |
| You interact with it | Indirectly, through system calls | Directly: shell, commands, desktop |
| Responsible for | Processes, memory, devices, filesystems, networking, security checks | User experience, software installation, configuration, updates |

The kernel alone cannot do anything useful for a user — there is no shell to type into. A distribution is what you actually install.

### What the kernel does

- **Process management** — creates processes, schedules them on CPU cores, delivers signals.
- **Memory management** — gives every process its own virtual address space, swaps, enforces isolation.
- **Device drivers** — talks to disks, network cards, USB devices, GPUs.
- **Filesystems** — ext4, XFS, Btrfs and others behind one interface.
- **Networking** — the TCP/IP stack, sockets, firewall (netfilter).
- **System calls** — the controlled entry points (`open`, `read`, `write`, `fork`, `execve`, …) through which programs ask for all of the above.
- **Security** — users, permissions, capabilities, namespaces and cgroups (the building blocks of containers).

### Linux vs Unix

**Unix** was created at Bell Labs around 1969–1971 by Ken Thompson and Dennis Ritchie and rewritten in C in 1973. Its ideas — everything is a file, small tools that do one thing, pipes connecting them, a hierarchical filesystem, multi-user permissions — shaped every later system.

| | Unix | Linux |
|---|---|---|
| Origin | AT&T Bell Labs, 1969 onwards | Linus Torvalds, 1991 (kernel) |
| Code | Proprietary descendants (AIX, HP-UX, Solaris) and BSD descendants (FreeBSD, macOS's Darwin) | Written from scratch; no original Unix code |
| License | Mostly proprietary; BSDs use permissive licenses | Kernel under GPLv2 (free and open source) |
| Certification | "UNIX" is a trademark; certified systems include AIX and macOS | **Unix-like**; distributions are generally not certified |
| Hardware | Often tied to a vendor's hardware | Runs on almost anything: phones, routers, laptops, servers, mainframes |

Linux follows the **POSIX** standards (a common interface for Unix-like systems), so most shell scripts and C programs move between Linux, BSD and macOS with few changes. The visible differences are in tool options: macOS ships BSD versions of `sed`, `ls` and `date`, whose flags differ from the GNU versions on Linux.

### Distributions

| Family | Distributions | Package format · manager | Typical use |
|--------|---------------|--------------------------|-------------|
| Debian | Debian, Ubuntu, Linux Mint | `.deb` · `apt` | Desktops, cloud servers, WSL, CI runners |
| Red Hat | RHEL, Fedora, CentOS Stream, Rocky Linux, AlmaLinux | `.rpm` · `dnf` (older: `yum`) | Enterprise servers |
| SUSE | openSUSE, SLES | `.rpm` · `zypper` | Enterprise servers (Europe) |
| Arch | Arch Linux, Manjaro | `pacman` | Enthusiast desktops, rolling release |
| Alpine | Alpine Linux | `apk` | Small container images (uses musl libc and BusyBox) |

Distributions differ in package manager, release cycle (fixed **LTS** releases vs **rolling** releases), default configuration and commercial support. The kernel, the shell and the core commands are the same, which is why skills transfer between them.

### Why Linux won on servers

- Free to run on any number of machines; no licence cost per server.
- Open source: bugs are visible and fixable, behaviour is inspectable.
- Stable and efficient: runs for months without reboots, needs no GUI.
- Fully scriptable from the command line, so thousands of machines can be automated.
- Strong multi-user security model and isolation features (namespaces, cgroups) that enable containers.

## Commands

### Identify the system

**Purpose:** find out which kernel and distribution a machine runs — the first thing to check on an unfamiliar server.

```bash
uname -r
```

**Output (varies):**

```text
6.18.33.2-microsoft-standard-WSL2
```

`uname -r` prints the kernel release; `uname -a` prints all fields (kernel name, hostname, release, version, architecture).

```bash
uname -s -m
```

**Output (varies):**

```text
Linux x86_64
```

The distribution is described in `/etc/os-release`, a small key=value file present on all modern distributions:

```bash
grep -E '^(NAME|VERSION_ID)=' /etc/os-release
```

**Output (varies):**

```text
NAME="Ubuntu"
VERSION_ID="26.04"
```

| Command | Shows |
|---------|-------|
| `uname -r` | Kernel release |
| `uname -m` | Hardware architecture (`x86_64`, `aarch64`) |
| `uname -a` | Everything `uname` knows |
| `cat /etc/os-release` | Distribution name, version, ID |
| `hostnamectl` | Hostname, OS, kernel, architecture (systemd systems) |

## Comparison

### Linux, Windows and macOS for a developer

| Aspect | Linux | Windows | macOS |
|--------|-------|---------|-------|
| Kernel | Linux (monolithic, modular) | Windows NT | XNU (Darwin, Unix-certified) |
| Default shell | bash (often) | PowerShell / cmd | zsh |
| Filesystem layout | Single tree from `/` | Drive letters (`C:\`) | Single tree from `/` |
| Path separator | `/` | `\` | `/` |
| Case-sensitive filenames | Yes | No (by default) | No (by default) |
| Servers and containers | Dominant | Some (.NET, AD) | Rare |

## Common Mistakes

- Saying "Linux is an operating system" in an interview and stopping there. Say it is a kernel, and that distributions build a full OS around it.
- Calling Linux "a version of Unix". It is Unix-like and POSIX-oriented, written from scratch.
- Assuming every distribution uses `apt`. Red Hat-family systems use `dnf`/`yum`; Alpine uses `apk`.
- Assuming filenames are case-insensitive. `Report.txt` and `report.txt` are different files on Linux.
- Copying macOS command options to Linux (or back) without checking: `sed -i` and `date -d` differ.

## Key Takeaways

- Linux = the kernel (1991, Linus Torvalds, GPLv2). A distribution = kernel + GNU tools + package manager + configuration.
- The kernel manages processes, memory, devices, filesystems, networking and security; programs reach it through system calls.
- Linux is Unix-like and follows POSIX, but contains no Unix code.
- Distribution families differ mainly in package management: Debian/Ubuntu (`apt`), Red Hat (`dnf`), Alpine (`apk`).
- Check a machine with `uname -r` (kernel) and `/etc/os-release` (distribution).

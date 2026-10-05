# What Is Linux? — Interview Questions

## Beginner

### Q1. What is Linux?

<details>
<summary>Answer</summary>

Linux is an open-source, Unix-like operating system **kernel**, started by Linus Torvalds in 1991 and licensed under GPLv2. In common usage, "Linux" also means a full operating system — a **distribution** such as Ubuntu or RHEL — that combines the kernel with GNU tools, a shell, libraries, a package manager and services.

</details>

### Q2. What is the difference between the kernel and the operating system?

<details>
<summary>Answer</summary>

The kernel is the core program that runs in privileged mode and manages hardware: processes, memory, devices, filesystems, networking and security. The operating system is the kernel **plus** everything a user needs to work with it — shell, command-line tools, libraries, package manager, init system and configuration. Programs talk to the kernel through system calls; users talk to the OS through the shell or a desktop.

</details>

### Q3. What is a Linux distribution? Name a few.

<details>
<summary>Answer</summary>

A distribution packages the Linux kernel with tools, libraries, a package manager, default configuration and an update/support policy, ready to install. Examples: Ubuntu, Debian (apt, `.deb`); RHEL, Fedora, Rocky Linux, AlmaLinux (dnf, `.rpm`); Alpine (apk, used for small container images); Arch (pacman).

</details>

### Q4. Is Linux the same as Unix?

<details>
<summary>Answer</summary>

No. Unix came from Bell Labs (1969 onwards) and survives in certified commercial systems (AIX, HP-UX, macOS) and in the BSDs. Linux was written from scratch, contains no Unix code, and is **Unix-like**: it follows the same design ideas and POSIX interfaces, so commands and scripts mostly carry over. "UNIX" is a trademark for certified systems; Linux distributions are generally not certified.

</details>

### Q5. Why is Linux so widely used on servers?

<details>
<summary>Answer</summary>

No licence cost per machine, open source (inspectable and fixable), stable enough to run for months, lightweight without a GUI, fully scriptable for automation, a strong multi-user permission model, and kernel features (namespaces, cgroups) that make containers possible. The ecosystem — Docker, Kubernetes, databases, web servers — is built for Linux first.

</details>

### Q6. How do you check which kernel and distribution a server is running?

<details>
<summary>Answer</summary>

`uname -r` for the kernel release (`uname -a` for all fields) and `cat /etc/os-release` for the distribution name and version. On systemd systems, `hostnamectl` shows both.

</details>

## Intermediate

### Q7. What does GNU/Linux mean, and why do some people insist on it?

<details>
<summary>Answer</summary>

Much of the user space of a typical distribution — bash, coreutils (`ls`, `cp`, `mv`), glibc, gcc, grep, sed — comes from the GNU project started by Richard Stallman in 1983. "GNU/Linux" credits both parts: the GNU tools and the Linux kernel. Not every Linux system uses GNU user space: Alpine uses BusyBox and musl, and Android uses its own.

</details>

### Q8. What are the main responsibilities of the Linux kernel?

<details>
<summary>Answer</summary>

Process management and scheduling, memory management (virtual memory, isolation between processes), device drivers, filesystems, networking (TCP/IP stack, sockets, firewall hooks), the system-call interface, and security enforcement (users, permissions, capabilities, namespaces, cgroups).

</details>

### Q9. What is POSIX and why does it matter?

<details>
<summary>Answer</summary>

POSIX is a family of IEEE standards defining a common interface for Unix-like systems: system calls and C library functions, the shell language, and standard utilities. Code and scripts written to POSIX run on Linux, the BSDs and macOS with little change. Non-POSIX extensions (GNU-only options, bash-only syntax) are where portability breaks.

</details>

### Q10. How do Debian-based and Red Hat-based distributions differ in practice?

<details>
<summary>Answer</summary>

Mostly in packaging and conventions: Debian/Ubuntu use `.deb` packages and `apt`; RHEL/Fedora/Rocky use `.rpm` and `dnf` (formerly `yum`). Some file locations and defaults differ (for example the Apache service is `apache2` on Ubuntu and `httpd` on RHEL; RHEL enables SELinux by default, Ubuntu uses AppArmor). The kernel, shell, core commands and systemd work the same.

</details>

## Advanced

### Q11. A script works on your Mac but fails on a Linux server with "invalid option". What is the likely cause?

<details>
<summary>Answer</summary>

macOS ships BSD versions of many utilities, whose options differ from the GNU versions on Linux. Classic examples: `sed -i ''` (BSD) vs `sed -i` (GNU), `date -d` (GNU only), `stat -f` (BSD) vs `stat -c` (GNU). Fix by writing to POSIX options, detecting the platform, or installing GNU tools on the Mac — and test scripts on the target OS.

</details>

### Q12. Why do container images often use Alpine, and what can go wrong?

<details>
<summary>Answer</summary>

Alpine images are very small (a few MB) because they use BusyBox utilities and the musl C library instead of GNU coreutils and glibc. Problems: binaries compiled against glibc may not run; BusyBox tools support fewer options than GNU tools; DNS resolution and some locale behaviour differ from glibc. Teams often use Debian "slim" images when compatibility matters more than size.

</details>

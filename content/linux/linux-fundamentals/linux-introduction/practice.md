# What Is Linux? — Practice

### P1. Kernel or not?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** kernel vs OS

Which of these is the job of the Linux **kernel** rather than of a user-space tool?

- A) Listing files in a directory in columns
- B) Deciding which process runs on a CPU core next
- C) Installing a package from a repository
- D) Showing a coloured shell prompt

<details>
<summary>Answer</summary>

**Answer:** B) Deciding which process runs on a CPU core next

**Explanation:** Scheduling is a core kernel function. Listing files (`ls`), installing packages (`apt`) and drawing the prompt (bash) are user-space programs that ask the kernel for services through system calls.

</details>

### P2. Package manager by family

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** distributions

You log in to a Rocky Linux server. Which command installs software?

- A) `apt install nginx`
- B) `dnf install nginx`
- C) `apk add nginx`
- D) `pacman -S nginx`

<details>
<summary>Answer</summary>

**Answer:** B) `dnf install nginx`

**Explanation:** Rocky Linux is in the Red Hat family, which uses RPM packages managed by `dnf` (older releases: `yum`). `apt` is Debian/Ubuntu, `apk` is Alpine, `pacman` is Arch.

</details>

### P3. Identify the server

**Difficulty:** Easy · **Type:** Command · **Concepts:** uname, os-release

Write the commands that print (a) the kernel release and (b) the distribution name and version.

<details>
<summary>Answer</summary>

```bash
uname -r
cat /etc/os-release
```

`hostnamectl` also shows both on systemd-based systems.

</details>

### P4. Unix or Unix-like?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** Linux vs Unix

Which statement is accurate?

- A) Linux is a modified version of AT&T Unix source code.
- B) Linux is Unix-like: written from scratch, following Unix design and POSIX interfaces.
- C) Linux and Unix are two names for the same operating system.
- D) Linux cannot run shell scripts written for Unix.

<details>
<summary>Answer</summary>

**Answer:** B) Linux is Unix-like: written from scratch, following Unix design and POSIX interfaces.

**Explanation:** Linux contains no Unix code (A is false). Most POSIX shell scripts run unchanged (D is false).

</details>

### P5. Case sensitivity

**Difficulty:** Easy · **Type:** Conceptual · **Concepts:** Linux filesystem behaviour

A developer on Windows commits `Config.java` and their code loads `config.java`. It works on their laptop and fails on the Linux build server. Why?

<details>
<summary>Answer</summary>

Linux filesystems are case-sensitive: `Config.java` and `config.java` are different names, so the file is not found. Windows (and macOS by default) treat them as the same name, which hid the bug. Always match case exactly.

</details>

### P6. Choosing a base image

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** Alpine, glibc vs musl

A team switches their Docker base image from Debian slim to Alpine to save space. A prebuilt native library now fails to load with "not found" even though the file exists. What is the most likely reason?

<details>
<summary>Answer</summary>

The library was compiled against **glibc**, and Alpine uses **musl** libc. The dynamic loader cannot find the glibc symbols or loader the binary expects, and reports the file as "not found". Use a glibc-based image (Debian slim), install a compatibility layer, or rebuild the library for musl.

</details>

### P7. Portable script

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** GNU vs BSD tools

This line runs on a Linux CI runner but fails on a developer's Mac:

```bash
# Illustrative: GNU-only option
date -d '7 days ago' +%F
```

Explain the failure and one way to fix it.

<details>
<summary>Answer</summary>

`date -d` is a GNU coreutils option. macOS ships BSD `date`, where `-d` means something else (and relative dates use `-v-7d`). Fixes: install GNU coreutils on the Mac (`gdate`), compute the date in a language runtime, or branch on `uname -s` in the script.

</details>

### P8. What a distribution adds

**Difficulty:** Medium · **Type:** Conceptual · **Concepts:** distributions

Name four things a distribution adds on top of the kernel, and one way two distributions can differ even though both run the same kernel version.

<details>
<summary>Answer</summary>

Any four of: a shell and core utilities, the C library, a package manager and repositories, an init system (systemd), default configuration, an installer, security updates and a support lifecycle, a desktop environment. Two distributions can differ in package format and manager (`apt` vs `dnf`), release model (LTS vs rolling), security framework (AppArmor vs SELinux) or default service names.

</details>

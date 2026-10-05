# Linux Architecture — Practice

### P1. Where does it run?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** user space vs kernel space

Which of these runs in **kernel space**?

- A) bash
- B) The ext4 filesystem driver
- C) The `grep` command
- D) A Spring Boot application

<details>
<summary>Answer</summary>

**Answer:** B) The ext4 filesystem driver

**Explanation:** Filesystems and device drivers are part of the kernel (built in or loaded as modules). The shell, commands and applications are user-space programs.

</details>

### P2. The doorway

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** system calls

`cat notes.txt` prints a file. How does `cat` get the file's bytes?

- A) It reads the disk sectors directly.
- B) It asks the shell to read them.
- C) It calls `openat` and `read` system calls; the kernel checks permissions and returns the data.
- D) It loads the file through `/proc`.

<details>
<summary>Answer</summary>

**Answer:** C) It calls `openat` and `read` system calls; the kernel checks permissions and returns the data.

**Explanation:** User programs cannot access hardware directly. The shell only started `cat`; it is not involved in reading.

</details>

### P3. Builtin or program?

**Difficulty:** Easy · **Type:** Output · **Concepts:** shell builtins, PATH

What does this print?

```bash
type pwd echo ls
```

<details>
<summary>Answer</summary>

**Output:**

```text
pwd is a shell builtin
echo is a shell builtin
ls is /usr/bin/ls
```

`pwd` and `echo` are built into bash (a separate `/usr/bin/echo` also exists, but the builtin wins). `ls` is an external program found through `$PATH`.

</details>

### P4. Order the boot

**Difficulty:** Easy · **Type:** Conceptual · **Concepts:** boot process

Put these in boot order: systemd starts services · GRUB loads the kernel · login prompt · firmware (UEFI) runs · kernel mounts the root filesystem.

<details>
<summary>Answer</summary>

Firmware (UEFI) runs → GRUB loads the kernel → kernel mounts the root filesystem → systemd starts services → login prompt.

</details>

### P5. Size zero

**Difficulty:** Medium · **Type:** Conceptual · **Concepts:** virtual filesystems

`ls -l /proc/meminfo` shows a size of 0, yet `cat /proc/meminfo` prints many lines. Explain.

<details>
<summary>Answer</summary>

`/proc` is a virtual filesystem. Its files are not stored anywhere; the kernel generates their content at the moment they are read, so there is no stored size to report.

</details>

### P6. Crash scope

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** process isolation

A Java service on a shared server dies with a segmentation fault in a native library. A colleague worries that the whole server is unstable. What do you tell them?

<details>
<summary>Answer</summary>

A segmentation fault is the CPU and kernel stopping one process from touching memory it does not own. The kernel kills only that process (signal `SIGSEGV`) and reclaims its resources; other processes and the kernel are unaffected. Investigate the library (core dump, logs), but the server itself is fine — unlike a kernel panic.

</details>

### P7. fork and exec

**Difficulty:** Medium · **Type:** MCQ · **Concepts:** process creation

When bash runs the external command `ls`, which sequence happens?

- A) `execve` in bash itself, then `fork`
- B) `fork` creates a child, the child calls `execve` to become `ls`, bash `wait`s
- C) bash loads `ls` as a library and calls its main function
- D) the kernel starts `ls` as PID 1

<details>
<summary>Answer</summary>

**Answer:** B) `fork` creates a child, the child calls `execve` to become `ls`, bash `wait`s

**Explanation:** If bash called `execve` itself (A), bash would be replaced and your shell would end when `ls` finished — that is what the `exec ls` builtin does.

</details>

### P8. Which file failed?

**Difficulty:** Hard · **Type:** Troubleshooting · **Concepts:** strace

A tool prints only `Error: cannot open configuration` and exits. Write a command that reveals which path it tried to open.

<details>
<summary>Answer</summary>

```bash
# Illustrative: needs the strace package
strace -f -e trace=openat ./tool 2>&1 | grep -E 'ENOENT|EACCES'
```

`strace` writes its trace to standard error, so `2>&1` sends it into the pipe. `ENOENT` means the file does not exist; `EACCES` means permission denied.

</details>

# Linux Architecture

**Module:** Linux Fundamentals · **Interview priority:** Core

## What Is It?

Linux is organised in **layers**. Hardware sits at the bottom; the **kernel** runs directly on it in a privileged CPU mode; everything else — the C library, the shell, commands, servers and your applications — runs in **user space** and reaches the hardware only by asking the kernel through **system calls**.

## Why It Matters

- It explains everyday behaviour: why a program cannot read another program's memory, why some commands need root, why a crashing application does not crash the machine.
- Interview questions such as "what happens when you type `ls`?", "what is a system call?" and "what is PID 1?" are answered with this picture.
- Troubleshooting tools map to layers: `dmesg` shows kernel messages, `strace` shows system calls, logs show application behaviour.

## Core Concept

### The layers

```text
┌──────────────────────────────────────────────────────────────┐
│ Applications      java, nginx, postgres, your scripts        │  user space
│ Shell + utilities bash, ls, grep, systemctl                  │  (unprivileged,
│ Libraries         glibc (C library), libssl, ...             │   one virtual
├──────────────────────────────────────────────────────────────┤   address space
│ System call interface   open read write fork execve kill ... │   per process)
├──────────────────────────────────────────────────────────────┤
│ Kernel   process scheduler · memory manager · VFS +          │  kernel space
│          filesystems · network stack · device drivers ·      │  (privileged)
│          security (permissions, namespaces, cgroups)         │
├──────────────────────────────────────────────────────────────┤
│ Hardware          CPU · RAM · disks · network cards · USB    │
└──────────────────────────────────────────────────────────────┘
```

### User space and kernel space

The CPU has privilege levels. Kernel code runs in the privileged mode (ring 0 on x86) and can execute any instruction and touch any memory. User programs run in the unprivileged mode: they cannot talk to devices or read memory that is not theirs. An illegal access is stopped by the hardware, and the kernel kills the process (for example with `SIGSEGV`, "Segmentation fault") — the rest of the system keeps running.

| | User space | Kernel space |
|---|---|---|
| Who runs there | Shell, commands, servers, applications | The kernel and its modules (drivers) |
| Privilege | Restricted | Full access to hardware and all memory |
| Memory | Each process has its own isolated virtual address space | Shared kernel address space |
| A bug causes | That process to crash | Possibly a whole-system crash (kernel panic) |

### System calls

A **system call** is the controlled doorway from user space into the kernel. When `cat notes.txt` runs, it does not read the disk itself. It asks:

1. `openat("notes.txt")` — the kernel checks permissions and returns a **file descriptor** (a small integer).
2. `read(fd, buffer, size)` — the kernel fetches the bytes (from the page cache or the disk driver).
3. `write(1, buffer, n)` — the kernel sends them to file descriptor 1, standard output (your terminal).
4. `close(fd)` and `exit_group(0)`.

Programs usually call system calls through the **C library** (glibc): Java's `FileInputStream`, Python's `open()` and the `ls` command all end up in the same `openat`/`read` calls. The tool `strace` prints the system calls a program makes — useful when a program fails with an unclear message (`strace -e trace=openat cat notes.txt` shows exactly which files it tried to open).

### Kernel design: monolithic, with loadable modules

Linux is a **monolithic** kernel: the scheduler, memory manager, filesystems, network stack and drivers all run in kernel space as one program, which makes calls between them fast. It is also **modular**: drivers and filesystems can be loaded and unloaded at runtime as **kernel modules** without rebooting (`lsmod` lists them; `modprobe` loads one). A **microkernel** design (e.g. MINIX, QNX) keeps only the bare minimum in the kernel and runs drivers as separate user-space servers — more isolation, more message-passing overhead.

### Everything is a file

Linux exposes many resources through the same file interface (`open`, `read`, `write`):

| Path | Is really |
|------|-----------|
| `/home/student/notes.txt` | A regular file on disk |
| `/dev/sda`, `/dev/nvme0n1` | A disk (block device) |
| `/dev/null` | A sink that discards everything written to it |
| `/dev/tty` | Your terminal |
| `/proc/1/status` | Live kernel data about process 1 (generated on read, not stored) |
| `/sys/class/net/` | Kernel view of network interfaces |

So the same tools (`cat`, `grep`, redirection) work on logs, devices and kernel information alike. Network sockets and pipes are also file descriptors, although they have no normal path.

### Boot process (overview)

1. **Firmware** (UEFI or legacy BIOS) tests the hardware and finds a boot loader.
2. **Boot loader** (usually GRUB) loads the kernel image and an **initramfs** (a small temporary root filesystem with the drivers needed to reach the real disk).
3. **Kernel** initialises memory, CPUs and drivers, mounts the real root filesystem and starts the first user-space process.
4. **init** — on most distributions **systemd** — runs as **PID 1**. It starts services (networking, logging, SSH, databases) in dependency order and adopts orphaned processes.
5. **Login**: a login prompt, SSH daemon or desktop login manager lets users in, and each login starts a shell.

### What happens when you type `ls -l` and press Enter

1. The terminal sends the characters to the shell (bash), which was waiting in `read()`.
2. Bash parses the line, expands variables and wildcards, and looks up `ls`: not an alias, function or builtin, so it searches the directories in `$PATH` and finds `/usr/bin/ls`.
3. Bash calls `fork()` to create a child process, and the child calls `execve("/usr/bin/ls", ["ls", "-l"], env)` to replace itself with the `ls` program.
4. `ls` makes system calls (`openat`, `getdents64`, `statx`, `write`) — the kernel checks permissions and reads the directory.
5. Output goes through file descriptor 1 to the terminal.
6. `ls` exits with a status code; bash, waiting in `wait()`, collects it into `$?` and prints the next prompt.

## Commands

### Look at the layers on a real system

PID 1 is the init system:

```bash
ps -p 1 -o pid,comm
```

**Output (varies):**

```text
    PID COMMAND
      1 systemd
```

The kernel's version string, read from a virtual file in `/proc`:

```bash
cat /proc/version
```

**Output (varies):**

```text
Linux version 6.18.33.2-microsoft-standard-WSL2 (root@f1bbfb02316b) (gcc (GCC) 13.2.0, GNU ld (GNU Binutils) 2.41) #1 SMP PREEMPT_DYNAMIC Thu Jun 18 21:54:43 UTC 2026
```

Which shell you are using and where a command lives:

```bash
type cd ls
```

**Output:**

```text
cd is a shell builtin
ls is /usr/bin/ls
```

Kernel messages (driver loading, out-of-memory kills, disk errors) are in the kernel ring buffer:

```bash
# Illustrative: may need root on some distributions
sudo dmesg --level=err,warn | tail -n 5
```

| Command | Layer it shows |
|---------|----------------|
| `uname -r`, `cat /proc/version` | Kernel version |
| `dmesg`, `journalctl -k` | Kernel messages |
| `lsmod`, `modinfo <name>` | Loaded kernel modules |
| `strace <command>` | System calls a program makes (install the `strace` package) |
| `ps -p 1 -o comm` | Init system (PID 1) |

## Comparison

### Monolithic vs microkernel

| | Monolithic (Linux) | Microkernel (MINIX 3, QNX) |
|---|---|---|
| Drivers, filesystems | In kernel space | In user-space server processes |
| Speed | Fast (direct function calls) | Slower (message passing) |
| A driver bug | Can crash the whole system | Restarts one server |
| Flexibility | Loadable modules | Components replaced independently |

## Common Mistakes

- Thinking the shell is part of the kernel. The shell is an ordinary user-space program; you can switch between bash, zsh and dash.
- Saying a program "reads the disk". It asks the kernel with system calls; the kernel enforces permissions and talks to the driver.
- Assuming files in `/proc` and `/sys` are stored on disk. They are generated by the kernel when read and use no disk space.
- Believing a segmentation fault means the OS crashed. Only the offending process is killed.

## Key Takeaways

- Hardware → kernel (privileged) → system call interface → libraries → shell and applications (user space).
- System calls (`openat`, `read`, `write`, `fork`, `execve`) are the only way user programs use hardware.
- Linux is a monolithic kernel with loadable modules.
- "Everything is a file": disks, terminals and kernel data are accessed through the file interface.
- Boot: firmware → GRUB → kernel + initramfs → systemd (PID 1) → services → login.
- Running a command = shell parses → finds it in `$PATH` → `fork()` → `execve()` → `wait()` → exit status in `$?`.

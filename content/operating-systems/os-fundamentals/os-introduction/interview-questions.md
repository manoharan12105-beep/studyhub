# What Is an Operating System? — Interview Questions

## Beginner

### Q1. What is an operating system?

**Style:** Direct

<details>
<summary>Answer</summary>

Software that sits between the hardware and application programs. It manages resources — CPU, memory, storage and devices — and provides services and abstractions (processes, files, sockets) so programs can use the hardware conveniently and safely. Examples: Linux, Windows, macOS, Android.

</details>

### Q2. What are the main functions of an operating system?

**Style:** Direct

<details>
<summary>Answer</summary>

Process management (creation, scheduling, synchronisation), memory management (allocation, virtual memory), file management, device/I/O management (drivers, interrupts, buffering), storage management (free space, disk scheduling), protection and security, and a user interface (shell or GUI).

</details>

### Q3. Why do we need an operating system at all?

**Style:** Why

<details>
<summary>Answer</summary>

Without one, every program would have to drive the hardware itself and share it with other programs by agreement. The OS provides a common interface to hardware, shares resources fairly and efficiently (the CPU runs another program while one waits for disk), and isolates programs so that a bug or a malicious program cannot damage the others.

</details>

## Intermediate

### Q4. What is the difference between the kernel and the operating system?

**Style:** Comparison

<details>
<summary>Answer</summary>

The kernel is the core part of the OS that stays in memory and runs in kernel mode: scheduling, memory management, device drivers, system-call handling. The operating system, in the broader sense, is the kernel plus system programs and libraries — shell, file manager, utilities, the C library. The GUI and shell are user-mode programs, not the kernel.

</details>

### Q5. "The OS is a resource manager." Explain with an example.

**Style:** How

<details>
<summary>Answer</summary>

Several programs compete for limited resources. The OS decides who gets them: the scheduler gives each process CPU time slices, the memory manager gives each process its own address space and reclaims it on exit, and the file system arbitrates disk space. Example: while a browser waits for a network reply, the scheduler gives the CPU to a compiler; when the reply arrives (an interrupt), the browser becomes ready again.

</details>

### Q6. When does the OS actually run, if user programs are using the CPU?

**Style:** Trap

<details>
<summary>Answer</summary>

The kernel is not a separate program running alongside applications all the time. It gets control on events: a **system call** (the program asks for a service), a hardware **interrupt** (timer, disk, keyboard, network) or an **exception** (page fault, divide by zero). It handles the event in kernel mode and then returns to a user program — possibly a different one, if the scheduler decides to switch. The timer interrupt guarantees the OS regains control even from a program stuck in a loop.

</details>

## Advanced

### Q7. What happens, briefly, from power-on until the OS is running?

**Style:** What happens internally

<details>
<summary>Answer</summary>

Firmware (BIOS or UEFI) runs first, tests the hardware and finds a boot device. It loads a **bootloader** (for example GRUB or Windows Boot Manager), which loads the **kernel** into memory and starts it. The kernel initialises memory management, interrupts and drivers, mounts the root file system and starts the first user process (on Linux, `init`/`systemd`, PID 1), which starts the remaining services and the login screen.

</details>

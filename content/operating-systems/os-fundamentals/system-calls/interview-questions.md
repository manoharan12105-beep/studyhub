# System Calls — Interview Questions

## Beginner

### Q1. What is a system call?

**Style:** Direct

<details>
<summary>Answer</summary>

The interface through which a user-mode program requests a service from the kernel — file I/O, process creation, memory allocation, networking. The program executes a trap instruction, the CPU switches to kernel mode, the kernel validates the request and performs it, and control returns to the program with a result.

</details>

### Q2. What are the types of system calls? Give an example of each.

**Style:** Direct

<details>
<summary>Answer</summary>

- Process control: `fork`, `exec`, `exit`, `wait`
- File management: `open`, `read`, `write`, `close`
- Device management: `ioctl`, `read`/`write` on device files
- Information maintenance: `getpid`, `time`
- Communication: `pipe`, `socket`, `shmget`
- Protection: `chmod`, `chown`

</details>

### Q3. What is the difference between a system call and a library function?

**Style:** Comparison

<details>
<summary>Answer</summary>

A library function runs entirely in user mode as an ordinary function call (`strlen`, `Math.max`). A system call transfers control to the kernel with a mode switch and is much more expensive. Some library functions are wrappers that make system calls (`printf` eventually calls `write`); many make none.

</details>

## Intermediate

### Q4. Explain step by step what happens when a program calls `read()`.

**Style:** What happens internally

<details>
<summary>Answer</summary>

1. The C library wrapper places the system-call number for `read` and the arguments (fd, buffer address, count) in registers.
2. It executes the trap instruction (`syscall` on x86-64).
3. The CPU switches to kernel mode, saves the user registers and jumps to the kernel's system-call entry.
4. The kernel looks up the number in the system-call table and calls the read handler.
5. The handler validates the file descriptor, the buffer address and the access mode, then reads from the page cache or starts disk I/O (blocking the process if it must wait).
6. Data is copied to the user buffer; the byte count (or an error) is placed in a return register.
7. A return-from-trap instruction switches back to user mode, and the wrapper returns the result (setting `errno` on error).

</details>

### Q5. What does `fork()` return, and why does it return twice?

**Style:** How

<details>
<summary>Answer</summary>

`fork()` creates a child that is a copy of the parent, and both continue from the point after the call. In the **child** it returns `0`; in the **parent** it returns the **child's PID**; on failure it returns `−1` in the parent and no child is created. It "returns twice" because after the call there are two processes, each receiving its own return value — which is how the code tells parent and child apart.

</details>

### Q6. What is the difference between `fork()` and `exec()`?

**Style:** Comparison

<details>
<summary>Answer</summary>

`fork()` creates a new process — a duplicate of the caller (modern kernels share pages copy-on-write until one side writes). `exec()` does not create a process; it replaces the current process's program image (code, data, stack) with a new program, keeping the same PID. A shell runs a command with `fork()` followed by `exec()` in the child, while the parent calls `wait()`.

</details>

### Q7. How many times is "hello" printed?

**Style:** Output/prediction

```pseudocode
fork()
fork()
print("hello")
```

<details>
<summary>Answer</summary>

**4 times.** The first `fork` creates 2 processes; each executes the second `fork`, giving 4; all 4 print. In general n sequential `fork()` calls produce 2ⁿ processes.

</details>

### Q8. How are parameters passed to a system call?

**Style:** How

<details>
<summary>Answer</summary>

Three methods: in **CPU registers** (fastest, used for most calls on x86-64 and ARM), in a **block or table in memory** whose address is passed in a register (when there are many or large parameters), or pushed onto the **stack** by the program and read by the kernel. The kernel must check that any address it receives really belongs to the calling process before using it.

</details>

## Advanced

### Q9. Why are system calls expensive, and how do programs reduce their cost?

**Style:** Follow-up

<details>
<summary>Answer</summary>

Each call needs a mode switch, saving and restoring state, argument validation, and often cache and TLB disturbance; it costs far more than a function call. Programs reduce the number of calls by **buffering** (a `BufferedWriter` or C `stdio` collects many small writes into one `write`), by reading in large blocks, by memory-mapping files (`mmap`), and by batching interfaces (`readv`/`writev`, `io_uring`). Some read-only calls such as `gettimeofday` are served in user mode through the vDSO without entering the kernel.

</details>

### Q10. A process calls `fork()` and the child exits, but the parent never calls `wait()`. What happens?

**Style:** Scenario

<details>
<summary>Answer</summary>

The child becomes a **zombie**: its resources are freed, but its process-table entry (PID and exit status) remains so the parent can collect it. Many zombies can exhaust PIDs. If the parent itself exits, the zombie is adopted by `init`/`systemd` (PID 1), which calls `wait()` and removes it. The fix is for the parent to call `wait()`/`waitpid()` or handle `SIGCHLD`.

</details>

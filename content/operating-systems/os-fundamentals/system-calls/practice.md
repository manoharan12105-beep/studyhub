# System Calls — Practice

### P1. System call or not?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** system call vs library function

Which of these is a system call on Linux?

- A) `strlen`
- B) `printf`
- C) `write`
- D) `Math.sqrt`

<details>
<summary>Answer</summary>

**Answer:** C) `write`

`strlen` and `Math.sqrt` stay in user mode; `printf` is a library function that eventually calls `write`.

</details>

### P2. Category of `wait`

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** system call types

`wait()` belongs to which category?

- A) File management
- B) Process control
- C) Device management
- D) Communication

<details>
<summary>Answer</summary>

**Answer:** B) Process control

</details>

### P3. Count the processes

**Difficulty:** Medium · **Type:** Output · **Concepts:** fork

How many processes exist (including the original) after this code runs, and how many times is "hi" printed?

```pseudocode
fork()
fork()
fork()
fork()
print("hi")
```

<details>
<summary>Answer</summary>

2⁴ = **16 processes** in total (15 new children), and **"hi" is printed 16 times** — every process executes the print.

</details>

### P4. Why buffer?

**Difficulty:** Medium · **Type:** Conceptual · **Concepts:** system-call cost

A Java program writes one million lines with an unbuffered stream, one `write` system call per line. Switching to `BufferedWriter` makes it many times faster. Why?

<details>
<summary>Answer</summary>

Each system call costs a mode switch, argument checking and state save/restore — far more than copying a line into memory. `BufferedWriter` collects lines in a user-space buffer (8 KB of characters by default) and makes one `write` per full buffer, so the number of system calls drops by orders of magnitude.

</details>

### P5. Only the child forks

**Difficulty:** Hard · **Type:** Output · **Concepts:** fork return value

How many times is "x" printed?

```pseudocode
if fork() == 0:      // only the child enters
    fork()
print("x")
```

<details>
<summary>Answer</summary>

**3 times.** The first `fork` gives a parent and a child. The parent gets a PID (not 0) and skips the block. The child enters and forks again, giving two processes. Parent + child + grandchild = 3 processes, each printing once.

</details>

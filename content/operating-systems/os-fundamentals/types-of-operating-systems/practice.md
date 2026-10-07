# Types of Operating Systems — Practice

### P1. Goal of multiprogramming

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** multiprogramming

The main goal of multiprogramming is to:

- A) Give each user a quick response
- B) Keep the CPU busy as much as possible
- C) Run programs on several CPUs
- D) Meet hard deadlines

<details>
<summary>Answer</summary>

**Answer:** B) Keep the CPU busy as much as possible

Quick response is the goal of time-sharing (multitasking); several CPUs is multiprocessing; deadlines are real-time.

</details>

### P2. Classify the system

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** real-time systems

A car's anti-lock braking controller must react within 5 ms every time. Which type of OS fits?

- A) Batch
- B) Soft real-time
- C) Hard real-time
- D) Network OS

<details>
<summary>Answer</summary>

**Answer:** C) Hard real-time

A late reaction is a failure, not a quality drop, so the deadline is hard.

</details>

### P3. One core, many apps

**Difficulty:** Easy · **Type:** Conceptual · **Concepts:** multitasking, concurrency

A laptop with a single-core CPU plays music while the user types in an editor. Is this multitasking, multiprocessing, or both? Concurrency or parallelism?

<details>
<summary>Answer</summary>

**Multitasking** only — one CPU interleaves the two programs in short time slices. It is **concurrency**, not parallelism, because at any instant only one instruction stream runs.

</details>

### P4. Which switching rule?

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** multiprogramming vs multitasking

Program A computes for 10 seconds without any I/O. Program B is an editor waiting for keystrokes. On a pure multiprogramming system, what does the editor user experience while A runs? What changes under time-sharing?

<details>
<summary>Answer</summary>

Pure multiprogramming switches only when the running program waits for I/O, so A keeps the CPU for all 10 seconds and the editor freezes. Time-sharing adds a timer: A is preempted every time slice, so B gets the CPU within milliseconds of a key press and feels responsive.

</details>

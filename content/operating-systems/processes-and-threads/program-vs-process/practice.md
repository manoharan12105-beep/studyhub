# Program vs Process — Practice

### P1. Passive or active?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** program vs process

Which statement is correct?

- A) A program is active; a process is passive
- B) A program is a passive file; a process is a program in execution
- C) A program and a process are the same thing
- D) A process exists only on disk

<details>
<summary>Answer</summary>

**Answer:** B) A program is a passive file; a process is a program in execution

</details>

### P2. Where does it live?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** process memory layout

A local variable inside a method that is currently executing is stored in the:

- A) Text section
- B) Data section
- C) Heap
- D) Stack

<details>
<summary>Answer</summary>

**Answer:** D) Stack

Each call gets a stack frame holding its local variables, parameters and return address.

</details>

### P3. Zombie or orphan?

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** zombie, orphan

(a) A child process exits; its parent is busy and never calls `wait()`. (b) A parent process crashes while its child is still running. Name each situation and say what eventually happens.

<details>
<summary>Answer</summary>

(a) **Zombie** — the child stays in the process table until the parent calls `wait()`; if the parent exits, PID 1 adopts and reaps it. (b) **Orphan** — the child keeps running and is re-parented to PID 1, which reaps it when it finally exits.

</details>

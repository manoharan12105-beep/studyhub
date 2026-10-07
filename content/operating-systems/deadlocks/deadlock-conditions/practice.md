# Four Necessary Conditions for Deadlock — Practice

### P1. Not a condition

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** Coffman conditions

Which is **not** one of the four necessary conditions for deadlock?

- A) Mutual exclusion
- B) Hold and wait
- C) Preemption
- D) Circular wait

<details>
<summary>Answer</summary>

**Answer:** C) Preemption

The condition is **no** preemption.

</details>

### P2. Identify the condition

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** hold and wait

A process holds a file lock while it waits for a printer. Which condition does this show?

- A) Mutual exclusion
- B) Hold and wait
- C) No preemption
- D) Circular wait

<details>
<summary>Answer</summary>

**Answer:** B) Hold and wait

</details>

### P3. Which condition is broken?

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** prevention techniques

Name the condition broken by each rule: (a) a process must request all its resources before it starts; (b) locks are always acquired in increasing id order; (c) if a request cannot be granted, the OS takes back everything the process holds; (d) printer output is spooled to disk and printed by a single daemon.

<details>
<summary>Answer</summary>

(a) **Hold and wait.** (b) **Circular wait.** (c) **No preemption.** (d) **Mutual exclusion** — processes no longer use the printer directly; only the spooler does.

</details>

### P4. Can it deadlock?

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** necessary conditions

Several threads read a shared configuration map that is never modified after start-up; no locks are used. Can they deadlock over it? Which condition is missing?

<details>
<summary>Answer</summary>

**No.** Read-only data is shareable, so **mutual exclusion** does not hold — threads never wait for each other to access it.

</details>

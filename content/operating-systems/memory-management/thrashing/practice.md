# Thrashing — Practice

### P1. Main symptom

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** thrashing

During thrashing, CPU utilisation is usually:

- A) Very high, because processes compute constantly
- B) Low, because processes wait for paging I/O
- C) Exactly 100 %
- D) Unchanged

<details>
<summary>Answer</summary>

**Answer:** B) Low, because processes wait for paging I/O

</details>

### P2. The cure

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** thrashing remedies

Which action helps a thrashing system?

- A) Start more processes to use the idle CPU
- B) Suspend some processes to free frames
- C) Reduce the RAM size
- D) Use a smaller working-set window only

<details>
<summary>Answer</summary>

**Answer:** B) Suspend some processes to free frames

</details>

### P3. Working set

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** working-set model

Reference string (positions 1–12): `2 6 1 5 7 7 7 7 5 1 6 2`. With Δ = 5, find the working set at t = 5 and t = 10.

<details>
<summary>Answer</summary>

t = 5: references 1–5 → 2 6 1 5 7 → WS = **{1, 2, 5, 6, 7}**, WSS = 5.
t = 10: references 6–10 → 7 7 7 5 1 → WS = **{1, 5, 7}**, WSS = 3.

The process's locality shrank, so it needs fewer frames at t = 10.

</details>

### P4. Admit or suspend?

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** total demand D

A system has 40 frames. Five processes have working-set sizes 6, 9, 7, 11 and 10. Is there a risk of thrashing? What should the OS do?

<details>
<summary>Answer</summary>

D = 6 + 9 + 7 + 11 + 10 = **43 > 40** → thrashing risk. Suspend one process — for example the one with WSS 6 or 7 brings D to 37 or 36 — and give its frames to the others.

</details>

### P5. Diagnose

**Difficulty:** Hard · **Type:** Scenario · **Concepts:** thrashing, PFF

Under PFF with lower bound 2 faults/s and upper bound 10 faults/s, process A faults 25 times per second and process B 0.5 times per second. There are no free frames. What does the OS do?

<details>
<summary>Answer</summary>

A is above the upper bound → it needs more frames. B is below the lower bound → it has more than it needs. The OS takes frames from **B** and gives them to **A**. If that is still not enough and no other process is under its lower bound, the OS suspends a process to free frames.

</details>

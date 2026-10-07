# OS Architecture Basics — Practice

### P1. Where do drivers run?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** microkernel

In a microkernel OS, device drivers usually run:

- A) In kernel mode, inside the kernel
- B) In user mode, as separate server processes
- C) In the firmware
- D) Inside each application

<details>
<summary>Answer</summary>

**Answer:** B) In user mode, as separate server processes

Only IPC, basic scheduling and basic memory management stay in the microkernel.

</details>

### P2. Classify the kernel

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** kernel examples

Which pairing is correct?

- A) Linux — microkernel
- B) QNX — monolithic
- C) Windows 11 — hybrid
- D) MINIX 3 — monolithic

<details>
<summary>Answer</summary>

**Answer:** C) Windows 11 — hybrid

Linux is monolithic (and modular); QNX and MINIX 3 are microkernels.

</details>

### P3. Pick an architecture

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** trade-offs

You are choosing an OS for (a) a high-frequency trading server where every microsecond counts and (b) an infusion pump where a driver bug must never stop the device. Which kernel style suits each, and why?

<details>
<summary>Answer</summary>

(a) A **monolithic** kernel (typically Linux): services talk by function calls, so there is less overhead per operation. (b) A **microkernel** (for example QNX): drivers run as user processes that can fail and restart without bringing down the kernel, and the small kernel is easier to certify.

</details>

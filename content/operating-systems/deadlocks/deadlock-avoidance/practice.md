# Deadlock Avoidance — Practice

### P1. Safe vs unsafe

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** safe state

Which statement is true?

- A) Every unsafe state is a deadlock
- B) Every deadlock is an unsafe state
- C) A safe state can contain a deadlock
- D) Safe and unsafe states are the same

<details>
<summary>Answer</summary>

**Answer:** B) Every deadlock is an unsafe state

</details>

### P2. What avoidance needs

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** avoidance requirements

Deadlock avoidance requires each process to declare in advance its:

- A) Burst time
- B) Maximum resource needs
- C) Priority
- D) Memory address space

<details>
<summary>Answer</summary>

**Answer:** B) Maximum resource needs

</details>

### P3. Find a safe sequence

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** safe sequence

One resource type, 12 units in total.

| Process | Max | Allocated |
|---------|-----|-----------|
| P0 | 8 | 4 |
| P1 | 5 | 3 |
| P2 | 6 | 2 |

Is the state safe? Give a safe sequence if one exists.

<details>
<summary>Answer</summary>

Allocated = 9 → Available = 3. Need: P0 4, P1 2, P2 4.
P1 (2 ≤ 3) → Available 6. P0 (4 ≤ 6) → 10. P2 (4 ≤ 10) → 12. **Safe**, for example ⟨P1, P0, P2⟩ (⟨P1, P2, P0⟩ also works).

</details>

### P4. Grant or wait?

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** avoidance decision

In the state of P3, P0 requests 2 more units. Should the system grant it?

<details>
<summary>Answer</summary>

Pretend to grant: Available = 1, P0 Allocated 6, Need 2. Needs are now P0 2, P1 2, P2 4 — none ≤ 1. **Unsafe → P0 must wait.**

</details>

### P5. Grant this one?

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** avoidance decision

Same initial state as P3. P1 requests 2 units instead. Grant or wait?

<details>
<summary>Answer</summary>

Pretend to grant: Available = 1, P1 Allocated 5, Need 0. P1 can finish immediately (0 ≤ 1) → Available 6. P0 (4 ≤ 6) → 10. P2 (4 ≤ 10) → 12. **Safe → grant.**

</details>

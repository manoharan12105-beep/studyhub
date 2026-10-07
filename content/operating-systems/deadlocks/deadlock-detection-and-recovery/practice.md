# Deadlock Detection and Recovery — Practice

### P1. Wait-for graph

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** wait-for graph

With single-instance resources, a deadlock exists if and only if the wait-for graph:

- A) Has more edges than nodes
- B) Contains a cycle
- C) Is disconnected
- D) Has a process with no edges

<details>
<summary>Answer</summary>

**Answer:** B) Contains a cycle

</details>

### P2. Matrix used in detection

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** detection algorithm

The deadlock-detection algorithm for multiple instances compares Work with each process's:

- A) Max
- B) Need
- C) Current Request
- D) Priority

<details>
<summary>Answer</summary>

**Answer:** C) Current Request

</details>

### P3. Run the detection algorithm

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** detection algorithm

Two resource types; Available (0, 0).

| Process | Allocation | Request |
|---------|-----------|---------|
| P0 | 1 0 | 0 1 |
| P1 | 0 1 | 1 0 |
| P2 | 1 0 | 0 1 |

Which processes, if any, are deadlocked?

<details>
<summary>Answer</summary>

Work (0, 0): P0 needs (0, 1), P1 (1, 0), P2 (0, 1) — none fits, and nobody else will release anything. **All three are deadlocked.** (P0 and P2 wait for P1's B; P1 waits for A held by P0 and P2.)

</details>

### P4. Choose the victim

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** victim selection

Three deadlocked processes: a nightly report that has run 5 hours, an interactive editor session running 2 minutes, and a log-rotation script running 10 seconds with low priority. Which would you abort first, and why?

<details>
<summary>Answer</summary>

The **log-rotation script**: lowest priority, least work lost (10 seconds), and easy to rerun. Aborting the 5-hour report wastes the most work; aborting the editor hurts an interactive user. If one abort does not break the cycle, re-run detection and pick the next cheapest.

</details>

### P5. Does aborting one help?

**Difficulty:** Hard · **Type:** Calculation · **Concepts:** recovery

In P3, process P1 is aborted and its resources are released. Do P0 and P2 now finish?

<details>
<summary>Answer</summary>

Releasing P1's allocation makes Available (0, 1). P0 requests (0, 1) → satisfied, finishes, releases (1, 0) → Work (1, 1). P2 requests (0, 1) ≤ (1, 1) → finishes → Work (2, 1). **Yes — both finish.** P1 must be restarted (or rolled back) later.

</details>

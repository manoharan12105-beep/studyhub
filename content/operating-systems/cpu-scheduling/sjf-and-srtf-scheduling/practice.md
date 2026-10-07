# SJF and SRTF Scheduling — Practice

### P1. Minimum average waiting time

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** SJF optimality

When all processes arrive at the same time and burst times are known, which non-preemptive algorithm gives the minimum average waiting time?

- A) FCFS
- B) SJF
- C) Round Robin
- D) Priority

<details>
<summary>Answer</summary>

**Answer:** B) SJF

</details>

### P2. Preempt or not?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** SRTF

Under SRTF, P1 is running with 5 units remaining. P2 arrives with a burst of 5. What happens?

- A) P2 preempts P1
- B) P1 continues
- C) Both share the CPU
- D) The CPU idles

<details>
<summary>Answer</summary>

**Answer:** B) P1 continues

Preemption needs a strictly shorter remaining time; on a tie, the running process keeps the CPU.

</details>

### P3. SJF, all at time 0

**Difficulty:** Easy · **Type:** Calculation · **Concepts:** SJF waiting time

P1 (BT 5), P2 (BT 9), P3 (BT 2), P4 (BT 4), all arriving at time 0. Give the SJF order and the average waiting time.

<details>
<summary>Answer</summary>

Order P3, P4, P1, P2. Gantt: P3 0–2, P4 2–6, P1 6–11, P2 11–20. WT: P1 6, P2 11, P3 0, P4 2 → average 19 ÷ 4 = **4.75**.

</details>

### P4. SJF with arrivals

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** SJF Gantt chart

| Process | AT | BT |
|---------|----|----|
| P1 | 0 | 3 |
| P2 | 1 | 6 |
| P3 | 2 | 4 |
| P4 | 3 | 2 |

Draw the SJF Gantt chart and find average TAT and WT.

<details>
<summary>Answer</summary>

P1 runs 0–3 (only one ready at 0). At 3: P4 (2) < P3 (4) < P2 (6).
Gantt: P1 0–3, P4 3–5, P3 5–9, P2 9–15.
CT: 3, 15, 9, 5. TAT: 3, 14, 7, 2 → average 26 ÷ 4 = **6.5**. WT: 0, 8, 3, 0 → average 11 ÷ 4 = **2.75**.

</details>

### P5. SJF vs SRTF

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** SRTF preemption

P1 (AT 0, BT 6), P2 (AT 1, BT 2), P3 (AT 2, BT 3). Compute the average waiting time under SJF and under SRTF.

<details>
<summary>Answer</summary>

**SJF:** P1 0–6, P2 6–8, P3 8–11. WT: 0, 5, 6 → average 11 ÷ 3 ≈ **3.67**.
**SRTF:** t = 1, P2 (2) < P1's remaining 5 → preempt; P2 1–3. At 3: P3 (3) < P1 (5) → P3 3–6. P1 6–11.
WT: P1 = 11 − 0 − 6 = 5, P2 = 0, P3 = 6 − 2 − 3 = 1 → average 6 ÷ 3 = **2**.

</details>

### P6. Predict the burst

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** exponential averaging

With α = 0.25 and an initial prediction of 12, the actual bursts are 4 and then 8. What are the next two predictions?

<details>
<summary>Answer</summary>

τ1 = 0.25 × 4 + 0.75 × 12 = 1 + 9 = **10**. τ2 = 0.25 × 8 + 0.75 × 10 = 2 + 7.5 = **9.5**.

</details>

### P7. Starvation

**Difficulty:** Hard · **Type:** Scenario · **Concepts:** starvation, aging

A server uses SRTF and is busy with a stream of 4 ms requests: a new one arrives every 4 ms, forever. A 500 ms report job arrives while a request is running. What happens to the report job, and how would aging change it?

<details>
<summary>Answer</summary>

Each request finishes exactly when the next one arrives, so the CPU always has a 4 ms job ready, which beats the report job's 500 ms. The report job **starves** — it never runs. With aging, its effective priority improves the longer it waits until it is chosen ahead of the short requests, so it eventually completes.

</details>

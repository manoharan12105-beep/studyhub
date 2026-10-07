# Priority Scheduling — Practice

### P1. The fix for starvation

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** aging

The technique of gradually increasing the priority of processes that wait a long time is called:

- A) Thrashing
- B) Aging
- C) Swapping
- D) Spooling

<details>
<summary>Answer</summary>

**Answer:** B) Aging

</details>

### P2. Priority inversion fix

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** priority inversion

Priority inversion is usually solved by:

- A) Round Robin
- B) Priority inheritance
- C) Increasing the time quantum
- D) Paging

<details>
<summary>Answer</summary>

**Answer:** B) Priority inheritance

</details>

### P3. All at time 0

**Difficulty:** Easy · **Type:** Calculation · **Concepts:** priority, waiting time

Lower number = higher priority. All arrive at time 0: P1 (BT 3, priority 2), P2 (BT 5, priority 4), P3 (BT 2, priority 1), P4 (BT 4, priority 3). Give the order and the average waiting time.

<details>
<summary>Answer</summary>

Order P3, P1, P4, P2. Gantt: P3 0–2, P1 2–5, P4 5–9, P2 9–14. WT: P1 2, P2 9, P3 0, P4 5 → average 16 ÷ 4 = **4**.

</details>

### P4. Non-preemptive with arrivals

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** non-preemptive priority

Lower number = higher priority.

| Process | AT | BT | Priority |
|---------|----|----|----------|
| P1 | 0 | 5 | 2 |
| P2 | 1 | 2 | 1 |
| P3 | 2 | 3 | 3 |
| P4 | 3 | 1 | 1 |

Draw the non-preemptive Gantt chart and find average TAT and WT.

<details>
<summary>Answer</summary>

P1 runs 0–5. At 5: P2 and P4 both have priority 1 → P2 arrived first. Gantt: P1 0–5, P2 5–7, P4 7–8, P3 8–11.
CT: 5, 7, 11, 8. TAT: 5, 6, 9, 5 → average 25 ÷ 4 = **6.25**. WT: 0, 4, 6, 4 → average 14 ÷ 4 = **3.5**.

</details>

### P5. Preemptive with arrivals

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** preemptive priority

Same processes as P4, preemptive. Find the Gantt chart and the average waiting and response times.

<details>
<summary>Answer</summary>

t = 1: P2 (1) beats P1 (2) → preempt; P2 runs 1–3. t = 3: P2 finishes as P4 (1) arrives → P4 runs 3–4. Then P1 (2) 4–8, P3 8–11.
Gantt: P1 0–1, P2 1–3, P4 3–4, P1 4–8, P3 8–11.
WT: P1 8 − 0 − 5 = 3, P2 0, P3 11 − 2 − 3 = 6, P4 0 → average 9 ÷ 4 = **2.25**. RT: 0, 0, 6, 0 → average **1.5**.

</details>

### P6. Inversion scenario

**Difficulty:** Hard · **Type:** Scenario · **Concepts:** priority inversion, priority inheritance

A sensor task (low priority) holds a mutex on a shared buffer. The control task (high priority) blocks on that mutex. A logging task (medium priority) becomes ready. Without and with priority inheritance, who runs next, and when does the control task get the mutex?

<details>
<summary>Answer</summary>

**Without inheritance:** the logging task preempts the sensor task (medium > low). The sensor task cannot finish its critical section, so the control task waits for the whole logging task — an unbounded delay. **With inheritance:** the sensor task inherits high priority while the control task waits, so the logging task cannot preempt it; it finishes its critical section, releases the mutex, drops back to low priority, and the control task gets the mutex immediately.

</details>

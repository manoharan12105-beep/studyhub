# SJF and SRTF Scheduling — Interview Questions

## Beginner

### Q1. What is SJF scheduling?

**Style:** Direct

<details>
<summary>Answer</summary>

Shortest Job First: when the CPU becomes free, the scheduler picks the ready process with the smallest next CPU burst. It is non-preemptive — the chosen process runs its whole burst. It minimises average waiting time when all processes are available together.

</details>

### Q2. What is the difference between SJF and SRTF?

**Style:** Comparison

<details>
<summary>Answer</summary>

SJF is non-preemptive: it chooses the shortest burst only when the CPU is free, and a running process is never interrupted. SRTF (Shortest Remaining Time First) is the preemptive version: when a new process arrives with a burst shorter than the running process's **remaining** time, the running process is preempted. SRTF usually gives lower average waiting and response time, with more context switches.

</details>

### Q3. What is the main practical problem with SJF?

**Style:** Why

<details>
<summary>Answer</summary>

The length of the next CPU burst is not known in advance, so true SJF cannot be implemented exactly; it must be approximated by predicting bursts from history. Its second problem is starvation: long processes can wait indefinitely if short ones keep arriving.

</details>

## Intermediate

### Q4. Why does SJF give the minimum average waiting time?

**Style:** Why

<details>
<summary>Answer</summary>

If a longer job runs before a shorter one, swapping them reduces the shorter job's waiting time by the longer job's burst and increases the longer job's waiting time by only the shorter job's burst — a net decrease. Repeating such swaps reaches the order sorted by burst length, which therefore has the smallest total (and average) waiting time.

</details>

### Q5. How does the OS estimate the next CPU burst? Calculate the predictions for α = 0.5, initial guess 10, actual bursts 6, 4, 6.

**Style:** Calculation

<details>
<summary>Answer</summary>

With exponential averaging: τ(n+1) = α·t(n) + (1 − α)·τ(n).
τ1 = 0.5 × 6 + 0.5 × 10 = **8**; τ2 = 0.5 × 4 + 0.5 × 8 = **6**; τ3 = 0.5 × 6 + 0.5 × 6 = **6**.
Recent history counts most; older bursts fade by a factor of (1 − α) each step.

</details>

### Q6. P1 (AT 0, BT 3), P2 (AT 1, BT 6), P3 (AT 2, BT 4), P4 (AT 3, BT 2). Do SJF and SRTF give different schedules?

**Style:** Trap

<details>
<summary>Answer</summary>

No — both give P1 0–3, P4 3–5, P3 5–9, P2 9–15 (average WT 2.75). Under SRTF, every newcomer is longer than P1's remaining time (P2: 6 > 2, P3: 4 > 1), so no preemption occurs; at time 3 both algorithms pick the shortest ready job. Preemptive algorithms only preempt when a newcomer is strictly better.

</details>

### Q7. How can starvation in SJF/SRTF be prevented?

**Style:** How

<details>
<summary>Answer</summary>

By **aging**: gradually increasing a waiting process's priority (or decreasing its effective burst estimate) the longer it waits, so eventually it is chosen even if shorter jobs keep arriving. Multilevel feedback queues achieve a similar effect by moving long-waiting processes to higher-priority queues.

</details>

## Advanced

### Q8. In the exponential average, what do α = 0 and α = 1 mean?

**Style:** Follow-up

<details>
<summary>Answer</summary>

α = 0: τ(n+1) = τ(n) — recent bursts are ignored, the prediction never changes. α = 1: τ(n+1) = t(n) — only the last burst counts, with no memory of earlier ones. Values in between (commonly 0.5) balance responsiveness to change against stability.

</details>

### Q9. Is SRTF always better than SJF in practice?

**Style:** Trade-off

<details>
<summary>Answer</summary>

Not always. SRTF lowers average waiting and response time in theory, but each preemption costs a context switch and cache disruption, and it still needs burst predictions — wrong estimates can cause needless preemptions. It also starves long jobs even more aggressively. For workloads with many arrivals of similar length, the extra switches can cancel the theoretical gain.

</details>

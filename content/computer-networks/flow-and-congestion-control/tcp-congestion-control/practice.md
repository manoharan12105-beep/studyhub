# TCP Congestion Control — Practice

### P1. Growth in slow start

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** slow start

During slow start, cwnd roughly:

- A) Increases by 1 segment per RTT
- B) Doubles every RTT
- C) Stays constant
- D) Halves every RTT

<details>
<summary>Answer</summary>

**Answer:** B) Doubles every RTT

</details>

### P2. Trace the window

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** slow start, congestion avoidance

Start: cwnd = 1, ssthresh = 8 (in segments). Give cwnd at the start of each of the first 7 RTTs, with no loss.

<details>
<summary>Answer</summary>

1, 2, 4, 8 (reaches ssthresh), then linear: 9, 10, 11.

</details>

### P3. After loss

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** fast recovery vs timeout

cwnd = 24 segments when (a) 3 duplicate ACKs arrive, or (b) a timeout occurs. Give ssthresh and the new cwnd for each (Reno).

<details>
<summary>Answer</summary>

(a) ssthresh = 12, cwnd = 12 → continue in congestion avoidance.
(b) ssthresh = 12, cwnd = 1 → slow start again.

</details>

### P4. Effective window

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** min(rwnd, cwnd)

The receiver advertises rwnd = 30 KB; the sender's cwnd = 45 KB. How much unacknowledged data may it send? What if cwnd drops to 12 KB?

<details>
<summary>Answer</summary>

min(30, 45) = **30 KB** (flow-control limited). Then min(30, 12) = **12 KB** (congestion limited).

</details>

### P5. First flight

**Difficulty:** Hard · **Type:** Scenario · **Concepts:** initial window

With an initial window of 10 segments and MSS 1,460 bytes, roughly how much of a response can a server send in its first round trip? Why do web performance guides mention "the first 14 KB"?

<details>
<summary>Answer</summary>

10 × 1,460 = **14,600 bytes ≈ 14 KB**. A page or API response that fits in that first flight arrives one RTT after the request; larger responses need extra round trips while cwnd grows. That is why critical HTML/CSS is kept small and why reused, warmed-up connections are faster.

</details>

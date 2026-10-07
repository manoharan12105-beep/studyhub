# Disk Scheduling — Interview Questions

## Beginner

### Q1. What is disk scheduling and why is it needed?

**Style:** Why

<details>
<summary>Answer</summary>

When several I/O requests are pending for a hard disk, disk scheduling decides the order in which to serve them. Seek time — moving the head between cylinders — dominates access time, so a good order reduces total head movement, increasing throughput and lowering average response time while keeping waiting fair.

</details>

### Q2. Name the common disk-scheduling algorithms.

**Style:** Direct

<details>
<summary>Answer</summary>

FCFS (arrival order), SSTF (shortest seek time first — nearest request), SCAN (elevator: sweep to the end, reverse), C-SCAN (sweep one direction, jump back to the start), LOOK and C-LOOK (like SCAN and C-SCAN but turning at the last request instead of the disk end).

</details>

## Intermediate

### Q3. Which disk-scheduling algorithm can cause starvation, and why?

**Style:** Trap

<details>
<summary>Answer</summary>

**SSTF.** It always serves the nearest request; if new requests keep arriving near the head, a request at a far cylinder may never be served. It is the disk equivalent of SJF. FCFS and the SCAN family do not starve requests, because every sweep reaches every pending cylinder.

</details>

### Q4. What is the difference between SCAN and C-SCAN?

**Style:** Comparison

<details>
<summary>Answer</summary>

SCAN serves requests in both directions, reversing at the end of the disk. C-SCAN serves only in one direction; at the end it returns to the beginning without serving and starts again. C-SCAN gives a more uniform wait: in SCAN, a request just behind the head after it turns waits for almost two sweeps, and cylinders in the middle are visited more often than those at the edges.

</details>

### Q5. Head at 100, moving up, cylinders 0–199, queue 30, 140, 75, 180, 10, 120. Compute total head movement for FCFS and SSTF.

**Style:** Calculation

<details>
<summary>Answer</summary>

**FCFS:** 100 → 30 → 140 → 75 → 180 → 10 → 120 = 70 + 110 + 65 + 105 + 170 + 110 = **630**.
**SSTF:** 100 → 120 → 140 → 180 → 75 → 30 → 10 = 20 + 20 + 40 + 105 + 45 + 20 = **250**.

</details>

### Q6. Same queue: compute SCAN and LOOK.

**Style:** Calculation

<details>
<summary>Answer</summary>

**SCAN:** 100 → 120 → 140 → 180 → 199 → 75 → 30 → 10 = 20 + 20 + 40 + 19 + 124 + 45 + 20 = **288**.
**LOOK:** 100 → 120 → 140 → 180 → 75 → 30 → 10 = 20 + 20 + 40 + 105 + 45 + 20 = **250** (turns at 180 instead of going to 199).

</details>

## Advanced

### Q7. Is disk scheduling useful for SSDs?

**Style:** Follow-up

<details>
<summary>Answer</summary>

Not in the seek-minimising sense: SSDs have no moving head, and access time barely depends on the address. Linux typically uses `none` or `mq-deadline` for SSDs and NVMe devices; scheduling there focuses on merging adjacent requests, bounding latency (deadlines) and fairness between processes, not head movement.

</details>

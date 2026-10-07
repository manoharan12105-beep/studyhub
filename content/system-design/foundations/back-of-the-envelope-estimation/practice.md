# Back-of-the-Envelope Estimation — Practice

### P1. Per second

**Difficulty:** Easy · **Type:** Estimation · **Concepts:** RPS

An API receives 86.4 million requests per day, evenly spread. What is the average RPS? What is the peak RPS with a peak factor of 3?

<details>
<summary>Answer</summary>

86,400,000 ÷ 86,400 = **1,000/s** average; **3,000/s** at peak.

</details>

### P2. Bits and bytes

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** bandwidth

A service sends 250 MB of responses per second. Roughly what network capacity does that need?

- A) 250 Mbps
- B) 2 Gbps
- C) 31 Mbps
- D) 25 Gbps

<details>
<summary>Answer</summary>

**Answer:** B) 2 Gbps

250 MB/s × 8 = 2,000 Mb/s = 2 Gbps.

</details>

### P3. Storage for a URL shortener

**Difficulty:** Medium · **Type:** Estimation · **Concepts:** storage

200 new short links per second on average, 500 bytes each, kept for 5 years. Estimate total storage (no replication).

<details>
<summary>Answer</summary>

Per day: 200 × 86,400 ≈ 17.3 M links → ≈ 8.6 GB/day. Per year ≈ 3.2 TB. Five years ≈ **16 TB**. (Using 1 year ≈ 3 × 10⁷ s: 200 × 3 × 10⁷ × 500 B = 3 TB/year, 15 TB in 5 years — same order of magnitude.)

</details>

### P4. Servers needed

**Difficulty:** Medium · **Type:** Estimation · **Concepts:** capacity

Peak load is 12,000 RPS. Load tests show one server handles 800 RPS at acceptable latency. You target 70 % utilisation and want to survive one server failure. How many servers?

<details>
<summary>Answer</summary>

12,000 ÷ 800 = 15 servers at 100 %. At 70 %: 15 ÷ 0.7 ≈ 21.4 → 22. Plus one for failure tolerance → **23 servers**.

</details>

### P5. What the numbers say

**Difficulty:** Medium · **Type:** Design · **Concepts:** turning estimates into decisions

A news site estimates 40,000 reads/s at peak and 5 writes/s, with articles of 100 KB. Name two design decisions these numbers justify.

<details>
<summary>Answer</summary>

(1) Cache rendered articles heavily (CDN or a page cache) because reads outnumber writes 8,000:1 and content changes rarely. (2) A single primary database is enough for writes; read replicas or the cache absorb reads. Bandwidth (40,000 × 100 KB = 4 GB/s ≈ 32 Gbps) also argues strongly for a CDN.

</details>

### P6. Video storage

**Difficulty:** Hard · **Type:** Estimation · **Concepts:** storage, encoding

Users upload 500 hours of video per minute. Assume each hour is stored at several resolutions totalling 4 GB per hour of video. How much new storage per day?

<details>
<summary>Answer</summary>

500 hours/min × 1,440 min/day = 720,000 hours/day. × 4 GB = 2,880,000 GB ≈ **2.9 PB per day** (before replication). This is why video platforms rely on object storage, tiered storage for old content and careful encoding choices.

</details>

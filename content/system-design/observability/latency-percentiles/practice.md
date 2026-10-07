# Latency Percentiles: P50, P95, P99 — Practice

### P1. Compute percentiles

**Difficulty:** Easy · **Type:** Calculation · **Concepts:** nearest-rank

Response times (ms): 40, 35, 50, 45, 300, 38, 42, 41, 39, 900. Find the average, P50 and P90 (nearest rank).

<details>
<summary>Answer</summary>

Sorted: 35, 38, 39, 40, 41, 42, 45, 50, 300, 900. Sum = 1,530 → average **153 ms**. P50 = 5th value = **41 ms**. P90 = 9th value = **300 ms**. The average is nearly four times the median because of two outliers.

</details>

### P2. Interpret

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** percentile meaning

P50 = 80 ms, P99 = 2.4 s. Which is true?

- A) Most requests take about 2.4 s
- B) 1 % of requests take longer than 2.4 s
- C) The average is 80 ms
- D) Half of requests take longer than 2.4 s

<details>
<summary>Answer</summary>

**Answer:** B) 1 % of requests take longer than 2.4 s

</details>

### P3. Fan-out probability

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** tail amplification

A page makes 20 parallel backend calls; each is slower than 1 s with probability 2 %. What fraction of page loads include at least one call slower than 1 s?

<details>
<summary>Answer</summary>

1 − 0.98²⁰ ≈ 1 − 0.668 = **≈ 33 %** of page loads.

</details>

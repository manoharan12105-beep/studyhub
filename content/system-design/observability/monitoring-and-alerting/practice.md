# Monitoring and Alerting — Practice

### P1. Golden signal

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** golden signals

Connection-pool usage at 95 % is an example of which golden signal?

- A) Latency
- B) Traffic
- C) Errors
- D) Saturation

<details>
<summary>Answer</summary>

**Answer:** D) Saturation

</details>

### P2. Page or ticket

**Difficulty:** Medium · **Type:** Comparison · **Concepts:** alert severity

Page (P) or ticket/dashboard (T)? (a) checkout error rate at 8 % for 10 minutes, (b) one of 30 servers at 85 % CPU, (c) disk at 70 % growing 1 %/day, (d) the oldest message in the payment queue is 20 minutes old.

<details>
<summary>Answer</summary>

(a) P, (b) T, (c) T, (d) P.

</details>

### P3. Capacity alert

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** throughput monitoring

An API's tested capacity is 12,000 requests/s. You want a warning at 75 % and a page at 90 %. What thresholds do you set?

<details>
<summary>Answer</summary>

Warning at **9,000 requests/s**, page at **10,800 requests/s** (sustained for a few minutes to avoid paging on brief spikes).

</details>

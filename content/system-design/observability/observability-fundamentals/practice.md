# Observability: Metrics, Logs and Traces — Practice

### P1. Which signal?

**Difficulty:** Easy · **Type:** Comparison · **Concepts:** three pillars

Metric (M), log (L) or trace (T)? (a) the error rate of `/checkout` over the last hour, (b) why order 7781 failed, (c) which service added 800 ms to one slow request, (d) CPU usage of the payments fleet.

<details>
<summary>Answer</summary>

(a) M, (b) L, (c) T, (d) M.

</details>

### P2. Improve the log

**Difficulty:** Medium · **Type:** Design · **Concepts:** structured logging

Rewrite as a structured log entry: `ERROR: payment failed for user ravi@example.com card 4111111111111111 after 3s`.

<details>
<summary>Answer</summary>

For example: `{"level":"ERROR","service":"payments","event":"charge_failed","traceId":"…","userId":"u-5521","cardLast4":"1111","provider":"cardco","latencyMs":3000,"errorCode":"PROVIDER_TIMEOUT"}` — machine-parseable fields, a trace ID, and no full card number or unnecessary personal data.

</details>

### P3. Cardinality

**Difficulty:** Medium · **Type:** MCQ · **Concepts:** metric labels

Which metric label is most likely to cause a cardinality explosion?

- A) `status_class` (2xx, 4xx, 5xx)
- B) `region`
- C) `request_id`
- D) `endpoint`

<details>
<summary>Answer</summary>

**Answer:** C) `request_id`

Every request creates a new time series.

</details>

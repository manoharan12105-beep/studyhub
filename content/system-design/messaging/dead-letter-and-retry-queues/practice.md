# Dead-Letter and Retry Queues — Practice

### P1. Route the failure

**Difficulty:** Easy · **Type:** Comparison · **Concepts:** retry vs DLQ

Retry later (R) or dead-letter immediately (D)? (a) the payment provider returned 503, (b) the message JSON cannot be parsed, (c) a database deadlock, (d) the referenced user ID was deleted permanently.

<details>
<summary>Answer</summary>

(a) R, (b) D, (c) R, (d) D.

</details>

### P2. Retry schedule

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** delayed retries

Retries happen after 10 s, 1 min, 10 min and 1 h, then the DLQ. If processing itself is instant, how long after the first failure does a permanently failing message reach the DLQ?

<details>
<summary>Answer</summary>

10 s + 60 s + 600 s + 3,600 s = 4,270 s ≈ **71 minutes** (assuming the fifth attempt, made after the 1-hour wait, also fails and is then dead-lettered).

</details>

### P3. Unwatched DLQ

**Difficulty:** Medium · **Type:** Failure · **Concepts:** DLQ operations

A team discovers 40,000 order-confirmation messages in a DLQ that nobody looked at for three weeks. What processes should exist?

<details>
<summary>Answer</summary>

Alerts on DLQ depth and oldest-message age; a clear owner and runbook; dashboards of DLQ arrivals by error type; a tested redrive tool with rate limiting; idempotent consumers so redrive is safe; and retention long enough to investigate.

</details>

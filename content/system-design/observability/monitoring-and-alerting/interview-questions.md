# Monitoring and Alerting — Interview Questions

## Beginner

### Q1. What are the four golden signals?

**Style:** Direct

<details>
<summary>Answer</summary>

Latency (how long requests take), traffic (how much demand), errors (how many requests fail) and saturation (how full the service's resources are). Together they describe the health of most user-facing services.

</details>

### Q2. What do you monitor on machines?

**Style:** Direct

<details>
<summary>Answer</summary>

CPU utilisation, memory usage, disk space and I/O, and network throughput and errors — each with thresholds (for example sustained CPU above about 75 % or memory above about 90 %) that suggest scaling or investigation.

</details>

## Intermediate

### Q3. What is the difference between alerting on symptoms and alerting on causes?

**Style:** Comparison

<details>
<summary>Answer</summary>

Symptom alerts fire when users are affected — elevated error rates, slow responses, failing checkouts — and justify paging someone. Cause alerts fire on internal conditions that might lead to problems — one server's high CPU, a filling disk — and are better as dashboard warnings or tickets, because many causes never affect users and paging on them creates noise.

</details>

### Q4. What is alert fatigue and how do you prevent it?

**Style:** How

<details>
<summary>Answer</summary>

When engineers receive so many alerts — many not actionable — that they begin to ignore or mute them and miss real incidents. Prevent it by paging only on actionable, user-impacting conditions (SLO burn rates), routing lower-severity issues to tickets, tuning or deleting noisy alerts, deduplicating related alerts, and attaching runbooks.

</details>

### Q5. What are RED and USE?

**Style:** Comparison

<details>
<summary>Answer</summary>

RED is a checklist for request-driven services: Rate (requests/s), Errors (failed requests), Duration (latency distribution). USE is for resources such as CPU, disks and pools: Utilisation (how busy), Saturation (queued or waiting work), Errors. RED shows user impact; USE finds the resource bottleneck.

</details>

## Advanced

### Q6. What is an SLO burn-rate alert?

**Style:** Direct

<details>
<summary>Answer</summary>

An alert based on how quickly the error budget is being consumed: a burn rate of 1 uses the budget exactly over the SLO window; a high burn rate (for example 14× over an hour) means the month's budget would be gone in days, warranting a page, while a slow burn creates a ticket. It reacts to sustained user impact while ignoring brief blips.

</details>

### Q7. Your dashboards show all services green, yet customers report failed checkouts. What might your monitoring be missing?

**Style:** Debugging

<details>
<summary>Answer</summary>

Monitoring may measure the wrong things: process health instead of request success, averages instead of percentiles, server-side metrics that miss failures in clients, CDNs, DNS or third-party payment providers, or errors returned as 200 responses. Add end-to-end synthetic checks of the checkout flow, business KPIs (successful orders per minute), client-side error reporting, and dependency-specific metrics.

</details>

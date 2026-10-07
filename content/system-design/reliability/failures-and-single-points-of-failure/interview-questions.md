# Failures and Single Points of Failure — Interview Questions

## Beginner

### Q1. What is the difference between a fault and a failure?

**Style:** Comparison

<details>
<summary>Answer</summary>

A fault is a single component misbehaving (a crashed process, a dead disk, a slow dependency). A failure is the system as a whole not delivering its service to users. Fault-tolerant design aims to keep faults from becoming failures.

</details>

### Q2. What is a single point of failure? Give three examples.

**Style:** Direct

<details>
<summary>Answer</summary>

A component whose failure alone makes the system unavailable. Examples: a single load balancer, a primary database without automated failover, one region, a single DNS provider, a shared configuration service, or an expiring TLS certificate nobody monitors.

</details>

### Q3. What are the three main categories of faults?

**Style:** Direct

<details>
<summary>Answer</summary>

Hardware faults (disks, servers, networks, power — random and mostly independent), software faults (bugs, bad configuration, resource leaks, slow dependencies — systematic and often hitting all instances at once), and human faults (operational mistakes and bad changes — unpredictable). Each needs different defences.

</details>

## Intermediate

### Q4. Why doesn't redundancy protect against software bugs?

**Style:** Why

<details>
<summary>Answer</summary>

Redundant copies run the same code and configuration, so a bug triggered by a particular input or date, or a bad config push, hits all of them simultaneously — the faults are correlated. Defences are gradual (canary) rollouts with automatic rollback, testing, input validation, resource limits, and isolating failures with timeouts and circuit breakers.

</details>

### Q5. How do you find single points of failure in a design?

**Style:** How

<details>
<summary>Answer</summary>

Walk every request and data path hop by hop — DNS, edge, load balancers, services, caches, databases, storage, queues, external dependencies, and operational paths like deployment and configuration — and ask what happens if each disappears or slows down. Any component without an alternative path, failover or graceful degradation is a SPOF. Verify with failure injection.

</details>

## Advanced

### Q6. How would you reduce human-caused outages?

**Style:** Design

<details>
<summary>Answer</summary>

Automate repetitive operations, require review for production changes (including config and infrastructure as code), apply least privilege and guard rails (confirmation for destructive actions, deletion protection), roll out changes gradually with fast rollback, provide staging environments that match production, write runbooks, and run blameless post-incident reviews that fix the system rather than blaming people.

</details>

### Q7. What is chaos engineering and why do it?

**Style:** Direct

<details>
<summary>Answer</summary>

Deliberately injecting faults into a system — killing instances, adding latency, dropping network traffic, failing a zone — in a controlled way to verify that redundancy, failover, timeouts and alerts work as designed. It finds hidden single points of failure and broken recovery paths before real incidents do.

</details>

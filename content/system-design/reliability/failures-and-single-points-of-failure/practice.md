# Failures and Single Points of Failure — Practice

### P1. Classify the fault

**Difficulty:** Easy · **Type:** Comparison · **Concepts:** fault types

Hardware (H), software (S) or human (U)? (a) an engineer drops the wrong database table, (b) a leap-day date bug crashes every server, (c) a power supply fails, (d) a configuration with a typo is pushed to all servers.

<details>
<summary>Answer</summary>

(a) U, (b) S, (c) H, (d) U (a human error that becomes a correlated software fault).

</details>

### P2. Find the SPOF

**Difficulty:** Medium · **Type:** Failure · **Concepts:** single points of failure

Design: 2 load balancers (active-passive), 8 app servers in two zones, one PostgreSQL server with nightly backups, Redis with a replica. What is the biggest SPOF and its fix?

<details>
<summary>Answer</summary>

The single PostgreSQL server: if it fails, the system is down until a restore (losing up to a day of data). Add a replica with automated failover (synchronous or semi-synchronous for critical data) and point-in-time recovery from continuous log archiving.

</details>

### P3. Correlated failure

**Difficulty:** Medium · **Type:** MCQ · **Concepts:** correlated faults

Which change best protects against a bad release taking down all 20 replicas of a service?

- A) Adding 20 more replicas
- B) Canary deployment to a small fraction first, with automatic rollback on errors
- C) Bigger servers
- D) A second load balancer

<details>
<summary>Answer</summary>

**Answer:** B) Canary deployment to a small fraction first, with automatic rollback on errors

</details>

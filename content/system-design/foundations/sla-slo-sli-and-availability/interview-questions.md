# SLA, SLO, SLI and Availability Math — Interview Questions

## Beginner

### Q1. What are SLI, SLO and SLA?

**Style:** Direct

<details>
<summary>Answer</summary>

An SLI is a measured indicator of service behaviour (for example the percentage of requests served successfully within 300 ms). An SLO is the target for that indicator over a window (99.9 % over 30 days). An SLA is a contract with customers that promises a service level and defines penalties, such as service credits, if it is missed; it is usually looser than the internal SLO.

</details>

### Q2. How much downtime does 99.9 % availability allow?

**Style:** Direct

<details>
<summary>Answer</summary>

About 8.76 hours per year, 43.2 minutes per 30-day month, or 1.44 minutes per day. 99.99 % allows about 52.6 minutes per year.

</details>

## Intermediate

### Q3. Three services in series each have 99.9 % availability. What is the availability of the whole path?

**Style:** Output/prediction

<details>
<summary>Answer</summary>

0.999³ ≈ 0.997, so about 99.7 % — lower than any single service, because the request fails if any of them fails.

</details>

### Q4. Two independent replicas each have 99 % availability. What is the availability if either one can serve?

**Style:** Output/prediction

<details>
<summary>Answer</summary>

1 − (0.01 × 0.01) = 0.9999, so 99.99 %. This assumes independent failures; shared power, network, region or the same faulty release make real availability lower.

</details>

### Q5. What is an error budget and how is it used?

**Style:** How

<details>
<summary>Answer</summary>

The error budget is the allowed unreliability, 1 − SLO. With a 99.9 % monthly SLO, 0.1 % of requests (or about 43 minutes) may fail. While budget remains, teams release features normally; when it is spent, they slow releases and prioritise reliability. It makes the trade-off between speed of change and stability explicit and measurable.

</details>

### Q6. Why should an SLA be looser than the SLO?

**Style:** Why

<details>
<summary>Answer</summary>

So the team has a buffer: internal alerts fire when the SLO is threatened, giving time to fix problems before the contractual threshold, which carries financial penalties, is crossed.

</details>

## Advanced

### Q7. Why is moving from 99.9 % to 99.99 % so much more expensive?

**Style:** Trade-off

<details>
<summary>Answer</summary>

The monthly budget drops from about 43 minutes to about 4 minutes, which is less than the time for a person to be paged, log in and diagnose. Recovery must therefore be automatic: redundancy across availability zones, automated failover for databases and load balancers, health checks, canary releases with automatic rollback, and no single points of failure anywhere in the request path, including DNS and configuration systems.

</details>

### Q8. Why is "the process is running" a poor SLI?

**Style:** Trap

<details>
<summary>Answer</summary>

A process can run while returning errors, timing out on a dependency, or being unreachable through the load balancer. SLIs should reflect what users experience: the proportion of real (or synthetic) requests that succeed within a latency threshold, measured at the edge.

</details>

### Q9. A request chain has 10 services at 99.9 % each, giving about 99 %. How do you improve end-to-end availability without making each service better?

**Style:** Design

<details>
<summary>Answer</summary>

Shorten the synchronous chain (merge calls, call services in parallel rather than in sequence), move non-essential work to asynchronous queues, add timeouts and fallbacks so optional services can fail without failing the request (graceful degradation), cache results of dependencies, and run each service redundantly so a single instance failure does not count as service failure.

</details>

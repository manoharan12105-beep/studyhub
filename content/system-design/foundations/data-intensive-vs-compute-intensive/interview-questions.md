# Data-Intensive vs Compute-Intensive Systems — Interview Questions

## Beginner

### Q1. What is the difference between a data-intensive and a compute-intensive system?

**Style:** Comparison

<details>
<summary>Answer</summary>

In a data-intensive system the limiting factor is the amount, complexity or speed of change of data: time is spent in storage, network and serialisation, and the CPU mostly waits. In a compute-intensive system the limiting factor is calculation: the CPU or GPU is busy (transcoding, ML training, simulations). They are scaled with different tools.

</details>

### Q2. Your feed endpoint is slow. Should you upgrade CPUs?

**Style:** Scenario

<details>
<summary>Answer</summary>

Probably not. A feed is data-intensive: measure where time goes, and you will usually find database queries, missing indexes, N+1 query patterns or network round trips. Fix those with indexes, batching, caching or precomputed feeds; CPU upgrades help only if profiling shows the CPU is saturated.

</details>

## Intermediate

### Q3. How would you scale a compute-intensive feature such as video transcoding?

**Style:** How

<details>
<summary>Answer</summary>

Make it asynchronous and parallel: the upload service stores the file and puts a job on a queue; a fleet of workers (possibly GPU-equipped) pulls jobs, splits videos into chunks and processes them in parallel; workers autoscale on queue depth. Keeping it off the request path means slow computation never blocks user-facing requests.

</details>

### Q4. Give an example of one product that is both data-intensive and compute-intensive.

**Style:** Direct

<details>
<summary>Answer</summary>

A video platform: serving video segments to millions of viewers is data-intensive (CDN, storage, bandwidth), while transcoding uploads into many resolutions and computing recommendations is compute-intensive (worker fleets, GPUs, batch jobs). Designs separate the two so each scales independently.

</details>

## Advanced

### Q5. How do you prove where the time goes before choosing a fix?

**Style:** Debugging

<details>
<summary>Answer</summary>

Measure: use distributed tracing to see the time spent per span (database calls, downstream services, serialisation), check CPU utilisation and run queue length on the hosts, look at database slow-query logs and execution plans, and compare wall-clock time with CPU time in a profiler. High wall-clock time with low CPU time means waiting on I/O (data-intensive); CPU near saturation with time in application frames means compute-bound.

</details>

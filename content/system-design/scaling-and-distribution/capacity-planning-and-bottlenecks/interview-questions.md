# Capacity Planning and Finding Bottlenecks — Interview Questions

## Beginner

### Q1. What is capacity planning?

**Style:** Direct

<details>
<summary>Answer</summary>

Estimating the resources a system needs — instances, database capacity, cache memory, storage, bandwidth — to handle expected peak load with headroom for spikes, failures and growth, and validating those numbers with measurements and load tests.

</details>

### Q2. Why not run servers at 100 % utilisation to save money?

**Style:** Why not

<details>
<summary>Answer</summary>

Near full utilisation, requests queue and latency grows non-linearly (at 90 % utilisation waiting time is many times what it is at 50 %); there is no room for traffic spikes, uneven load or the failure of an instance or zone. Teams target around 60–70 % at peak and use autoscaling.

</details>

## Intermediate

### Q3. State Little's law and give a practical use.

**Style:** How

<details>
<summary>Answer</summary>

Average number of items in a system = arrival rate × average time in the system (L = λW). Example: 500 requests/s with 0.1 s latency means about 50 concurrent requests, which sizes thread and connection pools. It also shows that if latency rises tenfold, concurrency rises tenfold, exhausting pools.

</details>

### Q4. How do you find the bottleneck in a slow system?

**Style:** How

<details>
<summary>Answer</summary>

Load the system and measure each tier and resource: throughput, latency percentiles and errors per service, and utilisation, saturation (queue lengths, wait times) and errors for CPU, memory, disk, network, connection pools and threads (the USE method). Use tracing to see which hop dominates request time. The resource that saturates first is the bottleneck; after fixing it, measure again because the bottleneck moves.

</details>

### Q5. Why should capacity plans consider the loss of an availability zone?

**Style:** Why

<details>
<summary>Answer</summary>

Zone outages happen, and when one occurs its share of instances disappears at once while traffic stays the same. If the remaining instances would run above their capacity, the zone failure becomes a full outage. Plans check that the surviving fleet can carry peak load (possibly with degraded features) until autoscaling or recovery.

</details>

## Advanced

### Q6. You doubled the API servers but throughput stayed flat and database latency rose. Explain.

**Style:** Debugging

<details>
<summary>Answer</summary>

The database was the bottleneck. More API servers sent more concurrent queries and connections, increasing contention, lock waits and context switching, so each query became slower while total throughput did not improve. Fix the database side — slow queries, indexes, caching, read replicas, connection pooling limits — before adding application capacity.

</details>

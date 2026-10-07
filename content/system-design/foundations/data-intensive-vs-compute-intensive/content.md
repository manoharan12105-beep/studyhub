# Data-Intensive vs Compute-Intensive Systems

**Module:** Foundations · **Interview priority:** Frequently asked

## What Is It?

Ask of any feature: **where does the time go?**

- **Data-intensive:** most time is spent storing, finding and moving data — reading from databases, crossing the network, serialising responses. The CPU mostly waits. Examples: a social feed, chat delivery, bank transactions, dashboards, log search.
- **Compute-intensive:** most time is spent calculating. The CPU (or GPU) is busy. Examples: video transcoding, image processing, machine-learning training, simulations, cryptographic work.

## Why It Exists

The fixes are completely different, and they cost money. Doubling CPU cores does nothing for a feed that waits 80 ms on a database query; adding a cache does nothing for a video that takes 20 minutes to transcode. Diagnosing the type first avoids paying for the wrong component.

## How It Works

| | Data-intensive | Compute-intensive |
|---|----------------|-------------------|
| Bottleneck | Database, disk, network, memory | CPU or GPU |
| Typical worries | Query speed, data volume, concurrent users, consistency, a node dying | Calculation time, parallelism, compute cost, CPU vs GPU |
| Tools | Indexes, caching, replication, sharding, CDNs, denormalisation | Faster algorithms, parallel workers, GPUs, batch jobs, queues |
| Scaling unit | More copies and partitions of data | More workers running the calculation |
| Example fix | Cache the feed; index `posted_by` | Split a video into chunks and transcode in parallel |

Most web backends are data-intensive: a typical request does a few milliseconds of CPU work and spends the rest waiting on I/O. That is why the majority of this subject is about data: storage, caching, replication and partitioning.

### One product, both kinds

A video platform is **data-intensive** when serving videos (bytes moved from CDN edges to millions of viewers) and **compute-intensive** when transcoding uploads and computing recommendations. Judge **per feature**, not per product. A common design separates them: the compute-heavy part runs on worker fleets fed by a queue, so it can scale and fail independently of the request-serving path.

**Think about it:** an API endpoint's latency is 900 ms. Profiling shows 20 ms in application code, 30 ms in JSON serialisation and 850 ms waiting on three sequential database queries. Which kind of problem is it, and what would you try first?

<details>
<summary>Answer</summary>

Data-intensive: about 94 % of the time is waiting on the database. Try, in order: check the queries' execution plans and indexes, run independent queries in parallel instead of sequentially, combine queries, and cache results that are read often. Faster CPUs would save at most a few milliseconds.

</details>

## Common Traps

> [!WARNING]
> **Common trap:** "The service is slow, so give it bigger machines." Measure first. If the time is spent waiting on I/O, more CPU only raises the bill.

## Interview Follow-up

- *"Is a chat application data- or compute-intensive?"* Data-intensive: it stores and routes huge numbers of small messages; the challenges are connections, delivery, ordering and storage, not computation.

## Key Takeaways

- Data-intensive: time lost moving and finding data → fix with indexes, caches, replicas, partitions, CDNs.
- Compute-intensive: time lost calculating → fix with better algorithms, parallel workers, GPUs, queues.
- Classify each feature separately, and measure before buying hardware.

# Back-of-the-Envelope Estimation

**Module:** Foundations · **Interview priority:** Core

## What Is It?

**Back-of-the-envelope estimation** is quick, rough arithmetic that turns requirements ("10 million daily users") into the numbers a design depends on: requests per second, peak load, storage per year, network bandwidth and machine counts. The goal is the right **order of magnitude**, not precision. Knowing whether you need 1 server or 100, or 1 TB or 1 PB, decides the architecture.

## Why It Exists

Without numbers, every component is a guess. With them, decisions become obvious:

- 50 writes/s fits comfortably on one relational database; 500,000 writes/s does not.
- 2 TB of data fits on one machine; 2 PB must be partitioned.
- 9 Gbps of image traffic should come from a CDN, not your application servers.

Estimation also shows an interviewer that you reason quantitatively.

## How It Works

### The handful of facts you need

```text
1 day      = 86,400 s  ≈ 10^5 s   (rounding up makes rates ~14 % low — fine for estimates)
1 month    ≈ 2.5 × 10^6 s
1 year     ≈ 3 × 10^7 s
1 million requests/day ≈ 12 requests/s

KB = 10^3 bytes · MB = 10^6 · GB = 10^9 · TB = 10^12 · PB = 10^15
1 byte = 8 bits  → 1 GB/s = 8 Gbps
```

### The standard steps

```text
1. Users        DAU (daily active users), actions per user per day
2. Rate         average RPS = DAU × actions per day ÷ 86,400
3. Peak         peak RPS ≈ average × 2–10  (pick and state a factor; 3 is common)
4. Read/write   split the rate into reads and writes
5. Storage      new items/day × size × retention × replication factor
6. Bandwidth    requests/s × response size  (convert bytes → bits for network)
7. Machines     peak RPS ÷ RPS one server handles, plus headroom
```

### Worked example: a photo-sharing app

Assumptions (stated, then used): **10 million DAU**; each user views **50 photos** and uploads **0.2 photos** per day; a stored photo is **2 MB**; a feed image served to clients is **200 KB**; peak factor **3**; storage replication factor **3**.

| Quantity | Calculation | Result |
|----------|-------------|--------|
| Reads per day | 10 M × 50 | 500 M |
| Average read RPS | 500 M ÷ 86,400 | ≈ 5,800/s |
| Peak read RPS | 5,800 × 3 | ≈ 17,000/s |
| Writes per day | 10 M × 0.2 | 2 M |
| Average write RPS | 2 M ÷ 86,400 | ≈ 23/s (peak ≈ 70/s) |
| Read:write ratio | 500 M : 2 M | 250 : 1 |
| New storage per day | 2 M × 2 MB | 4 TB |
| Per year | 4 TB × 365 | ≈ 1.5 PB |
| With 3 copies | 1.5 PB × 3 | ≈ 4.4 PB raw |
| Read bandwidth | 500 M × 200 KB ÷ 86,400 | ≈ 1.16 GB/s ≈ 9.3 Gbps average |

What the numbers tell us:

- **250:1 reads to writes** → invest in the read path: caches, CDN, precomputed feeds.
- **Petabytes of photos** → object storage, not a database; the database stores only metadata and a link.
- **~9 Gbps (≈ 28 Gbps at peak) of images** → a CDN must serve them.
- **~23 writes/s of metadata** → a single relational primary handles the writes for a long time; sharding can wait.

### From RPS to servers

If one application server handles about 1,000 simple requests/s (an assumption to state, then verify with a load test), 17,000 peak RPS needs 17 servers. Keeping utilisation at about 70 % to absorb spikes and a server failure gives 17 ÷ 0.7 ≈ **25 servers**. See [Capacity Planning](../../scaling-and-distribution/capacity-planning-and-bottlenecks/content.md).

### Latency numbers worth knowing

Orders of magnitude only; real hardware varies.

| Operation | Approximate time |
|-----------|------------------|
| Main-memory reference | 100 ns |
| Redis/Memcached GET inside a data centre (network round trip) | 0.2–1 ms |
| SSD random read | ~0.1 ms |
| Round trip within one data centre | ~0.5 ms |
| Indexed database query | 1–10 ms |
| Hard-disk seek | ~10 ms |
| Round trip between continents | 100–150 ms |

Memory is about 1,000× faster than SSD access, and a cross-continent trip costs about as much as hundreds of local round trips. Caches and CDNs exist because of these gaps.

**Think about it:** a URL shortener stores 100 million new links per month, each about 500 bytes with metadata, kept for 10 years. How much storage is that, before replication?

<details>
<summary>Answer</summary>

100 M × 12 months × 10 years = 12 billion links. 12 × 10⁹ × 500 bytes = 6 × 10¹² bytes = **6 TB**. Small enough for one large machine or a few shards; with 3 replicas, 18 TB.

</details>

## What Can Fail

- **False precision.** "5,787.04 requests per second" wastes time; "about 6,000" is the right answer.
- **Forgetting peaks.** Averages hide the traffic that actually breaks systems.
- **Bits vs bytes.** Network links are sold in bits per second; storage and file sizes are in bytes.
- **Forgetting replication and indexes** in storage estimates (often 2–3× the raw data).

## Common Traps

> [!WARNING]
> **Common trap:** estimating and then never using the numbers. Every estimate should end in a sentence that starts with "so…": "so we need a CDN", "so one primary database handles writes".

## Interview Follow-up

- *"How many servers do we need?"* Peak RPS ÷ measured per-server capacity, divided by a target utilisation (for example 0.7), plus at least one spare for failure.

## Key Takeaways

- Estimate in order: users → RPS → peak → read/write split → storage → bandwidth → machines.
- 1 day ≈ 10⁵ s; 1 million per day ≈ 12 per second; 1 GB/s = 8 Gbps.
- Round aggressively, state assumptions, and turn every number into a design decision.

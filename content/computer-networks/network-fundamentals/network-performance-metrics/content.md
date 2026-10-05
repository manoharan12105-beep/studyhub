# Network Performance: Bandwidth, Throughput, Latency, Jitter and Packet Loss

**Module:** Network Fundamentals · **Interview priority:** Core

## What Is It?

Five numbers describe how well a network carries data:

| Metric | Question it answers | Unit |
|--------|---------------------|------|
| **Bandwidth** | How much *could* the link carry? (capacity) | bits per second (Mbit/s, Gbit/s) |
| **Throughput** | How much *is actually* delivered? | bits per second |
| **Latency** | How long does one piece of data take to arrive? | milliseconds |
| **Jitter** | How much does latency vary from packet to packet? | milliseconds |
| **Packet loss** | What fraction of packets never arrive? | percent |

**RTT** (round-trip time) is the time for a message to go and its reply to come back — what `ping` reports.

## Why It Exists

"The network is slow" can mean five different problems with five different fixes. A video call breaks up because of jitter and loss, not bandwidth; an API with 40 sequential calls is slow because of latency, not bandwidth. Naming the right metric is the first step of every performance investigation.

## How It Works

### Bandwidth vs throughput

**Bandwidth** is the maximum rate of a link — a 100 Mbit/s plan, a 1 Gbit/s Ethernet port. **Throughput** is what you actually get, and it is always ≤ the bandwidth of the slowest link on the path (the **bottleneck**). Throughput is reduced by:

- other traffic sharing links (congestion),
- protocol overhead (headers, acknowledgements),
- TCP's window limits and slow start (see [Congestion Control](../../flow-and-congestion-control/tcp-congestion-control/content.md)),
- packet loss and retransmissions,
- slow servers or disks.

> [!TIP]
> Analogy: bandwidth is the number of lanes on a highway; throughput is how many cars actually pass per hour; latency is how long one car takes to drive the road.

### Latency: the four delays

Each packet's delay at each hop is the sum of:

| Delay | Cause | Formula / size |
|-------|-------|----------------|
| **Processing** | Router reads the header, looks up the route | Microseconds |
| **Queuing** | Waiting behind other packets in a busy router | 0 to many ms — the variable part |
| **Transmission** | Pushing all the packet's bits onto the link | packet size ÷ bandwidth |
| **Propagation** | The signal travelling the distance | distance ÷ signal speed (≈ 200,000 km/s in fibre) |

Example: a 1,500-byte packet on a 100 Mbit/s link has a transmission delay of 12,000 bits ÷ 100,000,000 bit/s = **0.12 ms**. Sending it 1,000 km adds a propagation delay of 1,000 ÷ 200,000 s = **5 ms**. Over long distances, propagation dominates — more bandwidth does not make light faster.

### Jitter

**Jitter** is the variation in latency. If packets arrive after 20, 21, 45, 19 ms, the average is fine but the spread is large. Real-time audio and video need packets at a steady pace; apps use a **jitter buffer** that holds packets briefly to smooth playback, at the cost of extra delay. Jitter mostly comes from changing queuing delay.

### Packet loss

Packets are dropped when router queues overflow (congestion), by faulty links or Wi-Fi interference, or by firewalls. TCP detects loss and retransmits, which costs time and makes TCP slow down. UDP-based real-time apps usually skip lost data, producing glitches.

### Bandwidth-delay product

**BDP = bandwidth × RTT** = how many bits are "in flight" on the path. A 100 Mbit/s path with 50 ms RTT holds 100,000,000 × 0.05 = 5,000,000 bits ≈ 625 KB. A TCP sender must allow that much unacknowledged data in flight to use the full bandwidth — the reason TCP window sizes matter on long paths.

## Real World

| Application | Most sensitive to |
|-------------|-------------------|
| Downloading a large file, backups | Bandwidth / throughput |
| REST API with many sequential calls, database round trips | Latency (RTT) |
| Video calls, VoIP, online games | Latency, jitter, loss |
| Video streaming (Netflix, YouTube) | Throughput (buffering hides jitter) |

The backend view of these metrics — round-trip counting, connection reuse, pooling — is in [Network Performance for Backend Systems](../../performance/network-performance-for-backends/content.md).

## Comparison

| | Bandwidth | Throughput | Latency |
|---|-----------|------------|---------|
| Meaning | Capacity | Actual delivery rate | Delay per piece of data |
| Unit | bit/s | bit/s | ms |
| Improved by | Faster links | Removing bottlenecks, loss, congestion | Shorter distance, fewer round trips, less queuing |

## Common Traps

> [!WARNING]
> **Common trap:** "More bandwidth means lower latency." Bandwidth reduces only the *transmission* delay. Propagation delay (distance) and round trips stay the same — a 1 Gbit/s link to a server in another continent still has a 150 ms+ RTT.

- **Bits vs bytes:** a "100 Mbps" plan delivers at most 12.5 MB/s (divide by 8), less overhead.
- **Throughput can never exceed the bottleneck link**, however fast your own connection is.

## Interview Follow-up

- *"Bandwidth vs throughput?"* Capacity vs achieved rate.
- *"Why is a web page slow on a fast connection?"* Many round trips (DNS, TCP, TLS, many requests) × high RTT — latency-bound, not bandwidth-bound.

## Key Takeaways

- Bandwidth = capacity; throughput = actual; latency = delay; jitter = variation in delay; loss = packets that never arrive.
- Latency = processing + queuing + transmission + propagation; distance sets a floor.
- Throughput ≤ bottleneck bandwidth. BDP = bandwidth × RTT.
- Interactive apps care about latency; bulk transfers care about throughput; real-time media cares about jitter and loss.

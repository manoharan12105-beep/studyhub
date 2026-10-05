# TCP Congestion Control

**Module:** Flow and Congestion Control · **Interview priority:** Frequently asked

## What Is It?

**Congestion control** stops TCP senders from overloading the **network** — the routers and links between the hosts. Each sender keeps a **congestion window (cwnd)**: its own estimate of how much data the network can carry for this connection. It probes for more capacity by growing cwnd and backs off when it sees signs of congestion (packet loss, rising delay, ECN marks).

```text
Bytes the sender may have unacknowledged = min(rwnd, cwnd)
                                               │      └ congestion control: protects the network
                                               └ flow control: protects the receiver
```

## Why It Exists

When too many packets arrive at a router, its queue fills and it drops packets. If senders reacted by just retransmitting faster, the network would carry mostly retransmissions and almost no useful data — **congestion collapse**, which actually happened on the Internet in 1986. Van Jacobson's congestion control (1988) made TCP senders slow down on loss. It also shares bandwidth roughly fairly between competing connections.

## How It Works

The classic algorithm (TCP Reno/NewReno) has a few phases. cwnd is counted in MSS-sized segments here for simplicity.

### 1. Slow start

- A new connection starts with a small cwnd (the **initial window**, typically **10 segments** today).
- For every ACK received, cwnd grows by 1 segment → cwnd **doubles every RTT** — exponential growth. ("Slow" only compared with sending everything at once.)
- Continues until cwnd reaches the **slow-start threshold (ssthresh)** or loss occurs.

### 2. Congestion avoidance

- Above ssthresh, cwnd grows by about **1 segment per RTT** — linear, careful probing.
- This is the **additive increase** of AIMD.

### 3. Reacting to loss

| Signal | Meaning | Reaction (Reno) |
|--------|---------|-----------------|
| **3 duplicate ACKs** | One segment lost, later ones still arriving — mild congestion | **Fast retransmit** the segment; ssthresh = cwnd / 2; cwnd = ssthresh (**fast recovery**), then continue in congestion avoidance |
| **Retransmission timeout** | Nothing getting through — severe congestion | ssthresh = cwnd / 2; **cwnd = 1 segment**; restart slow start |

Halving on loss is the **multiplicative decrease** of **AIMD** (additive increase, multiplicative decrease) — the pattern that makes competing flows converge to a fair share.

### The sawtooth

Plotted over time, cwnd climbs steeply (slow start), then slowly (congestion avoidance), drops by half at each loss and climbs again — a **sawtooth**. The trace below shows the numbers.

### Example trace: the sawtooth in numbers

Initial cwnd 1 (textbook style), ssthresh 16:

```text
RTT:   1  2  3  4   5   6   7   8   9   10
cwnd:  1  2  4  8  16  17  18  19  20   — 3 dup ACKs at 20 → ssthresh 10, cwnd 10
then:  10 11 12 …  (congestion avoidance)
If a timeout had occurred instead: ssthresh 10, cwnd 1, slow start again (1, 2, 4, 8, 10, 11 …)
```

### Modern algorithms

| Algorithm | Idea | Where |
|-----------|------|-------|
| Reno / NewReno | Loss-based AIMD as above | Classic reference |
| **CUBIC** | cwnd grows along a cubic curve after a loss; better for fast, long paths | Default on Linux, Windows, macOS |
| **BBR** | Measures bottleneck bandwidth and minimum RTT, paces at that rate instead of filling buffers until loss | Used by Google services and YouTube; available in Linux |

**ECN** (Explicit Congestion Notification) lets routers *mark* packets instead of dropping them, so senders can slow down without loss.

## Why Backend Developers Care

- **New connections start slow.** Slow start means a fresh connection cannot use full bandwidth for several RTTs — another reason to **reuse connections** (keep-alive, pooling) and why a response under ~14 KB (10 × MSS) fits in the first round trip.
- **Packet loss is expensive.** Even 1 % loss can cut TCP throughput dramatically, because every loss halves cwnd.
- **Bufferbloat:** oversized router buffers delay loss signals, so latency grows huge under load; BBR and active queue management address it.

## Flow Control vs Congestion Control

| | Flow control | Congestion control |
|---|--------------|--------------------|
| Protects | Receiver's buffer | Network routers and links |
| Window | rwnd — advertised by the receiver | cwnd — computed by the sender |
| Signal | Explicit (Window field) | Implicit (loss, delay) or ECN |
| Typical cause of slowdown | Slow receiving application | Busy or slow links on the path |

## Common Traps

- **"Slow start is slow."** It grows exponentially; it is "slow" only compared with blasting the whole window at once.
- **"cwnd is advertised to the other side."** cwnd is private to the sender; only rwnd is sent in the header.
- **"Timeout and 3 duplicate ACKs are treated the same."** Duplicate ACKs prove data is still flowing → halve; a timeout suggests a severe problem → restart from 1.
- **"UDP applications are free from congestion control."** UDP has none built in, which is why well-behaved UDP protocols (QUIC, WebRTC) implement their own.

## Interview Follow-up

- *"What is AIMD?"* Additive increase (+1 MSS per RTT) and multiplicative decrease (halve on loss) — stable and fair.
- *"Why does a new connection download slowly at first?"* Slow start begins with a small cwnd and doubles each RTT.

## Key Takeaways

- cwnd = sender's estimate of network capacity; send ≤ min(rwnd, cwnd).
- Slow start (double per RTT) until ssthresh; congestion avoidance (+1 per RTT) afterwards.
- 3 dup ACKs → fast retransmit, halve (fast recovery). Timeout → cwnd = 1, slow start.
- AIMD gives stability and fairness; CUBIC and BBR are modern variants.

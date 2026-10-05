# TCP Flow Control and the Sliding Window

**Module:** Flow and Congestion Control · **Interview priority:** Core

## What Is It?

**Flow control** stops a fast sender from overwhelming a slow **receiver**. The receiver tells the sender how much free buffer space it has — the **receive window (rwnd)** — in every segment's Window field. The sender never has more unacknowledged data in flight than that window allows.

## Why It Exists

Data arriving at a host waits in the socket's **receive buffer** until the application reads it. If the application is slow (a busy thread, a slow disk, a phone in power-saving mode) and the sender keeps sending, the buffer overflows and data is dropped — wasting the network and forcing retransmissions. Flow control lets the receiver set the pace.

## How It Works

### Stop-and-wait vs sliding window

The simplest scheme sends one segment and waits for its ACK — **stop-and-wait**. On a path with 100 ms RTT that allows only one segment per 100 ms, regardless of bandwidth. A **sliding window** lets the sender have many segments in flight at once.

```text
Sender's view of its byte stream (window = 4,000 bytes):

 already ACKed │ sent, not yet ACKed │ may send now │ cannot send yet
 ──────────────┼─────────────────────┼──────────────┼────────────────
  ... 1000     │ 1001 ──────── 3000  │ 3001 ── 5000 │ 5001 …
               └──────── window (4,000 bytes) ──────┘
When ACK 2001 arrives, the left edge moves to 2001 and the window slides right to 6000.
```

- Left edge = oldest unacknowledged byte.
- Right edge = left edge + advertised window.
- As ACKs arrive, the window **slides** forward; new data can be sent.

### The receive window

```text
rwnd = receive buffer size − data received but not yet read by the application
```

1. The receiver advertises rwnd in every ACK.
2. If the application reads slowly, rwnd shrinks; the sender slows down.
3. If the buffer fills, the receiver advertises **rwnd = 0** (**zero window**). The sender stops and periodically sends **window probes** (persist timer) until the receiver announces space again (a **window update**).

### Window scaling

The Window field is 16 bits — at most 65,535 bytes. That is far too small for fast, long paths (the [bandwidth-delay product](../../network-fundamentals/network-performance-metrics/content.md) of 1 Gbit/s × 100 ms is 12.5 MB). The **window scale** option, negotiated in the SYN, multiplies the field by 2ⁿ (up to 2¹⁴), allowing windows up to about 1 GB.

### Throughput limit from the window

```text
Maximum throughput ≈ window ÷ RTT
64 KB window, 100 ms RTT  →  65,535 bytes / 0.1 s ≈ 655 KB/s ≈ 5.2 Mbit/s  (however fast the link is)
```

## Flow Control vs Congestion Control

| | Flow control | Congestion control |
|---|--------------|--------------------|
| Protects | The **receiver** | The **network** (routers and links in between) |
| Signal | Receiver's advertised window (rwnd) — explicit | Packet loss, delay, ECN marks — inferred by the sender |
| Variable | rwnd (set by receiver) | cwnd (computed by sender) |
| Problem solved | Receive buffer overflow | Router queue overflow / congestion collapse |

The sender uses **both**: it may have at most **min(rwnd, cwnd)** bytes unacknowledged. See [Congestion Control](../tcp-congestion-control/content.md).

## Real World

- `ss -ti` on Linux shows `rcv_space`, `snd_wnd` and `cwnd` for each connection.
- A Wireshark "TCP ZeroWindow" means the **receiving application** is not reading fast enough — look at that application (slow consumer, blocked thread), not at the network.
- A Kafka consumer or a JDBC client that stops reading results causes the server side's send buffer to fill, and the server's writes block — flow control propagating back-pressure.

## Common Traps

> [!WARNING]
> **Common trap:** "Flow control and congestion control are the same thing." Flow control protects the **receiver** using the window the receiver advertises; congestion control protects the **network** using a window the sender infers.

- **"The window is measured in segments."** It is in **bytes**.
- **"Zero window means the network is congested."** It means the receiving application is not reading.

## Interview Follow-up

- *"How does sliding window improve over stop-and-wait?"* Many segments in flight → fills the pipe; throughput ≈ window ÷ RTT instead of segment ÷ RTT.
- *"What happens when rwnd is 0?"* Sender pauses and sends window probes until the receiver opens the window.

## Key Takeaways

- Flow control: receiver advertises rwnd = free buffer space; sender keeps unACKed data ≤ rwnd.
- Sliding window: many bytes in flight; window slides as ACKs arrive.
- Zero window → sender pauses and probes. Window scaling allows windows beyond 64 KB.
- Throughput ≤ window ÷ RTT. Effective window = min(rwnd, cwnd).

# Switching Techniques: Circuit, Message and Packet Switching

**Module:** Network Fundamentals · **Interview priority:** Frequently asked

## What Is It?

**Switching** is how a network moves data from a sender to a receiver through intermediate nodes when there is no direct wire between them. There are three classic techniques:

| Technique | Idea | Example |
|-----------|------|---------|
| **Circuit switching** | Reserve a dedicated path first, then send | The classic landline telephone network |
| **Message switching** | Send the whole message hop by hop; each node stores it completely, then forwards | Old telegraph and early email relays |
| **Packet switching** | Split data into packets; each is forwarded independently | The Internet |

## Why It Exists

Links are expensive and shared by many users. Each technique makes a different trade-off between **guaranteed quality** (reserve capacity) and **efficient sharing** (use capacity only when sending). Computer traffic is bursty — a browser is idle, then downloads 3 MB in a second — which is why the Internet chose packet switching.

## How It Works

### Circuit switching

Three phases: **setup** (reserve a path and capacity on every link), **data transfer**, **teardown**.

```text
Setup:     A ──► S1 ──► S2 ──► B     (capacity reserved on every link)
Transfer:  A ════ S1 ════ S2 ════ B  (constant rate, same path, in order)
Teardown:  release the reservation
```

- **Pros:** guaranteed bandwidth, constant delay, data arrives in order — ideal for voice.
- **Cons:** setup delay before any data; reserved capacity is wasted during silence; if a link fails, the call drops; the number of simultaneous calls is fixed.

### Message switching

No path is reserved. The entire message travels hop by hop; every node **stores** the whole message, then **forwards** it (store-and-forward).

- **Pros:** no setup; links are shared.
- **Cons:** each node needs storage for whole messages; large messages block links and add big delays at every hop. Obsolete, replaced by packet switching.

### Packet switching

Data is split into small **packets**, each with a header holding the destination address. Routers store each packet briefly, look up the destination and forward it — packets of many conversations interleave on the same links.

```text
A: [P1][P2][P3] ──► R1 ──► R2 ──► B        P2 may take R1 → R3 → R2
                      ╲         ╱           packets can arrive out of order;
                        ─► R3 ─             TCP at B puts them back in order
```

- **Pros:** efficient sharing (no idle reserved capacity), resilient (packets route around failures), no setup delay, pipelining across hops (a router forwards packet 1 while receiving packet 2).
- **Cons:** variable delay (queuing), possible loss when queues overflow, out-of-order arrival, header overhead. Reliability is added by higher layers (TCP).

Packet switching has two styles:

| | Datagram | Virtual circuit |
|---|----------|-----------------|
| Path | Each packet routed independently | Path set up first; all packets follow it |
| Header carries | Full destination address | A short circuit identifier |
| Order | May arrive out of order | In order |
| Examples | IP (the Internet) | Historic X.25, Frame Relay, ATM; MPLS labels are similar in spirit |

> [!NOTE]
> TCP is "connection-oriented", but that connection exists only in the two end hosts. The routers in between still switch each IP packet as an independent datagram — TCP is not a circuit.

## Comparison

| | Circuit | Message | Packet |
|---|---------|---------|--------|
| Setup before data | Yes | No | No (datagram) |
| Dedicated path | Yes | No | No |
| Unit sent | Continuous stream | Whole message | Small packets |
| Bandwidth use | Wasteful when idle | Shared | Shared, efficient |
| Delay | Constant after setup | High at each hop | Low, but variable |
| Failure of a link | Connection lost | Rerouted | Rerouted |
| Best for | Constant-rate voice | — (obsolete) | Bursty data: web, APIs, files |

**Think about it:** Mobile voice calls today (VoLTE) run over IP. How do they get circuit-like quality on a packet network?

<details>
<summary>Answer</summary>

By prioritising voice packets (quality-of-service queues), using small packets sent at a steady rate, and jitter buffers at the receiver. The network is still packet-switched; it just treats voice packets preferentially.

</details>

## Common Traps

- **"TCP makes the Internet circuit-switched."** No — TCP state lives only in the end hosts; each IP packet is still routed independently.
- **"Packet switching guarantees delivery."** IP is best-effort: packets can be lost, duplicated or reordered. TCP adds reliability on top.
- **"Packet = message."** A message (an HTTP response, a file) is usually many packets.

## Interview Follow-up

- *"Why did the Internet choose packet switching?"* Bursty data, efficient sharing, resilience to failures, no setup delay.
- *"Where is store-and-forward still used?"* Every packet router stores each packet fully before forwarding it.

## Key Takeaways

- Circuit switching reserves a path: guaranteed quality, wasted capacity, fragile.
- Message switching stores and forwards whole messages: obsolete.
- Packet switching splits data into packets routed independently: efficient and resilient, but delay varies and packets can be lost or reordered.
- The Internet = datagram packet switching (IP); reliability comes from TCP at the ends.

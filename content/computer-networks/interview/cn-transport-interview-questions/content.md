# Interview Questions: TCP, UDP, Flow and Congestion Control

**Module:** Interview Preparation · **Interview priority:** Core

## What Is It?

A cross-topic bank of [interview questions](interview-questions.md) on the transport layer: ports and sockets, TCP vs UDP, the three-way handshake, connection termination and TIME_WAIT, reliability, flow control and congestion control.

## Why It Matters

"TCP vs UDP" and "explain the three-way handshake" are among the most asked networking questions anywhere. Backend interviews follow up with connection states, timeouts, TIME_WAIT/CLOSE_WAIT and connection reuse — real production issues.

## Core Concept

### Answer patterns

- **Handshake/termination:** draw the sequence with flags, sequence/ack numbers and states; explain *why* each step exists.
- **TCP vs UDP:** give the comparison, then pick one for a concrete scenario and justify it.
- **Flow vs congestion control:** receiver vs network, rwnd vs cwnd, explicit vs inferred.

### Coverage

| Area | Lessons |
|------|---------|
| Ports and sockets | [Transport Layer and Ports](../../transport-layer/transport-layer-and-ports/content.md), [Sockets](../../transport-layer/sockets-and-connections/content.md) |
| Protocols | [UDP](../../transport-layer/udp-protocol/content.md), [TCP Reliability](../../transport-layer/tcp-segments-and-reliability/content.md), [TCP vs UDP](../../transport-layer/tcp-vs-udp/content.md) |
| Connections | [Three-Way Handshake](../../transport-layer/tcp-three-way-handshake/content.md), [Termination and States](../../transport-layer/tcp-connection-termination/content.md) |
| Control | [Flow Control](../../flow-and-congestion-control/tcp-flow-control/content.md), [Congestion Control](../../flow-and-congestion-control/tcp-congestion-control/content.md) |

## Key Takeaways

- Draw sequence diagrams when explaining handshakes.
- Tie every mechanism to a problem it solves (loss, reordering, slow receivers, congested networks).
- Connect states to real symptoms: SYN-SENT stuck, CLOSE_WAIT leak, TIME_WAIT churn.

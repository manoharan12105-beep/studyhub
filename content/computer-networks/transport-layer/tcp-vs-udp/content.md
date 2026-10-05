# TCP vs UDP

**Module:** Transport Layer · **Interview priority:** Core

## What Is It?

The two transport protocols of the Internet make opposite trade-offs:

- **TCP** — connection-oriented, reliable, ordered byte stream with flow and congestion control. Pays for it with handshakes, overhead and delays on loss.
- **UDP** — connectionless, best-effort datagrams. Fast and simple; the application handles whatever it needs.

## Why It Exists

No single transport suits every application. A bank transfer must never lose a byte; a live video frame that arrives late is useless. Choosing the transport is choosing which problem your application cares about more: **completeness and order** or **timeliness and simplicity**.

## Comparison

| Aspect | TCP | UDP |
|--------|-----|-----|
| Connection | Connection-oriented: 3-way handshake, 4-way close | Connectionless: just send |
| Reliability | Guaranteed delivery (or an error), retransmission | None — lost datagrams are gone |
| Ordering | In order (sequence numbers) | No ordering |
| Duplicates | Removed | Possible |
| Data unit | Byte stream (segments); no message boundaries | Datagrams; boundaries preserved |
| Flow control | Yes (receive window) | No |
| Congestion control | Yes | No (application's responsibility) |
| Header size | 20–60 bytes | 8 bytes |
| Speed to first byte | ≥ 1 RTT (handshake) | Immediate |
| Head-of-line blocking | Yes — a lost segment stalls later data | No |
| Broadcast / multicast | No (one-to-one only) | Yes |
| State in the server | Per-connection state | None |
| Typical uses | HTTP/1.1, HTTP/2, HTTPS, SSH, SMTP, IMAP, FTP, database protocols (PostgreSQL, MySQL), Kafka | DNS, DHCP, VoIP, video calls, games, streaming, NTP, SNMP, QUIC/HTTP/3, WireGuard |

### Connection-oriented vs connectionless

| | Connection-oriented (TCP) | Connectionless (UDP) |
|---|---------------------------|----------------------|
| Before data | Set up state on both ends | Nothing |
| During | Both sides track sequence numbers, windows, timers | Each datagram independent |
| After | Explicit teardown | Nothing to tear down |
| Analogy | A phone call: dial, talk, hang up | Posting letters: each one is separate |

### Segment vs datagram

The **segment** is TCP's unit — a piece of a byte stream, numbered, acknowledged. The **datagram** is UDP's (and IP's) unit — a self-contained message delivered whole or not at all.

## How to Choose

```text
Must every byte arrive, in order?                       ── yes ──► TCP
Is low latency more important than completeness?        ── yes ──► UDP (+ app-level handling)
Need broadcast/multicast?                               ── yes ──► UDP
Tiny request/response where a handshake doubles cost?   ── yes ──► UDP (e.g. DNS) with retries
Need reliability but TCP's head-of-line blocking hurts? ── yes ──► QUIC (over UDP)
```

| Scenario | Choice | Reason |
|----------|--------|--------|
| REST API from a Spring Boot service | TCP (HTTP/1.1 or 2) | Every byte of JSON matters |
| PostgreSQL queries | TCP | Correctness, ordering |
| Video conference | UDP (RTP/WebRTC) | Late packets are useless |
| DNS lookup | UDP (TCP fallback) | One small round trip |
| File download | TCP | Completeness |
| Online multiplayer positions | UDP | Freshness beats completeness |
| Log shipping where loss is acceptable (syslog) | UDP or TCP | Trade-off: speed vs guarantee |

## Real World

- **HTTP/3** runs on **QUIC over UDP**: it gets reliability and congestion control per stream (from QUIC) without TCP's head-of-line blocking across streams, and a faster handshake. So "UDP = unreliable" is about the raw protocol, not about what can be built on it.
- **DNS** switches to TCP when the answer is too large for a UDP response (truncated flag set) and for zone transfers.

## Common Traps

> [!WARNING]
> **Common trap:** "UDP is faster than TCP, so use UDP for speed." UDP avoids handshakes and stalls, but it does not have more bandwidth. For bulk transfers TCP is usually just as fast and handles loss and congestion for you.

- **"TCP guarantees delivery no matter what."** It guarantees delivery or a reported failure.
- **"UDP has no checksum."** It has one (mandatory in IPv6).
- **"Streaming video always uses UDP."** Netflix/YouTube on-demand streaming uses TCP (HTTP) with buffering; live calls use UDP.

## Interview Follow-up

- *"Why does DNS use UDP but zone transfers use TCP?"* Queries are tiny; transfers are large and must be complete.
- *"How can an application get reliability over UDP?"* Sequence numbers, ACKs, retransmission timers in the app — or use QUIC.

## Key Takeaways

- TCP: connection, reliability, order, flow and congestion control, byte stream, 20+ byte header.
- UDP: no connection, no guarantees, datagrams, 8-byte header, broadcast/multicast possible.
- Choose by what the application values: completeness → TCP; timeliness → UDP; both → QUIC.

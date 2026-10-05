# TCP: Segments, Sequence Numbers and Reliability

**Module:** Transport Layer · **Interview priority:** Core

## What Is It?

**TCP** (Transmission Control Protocol, RFC 9293) turns IP's unreliable packet delivery into a **reliable, ordered, error-checked byte stream** between two applications. It is **connection-oriented** (a handshake first), **full duplex** (both sides send at once) and **byte-stream** based (no message boundaries).

## Why It Exists

Web pages, API calls, database queries, file transfers and SSH sessions all need every byte, exactly once, in order. IP alone can lose, duplicate and reorder packets. TCP fixes this **in the end hosts**, so the network itself can stay simple.

## How It Works

### The TCP header

```text
 0                   16                  31
┌───────────────────┬───────────────────┐
│    Source port    │  Destination port │
├───────────────────┴───────────────────┤
│            Sequence number            │
├───────────────────────────────────────┤
│        Acknowledgement number         │
├──────┬────────┬───────────────────────┤
│Offset│ Flags  │      Window size      │
├──────┴────────┼───────────────────────┤
│   Checksum    │    Urgent pointer     │
├───────────────┴───────────────────────┤
│        Options (MSS, window scale, SACK, timestamps)        │
└───────────────────────────────────────┘
          20 bytes minimum, up to 60 with options
```

| Field | Purpose |
|-------|---------|
| Ports | Which applications |
| **Sequence number** | Number of the **first byte** of data in this segment (byte-based, not segment-based) |
| **Acknowledgement number** | The **next byte** the receiver expects — "I have everything before this" |
| **Flags** | `SYN` (start), `ACK` (ack field valid), `FIN` (finished sending), `RST` (abort), `PSH` (deliver now), `URG`; plus ECN bits |
| **Window** | How many more bytes the receiver can accept — [flow control](../../flow-and-congestion-control/tcp-flow-control/content.md) |
| Checksum | Over header, data and IP pseudo-header |
| Options | MSS, window scaling, SACK, timestamps |

### Segments

The application writes a stream of bytes; TCP cuts it into **segments** no larger than the **MSS** (maximum segment size, typically 1,460 bytes on Ethernet). The receiver reassembles the stream in order. TCP does **not** keep the application's message boundaries — framing (e.g. HTTP's `Content-Length`) is the application's job.

### Sequence numbers and acknowledgements

Each side picks a random **initial sequence number (ISN)** in the handshake, then numbers every byte it sends.

```text
Client ISN = 1000 (SYN consumes 1) → first data byte is 1001

Client → Server: SEQ=1001, 500 bytes (bytes 1001–1500)
Server → Client: ACK=1501            "got everything up to 1500, send 1501 next"
Client → Server: SEQ=1501, 500 bytes (1501–2000)
Server → Client: ACK=2001
```

**Cumulative ACK:** `ACK=2001` acknowledges **all** bytes before 2001. Receivers usually delay ACKs briefly and acknowledge every second segment to save packets.

### Reliability: how lost data is recovered

1. **Retransmission timeout (RTO):** the sender starts a timer for unacknowledged data. If no ACK arrives before it fires, it resends. The RTO is computed from measured RTTs (smoothed RTT + 4 × variation; at least about 200 ms on Linux, 1 s in the RFC) and **doubles** on each successive timeout (exponential back-off).
2. **Fast retransmit:** the receiver, on getting a segment after a gap, repeats its last ACK (**duplicate ACK**). After **3 duplicate ACKs** the sender resends the missing segment immediately without waiting for the timer.
3. **SACK (selective acknowledgement):** an option where the receiver says exactly which ranges it has ("I have 2001–3000 and 4001–5000"), so the sender resends only the holes.

```text
Sender sends 1001, 1501, 2001, 2501 (500 bytes each); segment 1501 is lost
Receiver: gets 1001 → ACK 1501
          gets 2001 → dup ACK 1501   (gap!)
          gets 2501 → dup ACK 1501
Sender:   … third dup ACK → fast retransmit 1501
Receiver: gets 1501 → ACK 3001       (cumulative: everything up to 3000 now)
```

### Ordering and duplicates

Out-of-order segments are buffered until the gap is filled, then delivered in order. Duplicates (e.g. a retransmission of data that actually arrived) are recognised by sequence number and discarded.

### Error detection

The checksum covers the header and data; a corrupted segment is discarded and later retransmitted, as if lost.

### Timers TCP uses

| Timer | Purpose |
|-------|---------|
| Retransmission | Resend unacknowledged data |
| Persist | Probe when the receiver advertised a zero window |
| Keep-alive | Optionally check whether an idle peer still exists (default 2 hours on Linux) |
| TIME_WAIT (2 × MSL) | Linger after closing — see [Termination](../tcp-connection-termination/content.md) |

## Real World

- Packet loss hurts TCP throughput sharply: every loss triggers retransmission **and** a congestion-window cut ([Congestion Control](../../flow-and-congestion-control/tcp-congestion-control/content.md)).
- Head-of-line blocking: if one segment is lost, later received bytes wait in the buffer — one reason HTTP/2 over TCP suffers on lossy networks and HTTP/3 moved to QUIC.
- Wireshark's "TCP Retransmission" and "Dup ACK" markers are these mechanisms in action.

## Common Traps

- **"Sequence numbers count segments."** They count **bytes**.
- **"ACK N means segment N arrived."** It means "all bytes before N arrived; I expect byte N next".
- **"TCP preserves messages."** It is a byte stream; one write may arrive in several reads and vice versa.
- **"TCP guarantees delivery."** It guarantees delivery *or an error* — if the network is down long enough, the connection fails (timeout or reset).

## Interview Follow-up

- *"How does TCP ensure reliability?"* Sequence numbers, cumulative ACKs, retransmission (timeout + fast retransmit), checksums, reordering, duplicate removal — plus flow and congestion control.
- *"Why random initial sequence numbers?"* To avoid confusing segments from an old connection with a new one, and to make spoofed segments hard to inject.

## Key Takeaways

- TCP = reliable, ordered, full-duplex byte stream over IP.
- Sequence numbers count bytes; ACK = next expected byte (cumulative).
- Loss recovery: RTO (doubling) and fast retransmit on 3 duplicate ACKs; SACK refines it.
- Checksums drop corrupted segments; buffering restores order; duplicates are discarded.

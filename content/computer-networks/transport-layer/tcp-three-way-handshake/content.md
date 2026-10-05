# The TCP Three-Way Handshake

**Module:** Transport Layer · **Interview priority:** Core

## What Is It?

Before any data flows, TCP opens a connection with three segments:

```text
   Client                                        Server (LISTEN on :443)
     │  1. SYN        seq = x                       │
     │ ───────────────────────────────────────────► │   client: SYN-SENT
     │                                              │   server: SYN-RECEIVED
     │  2. SYN-ACK    seq = y, ack = x + 1          │
     │ ◄─────────────────────────────────────────── │
     │  3. ACK        seq = x + 1, ack = y + 1      │
     │ ───────────────────────────────────────────► │   both: ESTABLISHED
     │  data can flow (the ACK may already carry it)│
```

## Why It Exists

Both sides must agree that a connection exists and must learn each other's **initial sequence number (ISN)** — the starting point for numbering bytes in each direction. Each side has to **send** its ISN and **see it acknowledged**:

- Client's ISN sent (SYN) and acknowledged (SYN-ACK).
- Server's ISN sent (SYN-ACK) and acknowledged (ACK).

That takes four messages, but the server combines its acknowledgement and its own SYN into one segment, so **three** are enough.

## How It Works

### Step by step

| Step | Segment | Flags | Sequence / ACK | Meaning | States after |
|------|---------|-------|----------------|---------|--------------|
| 1 | Client → Server | `SYN` | seq = x (random ISN) | "I want to connect; my bytes start after x" | Client `SYN-SENT` |
| 2 | Server → Client | `SYN`, `ACK` | seq = y (server ISN), ack = x + 1 | "Got your SYN; my bytes start after y" | Server `SYN-RECEIVED` |
| 3 | Client → Server | `ACK` | seq = x + 1, ack = y + 1 | "Got your SYN" | Both `ESTABLISHED` |

A SYN (like a FIN) **consumes one sequence number**, which is why the ACK is x + 1 even though no data was sent.

### Options negotiated in the SYNs

- **MSS** — the largest segment each side wants to receive (e.g. 1,460).
- **Window scale** — allows windows larger than 64 KB.
- **SACK permitted** — selective acknowledgements.
- **Timestamps** — RTT measurement and protection against wrapped sequence numbers.

### Inside the server

1. On SYN, the kernel creates a half-open entry in the **SYN queue** and replies SYN-ACK.
2. On the final ACK, the connection moves to the **accept queue** (fully established).
3. The application's `accept()` takes it from there. The application is not involved in the handshake at all — it is done by the kernel.

### Cost: one round trip before data

The client can send its first request only after receiving the SYN-ACK — **1 RTT** of delay. With HTTPS, the TLS handshake adds 1 RTT more (TLS 1.3). On a 100 ms RTT path, a new HTTPS connection costs ~200 ms before the request even leaves. This is why connection reuse matters ([Keep-Alive and Pooling](../../performance/keep-alive-and-connection-pooling/content.md)).

### What can go wrong

| Situation | What the client sees |
|-----------|----------------------|
| Server host up, **nothing listening** on the port | The server's kernel replies **RST** → `Connection refused` immediately |
| SYN **dropped** by a firewall, or host down/unreachable | No reply; the client retransmits the SYN with back-off (1 s, 2 s, 4 s …) → **connection timed out** (Linux gives up after ~127 s by default; apps usually set a shorter connect timeout) |
| Firewall **rejects** | RST or ICMP unreachable → fails fast (refused / no route to host) |
| Server's accept queue full (app too slow to `accept`) | SYNs or final ACKs dropped → slow or timed-out connects |

See [Troubleshooting Connection Errors](../../troubleshooting/troubleshooting-connection-errors/content.md).

## Under the Hood: SYN Flood

An attacker sends huge numbers of SYNs (often from spoofed addresses) and never completes the handshake. Each one occupies the server's SYN queue until it fills, so real clients cannot connect. Defence: **SYN cookies** — the server encodes the connection details into its ISN and keeps **no state** until a valid final ACK proves the client is real; plus rate limiting and DDoS protection upstream.

## Why Not Two Ways?

With a two-way handshake (SYN, SYN-ACK), the server would consider the connection open as soon as it replies — but it would never know whether the client received its ISN. An **old, delayed duplicate SYN** from a previous connection could also make the server open a phantom connection and allocate resources. The third segment proves the client is alive, current and has the server's ISN.

## Real World

- `ss -tan` on a busy server shows `SYN-RECV` entries during the handshake and many `ESTAB` connections.
- **TCP Fast Open** lets a repeat client send data in the SYN using a cookie, saving the round trip (limited deployment).
- **HTTP/3 (QUIC)** combines the transport and TLS handshakes into one round trip (zero for resumed connections).

## Common Traps

- **"ACK = seq + 1 because the ACK is the next segment number."** It is the next **byte** number; the SYN consumes one sequence number.
- **"The application performs the handshake."** The OS kernel does; `accept()` returns already-established connections.
- **"Refused and timeout mean the same."** Refused = the host answered with RST (no listener). Timeout = no answer at all (filtered, down, unreachable).

## Interview Follow-up

- *"What happens if the final ACK is lost?"* The server stays in SYN-RECEIVED and retransmits the SYN-ACK; the client is already ESTABLISHED and its first data segment (which carries the ACK) also completes the handshake.
- *"Why are ISNs random?"* Security against injection and confusion with old connections.

## Key Takeaways

- SYN (seq x) → SYN-ACK (seq y, ack x+1) → ACK (ack y+1). Both sides then ESTABLISHED.
- Purpose: agree to connect and exchange/acknowledge both ISNs (plus MSS, window scale, SACK).
- Costs 1 RTT before the first data byte; TLS adds more.
- Refused = RST; timeout = silence. SYN floods are mitigated with SYN cookies.

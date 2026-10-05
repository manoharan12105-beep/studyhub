# TCP Connection Termination, TIME_WAIT and TCP States

**Module:** Transport Layer · **Interview priority:** Core

## What Is It?

A TCP connection is closed **one direction at a time**. Each side sends a **FIN** ("I have no more data to send") and the other side **ACK**s it. That makes the classic **four-way termination**:

```text
  Client (active closer)                          Server (passive closer)
   ESTABLISHED                                     ESTABLISHED
     │  1. FIN  seq = u                               │
     │ ─────────────────────────────────────────────► │
   FIN-WAIT-1                                      CLOSE-WAIT   (app is told: EOF)
     │  2. ACK  ack = u + 1                           │
     │ ◄───────────────────────────────────────────── │
   FIN-WAIT-2                                         │  server may still send data…
     │  3. FIN  seq = v                               │  app calls close()
     │ ◄───────────────────────────────────────────── │
   TIME-WAIT                                       LAST-ACK
     │  4. ACK  ack = v + 1                           │
     │ ─────────────────────────────────────────────► │
   (waits 2 × MSL)                                 CLOSED
   CLOSED
```

## Why It Exists

TCP is full duplex: each direction is an independent byte stream. When one side finishes sending, the other may still have data to deliver (e.g. the rest of a response). So each direction is closed separately — a **half-close** — which needs a FIN and an ACK per direction: four segments. When the server has nothing left to send, it often combines steps 2 and 3 into one **FIN-ACK**, giving a three-segment close.

## How It Works

### Step by step

| Step | Segment | Sender state after | Receiver state after |
|------|---------|--------------------|----------------------|
| 1 | Client → FIN | `FIN-WAIT-1` | Server `CLOSE-WAIT` (its app reads end-of-stream) |
| 2 | Server → ACK | — | Client `FIN-WAIT-2` |
| 3 | Server → FIN (after its app calls `close()`) | Server `LAST-ACK` | Client `TIME-WAIT` |
| 4 | Client → ACK | Client stays in `TIME-WAIT` for 2 × MSL | Server `CLOSED` |

Either side can be the **active closer** (the one that sends the first FIN). In HTTP the server often closes idle keep-alive connections; in many client libraries the client closes.

### TIME_WAIT

After the final ACK, the active closer waits **2 × MSL** (Maximum Segment Lifetime) before forgetting the connection. Linux uses a fixed **60 seconds**.

Two reasons:

1. **The final ACK might be lost.** The other side would then retransmit its FIN; the closer must still be around to ACK it again. Without TIME_WAIT it would answer with RST, and the peer would see an error instead of a clean close.
2. **Old duplicate segments must die out.** A delayed segment from this connection could otherwise arrive after a *new* connection with the same 4-tuple is opened, and be accepted as its data. Waiting 2 × MSL guarantees old segments have expired.

**Cost:** each socket in TIME_WAIT keeps its 4-tuple reserved. A client (or proxy) that opens and closes thousands of short connections to the same server can run out of ephemeral ports. The fix is to **reuse connections** (keep-alive, pooling), not to disable TIME_WAIT.

### CLOSE_WAIT — usually an application bug

CLOSE_WAIT means "the peer closed its side; **my application has not called `close()`** yet". A few are normal; hundreds that never go away mean the application leaks connections — e.g. HTTP responses or JDBC connections not closed in a `finally` / try-with-resources block.

### RST: abortive close

Instead of FIN, either side can send **RST** to abort immediately: no TIME_WAIT, unsent data discarded, the peer gets "connection reset by peer". Sent when a segment arrives for a non-existent connection, when an application closes a socket with unread data, or by firewalls/load balancers killing idle connections.

## The TCP State Machine

```text
                    ┌──────────┐
          passive   │  CLOSED  │  active open (connect): send SYN
          open ┌────┴──────────┴────┐
               ▼                    ▼
          ┌────────┐  recv SYN   ┌──────────┐
          │ LISTEN │ send SYN-ACK│ SYN-SENT │
          └───┬────┘             └────┬─────┘
              ▼                       │ recv SYN-ACK / send ACK
        ┌──────────┐ recv ACK         ▼
        │ SYN-RCVD │ ───────────► ┌─────────────┐
        └──────────┘              │ ESTABLISHED │
                                  └──┬───────┬──┘
                close: send FIN      │       │   recv FIN: send ACK
                  ┌──────────────────┘       └──────────────┐
                  ▼                                          ▼
           ┌────────────┐                             ┌────────────┐
           │ FIN-WAIT-1 │                             │ CLOSE-WAIT │
           └─────┬──────┘                             └─────┬──────┘
     recv ACK    ▼                              close: send FIN
           ┌────────────┐                             ┌──────────┐
           │ FIN-WAIT-2 │                             │ LAST-ACK │
           └─────┬──────┘                             └────┬─────┘
     recv FIN /  ▼ send ACK                     recv ACK   ▼
           ┌────────────┐   2 × MSL                   ┌────────┐
           │ TIME-WAIT  │ ──────────► CLOSED          │ CLOSED │
           └────────────┘                             └────────┘
```

(Rare: `CLOSING`, when both sides send FIN simultaneously.)

| State | Meaning | Seen when |
|-------|---------|-----------|
| `LISTEN` | Server waiting for connections | Any listening service |
| `SYN-SENT` | Client sent SYN, waiting | Connecting; stuck here = SYN not answered (filtered/down) |
| `SYN-RECEIVED` (`SYN-RECV`) | Server sent SYN-ACK, waiting for ACK | Handshake in progress; many = SYN flood |
| `ESTABLISHED` (`ESTAB`) | Open; data flows | Normal |
| `FIN-WAIT-1/2` | We closed; waiting for the peer | Active closer |
| `CLOSE-WAIT` | Peer closed; our app has not | Many and growing = connection leak |
| `LAST-ACK` | We sent our FIN after the peer's; waiting for ACK | Passive closer, briefly |
| `TIME-WAIT` | Closed; lingering 2 × MSL | Active closer; many on busy clients/proxies |

```bash
ss -tan state time-wait | wc -l      # how many sockets are in TIME_WAIT
ss -tan state close-wait             # who is not closing connections
```

## Real World

- A Spring Boot service calling another API without closing responses (or without a pooled client) shows rising `CLOSE-WAIT` and eventually "Too many open files".
- Load balancers close idle connections after a timeout (e.g. 60 s); if the backend's keep-alive timeout is *longer*, the backend may reuse a connection the LB already closed → occasional 502 errors. Rule: backend idle timeout **longer** than the LB's.

## Common Traps

- **"TIME_WAIT is on the server."** It is on whichever side closes **first** (the active closer).
- **"TIME_WAIT is a bug; disable it."** It protects correctness. Reduce churn by reusing connections.
- **"CLOSE_WAIT will time out by itself."** It persists until the local application closes the socket.
- **"Termination needs exactly four segments."** Often three (FIN, FIN-ACK, ACK), or one RST.

## Interview Follow-up

- *"Why is termination four-way but the handshake three-way?"* In the handshake, the server's ACK and SYN can always be combined. In termination, the passive side may still have data to send, so its FIN can come later than its ACK.
- *"What does a large number of TIME_WAIT sockets mean?"* Many short-lived connections closed by this host — use keep-alive/pooling.

## Key Takeaways

- Termination: FIN → ACK → FIN → ACK, one direction at a time (half-close); often FIN, FIN-ACK, ACK.
- TIME_WAIT (2 × MSL, 60 s on Linux) on the active closer: re-ACK a lost FIN and let old segments expire.
- CLOSE_WAIT that persists = the application is not closing sockets.
- RST aborts instantly. Know the states: LISTEN, SYN-SENT, SYN-RECEIVED, ESTABLISHED, FIN-WAIT-1/2, CLOSE-WAIT, LAST-ACK, TIME-WAIT, CLOSED.

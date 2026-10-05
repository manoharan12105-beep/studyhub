# TCP vs UDP — Interview Questions

## Beginner

### Q1. What are the differences between TCP and UDP?

**Style:** Comparison

<details>
<summary>Answer</summary>

TCP is connection-oriented (handshake), reliable (ACKs, retransmission), ordered, provides flow and congestion control, and is a byte stream with a 20–60-byte header. UDP is connectionless, best effort (no ACKs or retransmission), unordered, has no flow or congestion control, preserves message boundaries, supports broadcast/multicast and has an 8-byte header. TCP for correctness (HTTP, databases, SSH); UDP for speed/timeliness (DNS, VoIP, games, QUIC).

</details>

### Q2. Which protocol would you use for a banking API, and for a voice call?

**Style:** Scenario

<details>
<summary>Answer</summary>

Banking API: TCP (via HTTPS) — every byte must arrive exactly once and in order. Voice call: UDP (RTP) — low latency matters more; a lost 20 ms audio packet is better skipped than retransmitted late.

</details>

## Intermediate

### Q3. What does "connection-oriented" mean? Does it mean a dedicated path?

**Style:** Follow-up

<details>
<summary>Answer</summary>

It means both endpoints set up and maintain state for the conversation (sequence numbers, windows, timers) before exchanging data, and tear it down afterwards. It does not mean a dedicated path: the network still routes each IP packet independently; the "connection" exists only in the two end hosts.

</details>

### Q4. Is UDP always faster than TCP?

**Style:** Follow-up

<details>
<summary>Answer</summary>

Not inherently. UDP saves the handshake round trip and avoids stalls from retransmission and head-of-line blocking, so it has lower latency for small or real-time exchanges. But it has the same link bandwidth, and without congestion control a UDP sender can cause loss that hurts itself and others. For bulk transfers TCP typically reaches similar throughput while handling loss for you.

</details>

## Advanced

### Q5. If UDP is unreliable, how is HTTP/3 reliable?

**Style:** Why

<details>
<summary>Answer</summary>

HTTP/3 runs over QUIC, a transport built in user space on top of UDP. QUIC adds connection IDs, packet numbers, acknowledgements, retransmission, flow and congestion control, and mandatory TLS 1.3 — per stream, so a loss in one stream does not block others. UDP is used only as a thin, middlebox-friendly carrier.

</details>

### Q6. Why do DNS queries use UDP, but DNS sometimes uses TCP?

<details>
<summary>Answer</summary>

Typical queries and answers fit in one small packet, so UDP gives a single round trip without a handshake; the resolver simply retries on loss. TCP is used when a response is too large for UDP (the server sets the truncation flag and the client retries over TCP), for zone transfers between servers, and for encrypted DNS over TLS (port 853).

</details>

# TCP, UDP, Flow and Congestion Control — Interview Questions

## Beginner

### Q1. TCP vs UDP?

**Style:** Comparison

<details>
<summary>Answer</summary>

TCP: connection-oriented, reliable (ACKs, retransmission), ordered byte stream, flow and congestion control, 20+ byte header — for HTTP(S), SSH, databases. UDP: connectionless, no delivery or order guarantees, datagrams with preserved boundaries, 8-byte header, supports broadcast/multicast — for DNS, DHCP, VoIP, games, streaming, QUIC.

</details>

### Q2. Port vs socket?

**Style:** Comparison

<details>
<summary>Answer</summary>

A port is a 16-bit number identifying an application endpoint on a host. A socket is an endpoint — IP + port (+ protocol) — and the OS object used to communicate. A TCP connection is identified by two sockets: the 4-tuple (source IP, source port, destination IP, destination port).

</details>

### Q3. Explain the three-way handshake.

**Style:** What happens internally

<details>
<summary>Answer</summary>

Client → SYN (seq = x), state SYN-SENT. Server → SYN-ACK (seq = y, ack = x+1), state SYN-RECEIVED. Client → ACK (ack = y+1); both ESTABLISHED. It synchronises both initial sequence numbers, confirms both directions work and negotiates options (MSS, window scale, SACK). Costs one RTT before data.

</details>

## Intermediate

### Q4. Explain the four-way termination and TIME_WAIT.

**Style:** What happens internally

<details>
<summary>Answer</summary>

Active closer sends FIN (FIN-WAIT-1); peer ACKs (closer → FIN-WAIT-2; peer → CLOSE-WAIT); when the peer's application closes it sends FIN (LAST-ACK); the closer ACKs and waits in TIME-WAIT for 2 × MSL (60 s on Linux) before CLOSED. TIME_WAIT lets it re-ACK a lost final FIN and lets old duplicate segments expire before the 4-tuple is reused.

</details>

### Q5. Flow control vs congestion control?

**Style:** Comparison

<details>
<summary>Answer</summary>

Flow control protects the receiver: it advertises its free buffer (rwnd) in each segment. Congestion control protects the network: the sender maintains cwnd, growing it (slow start, congestion avoidance) and cutting it on loss. The sender may have min(rwnd, cwnd) bytes unacknowledged.

</details>

### Q6. How does TCP guarantee reliable, ordered delivery?

**Style:** How

<details>
<summary>Answer</summary>

Byte sequence numbers, cumulative ACKs, retransmission on timeout (adaptive RTO with back-off) and on three duplicate ACKs (fast retransmit), SACK for precise recovery, checksums to discard corruption, buffering and reordering of out-of-order data, duplicate detection — plus flow and congestion control to avoid overload losses.

</details>

### Q7. Why does DNS use UDP? When does it use TCP?

**Style:** Why

<details>
<summary>Answer</summary>

Queries and answers are small and fit in one packet; UDP avoids a handshake, so a lookup costs one round trip, and resolvers simply retry on loss. TCP is used for responses too large for UDP (truncation flag), zone transfers, and DNS over TLS.

</details>

### Q8. What is an ephemeral port?

**Style:** Direct

<details>
<summary>Answer</summary>

A temporary port the client's OS assigns to the client side of a connection (IANA range 49152–65535; Linux default 32768–60999). It lets one client hold many simultaneous connections to the same server port.

</details>

## Advanced

### Q9. Why is the handshake three-way and not two-way?

**Style:** Why

<details>
<summary>Answer</summary>

Each side must send its ISN and get it acknowledged. With two messages the server would not know the client received its ISN, and an old duplicate SYN could create a phantom connection. The third segment confirms the client is live and synchronised; three is the minimum because the server combines its ACK with its SYN.

</details>

### Q10. A server has thousands of connections in CLOSE_WAIT. What is wrong?

**Style:** Debugging

<details>
<summary>Answer</summary>

Peers closed their side but the local application never called `close()` — a connection/resource leak (unclosed streams, HTTP responses, JDBC connections). CLOSE_WAIT does not expire by itself; eventually file descriptors run out. Fix the code (try-with-resources) and the client usage.

</details>

### Q11. What are slow start and AIMD?

**Style:** How

<details>
<summary>Answer</summary>

Slow start begins with a small cwnd (≈10 segments) and doubles it each RTT until ssthresh or loss. Congestion avoidance then adds about one segment per RTT (additive increase); on loss cwnd is halved (multiplicative decrease) — or reset to 1 on a timeout. AIMD gives stability and fair sharing between flows.

</details>

### Q12. Connection refused vs connection timed out — what does each mean at the TCP level?

**Style:** Comparison

<details>
<summary>Answer</summary>

Refused: the SYN reached the host and its kernel replied RST because nothing listens on that port (or a firewall rejected) — immediate. Timeout: no reply to the SYN at all (dropped by a firewall, wrong address/route, host down), so the client retransmits SYNs with back-off until it gives up.

</details>

### Q13. Follow-up chain: "Why not use UDP for everything since it is faster? … Then why does HTTP/3 use UDP?"

**Style:** Follow-up

<details>
<summary>Answer</summary>

Raw UDP gives no reliability, ordering or congestion control; most applications would have to rebuild them, usually badly, and could congest networks. HTTP/3 uses UDP only as a carrier: QUIC on top implements reliability, per-stream ordering, congestion control and TLS 1.3, gaining independent streams (no TCP head-of-line blocking), faster handshakes and connection migration, and avoiding ossified kernel/middlebox TCP behaviour.

</details>

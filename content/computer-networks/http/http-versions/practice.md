# HTTP/1.1, HTTP/2 and HTTP/3 — Practice

### P1. Transport of HTTP/3

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** HTTP/3

What does HTTP/3 run on?

- A) TCP
- B) QUIC over UDP
- C) SCTP
- D) Raw IP

<details>
<summary>Answer</summary>

**Answer:** B) QUIC over UDP

</details>

### P2. Which version?

**Difficulty:** Easy · **Type:** Conceptual · **Concepts:** version features

Which version introduced: (a) mandatory Host header and default keep-alive, (b) binary framing and multiplexing, (c) connection migration between networks, (d) HPACK?

<details>
<summary>Answer</summary>

(a) HTTP/1.1, (b) HTTP/2, (c) HTTP/3, (d) HTTP/2.

</details>

### P3. Count round trips

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** handshake cost

RTT = 50 ms. Estimate time until the first response byte for a brand-new HTTPS connection with (a) HTTP/2 over TCP + TLS 1.3, (b) HTTP/3, (c) HTTP/3 resuming with 0-RTT. Ignore DNS and server time.

<details>
<summary>Answer</summary>

(a) TCP 1 RTT + TLS 1 RTT + request/response 1 RTT = **150 ms**. (b) QUIC+TLS 1 RTT + request/response 1 RTT = **100 ms**. (c) Request sent with the first flight → **50 ms**.

</details>

### P4. Outdated optimisation

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** HTTP/2 implications

A legacy site spreads images across `img1`, `img2`, `img3.example.com` (domain sharding). After moving to HTTP/2, why might this hurt?

<details>
<summary>Answer</summary>

Sharding forced extra parallel HTTP/1.1 connections. With HTTP/2, one connection multiplexes everything; extra domains add DNS lookups, TCP/TLS handshakes and separate slow-start windows, and prevent header compression and prioritisation across them.

</details>

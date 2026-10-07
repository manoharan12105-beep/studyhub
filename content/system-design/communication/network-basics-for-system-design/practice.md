# IP Addresses, Ports, Sockets and Connections — Practice

### P1. Identify the connection

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** 4-tuple

Which set of values uniquely identifies a TCP connection?

- A) Destination IP and destination port
- B) Source IP, source port, destination IP, destination port
- C) Source MAC and destination MAC
- D) Domain name and port

<details>
<summary>Answer</summary>

**Answer:** B) Source IP, source port, destination IP, destination port

</details>

### P2. Connection budget

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** connection limits

A database allows 300 connections, with 20 reserved for administration. Each app server's pool has a maximum of 25. How many app servers can run before pools could exceed the limit?

<details>
<summary>Answer</summary>

(300 − 20) ÷ 25 = 11.2 → **11 servers**. A 12th could push total connections past the limit; reduce pool sizes or add a pooler before scaling further.

</details>

### P3. Why reuse connections

**Difficulty:** Medium · **Type:** Estimation · **Concepts:** handshake cost

Round-trip time to an API is 80 ms and it uses TLS 1.3. A client makes 10 requests, opening a new connection for each, versus reusing one connection. Roughly how much network time does reuse save (ignoring server time and assuming sequential requests)?

<details>
<summary>Answer</summary>

New connection each time: 10 × (1 TCP + 1 TLS + 1 request) = 30 RTT = 2,400 ms. Reuse: 1 + 1 + 10 = 12 RTT = 960 ms. Saves about **1.4 s**.

</details>

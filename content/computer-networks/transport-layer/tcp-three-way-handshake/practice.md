# The TCP Three-Way Handshake — Practice

### P1. Order the segments

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** handshake order

Which order is correct?

- A) SYN → ACK → SYN-ACK
- B) SYN → SYN-ACK → ACK
- C) ACK → SYN → SYN-ACK
- D) SYN-ACK → SYN → ACK

<details>
<summary>Answer</summary>

**Answer:** B) SYN → SYN-ACK → ACK

</details>

### P2. Fill in the numbers

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** sequence and ack numbers

The client's ISN is 7000 and the server's ISN is 3000. Give seq and ack for the SYN-ACK and the final ACK, and the sequence number of the client's first data byte.

<details>
<summary>Answer</summary>

SYN-ACK: seq = 3000, ack = 7001. Final ACK: seq = 7001, ack = 3001. First client data byte: **7001**.

</details>

### P3. Name the state

**Difficulty:** Medium · **Type:** Conceptual · **Concepts:** TCP states

What state is (a) the client in after sending SYN, (b) the server in after sending SYN-ACK, (c) a server socket waiting for clients?

<details>
<summary>Answer</summary>

(a) SYN-SENT, (b) SYN-RECEIVED, (c) LISTEN.

</details>

### P4. Refused or timeout?

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** handshake failures

`curl http://10.0.2.20:8080` fails instantly with "Failed to connect … Could not connect to server" (connection refused). Another attempt to `10.0.9.9:8080` hangs and then reports "Connection timed out". What happened to the SYN in each case?

<details>
<summary>Answer</summary>

First: the SYN reached the host and its kernel replied RST because nothing listens on 8080 (or a firewall actively rejected it). Second: the SYN got no reply at all — host down, wrong/unroutable address, or a firewall silently dropping it — so the client retransmitted SYNs until the timeout.

</details>

### P5. Handshake cost

**Difficulty:** Hard · **Type:** Calculation · **Concepts:** RTT cost

RTT to an API server is 80 ms. A client opens a new HTTPS (TLS 1.3) connection for each of 10 sequential requests; each server response takes 20 ms to produce. Approximate total time. What if one connection is reused?

<details>
<summary>Answer</summary>

New connection each time: TCP 80 + TLS 80 + request/response 80 + 20 = 260 ms × 10 = **2,600 ms**.
Reused connection: first request 260 ms, the other nine 100 ms each → 260 + 900 = **1,160 ms**.

</details>

# TCP Flow Control and the Sliding Window — Practice

### P1. Who sets it?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** receive window

Who sets the receive window (rwnd)?

- A) The sender
- B) The receiver
- C) The routers on the path
- D) The DNS server

<details>
<summary>Answer</summary>

**Answer:** B) The receiver

</details>

### P2. Window limit

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** window ÷ RTT

With a 64 KB (65,536-byte) window and a 50 ms RTT, what is the maximum throughput?

<details>
<summary>Answer</summary>

65,536 ÷ 0.05 = 1,310,720 bytes/s ≈ **1.31 MB/s ≈ 10.5 Mbit/s**.

</details>

### P3. Required window

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** bandwidth-delay product

What window is needed to fill a 500 Mbit/s path with 40 ms RTT?

<details>
<summary>Answer</summary>

500,000,000 × 0.04 = 20,000,000 bits = **2,500,000 bytes (2.5 MB)**. That needs window scaling.

</details>

### P4. Sliding

**Difficulty:** Medium · **Type:** Packet flow · **Concepts:** sliding window

Window = 3,000 bytes; bytes 1–3000 are sent and unacknowledged. ACK 1001 arrives with rwnd still 3,000. Which bytes may be sent now?

<details>
<summary>Answer</summary>

The window now spans 1001–4000; 1001–3000 are already in flight, so bytes **3001–4000** may be sent.

</details>

### P5. Which control?

**Difficulty:** Medium · **Type:** Comparison · **Concepts:** flow vs congestion

Classify: (a) routers drop packets because their queues overflow, (b) a phone app reads data slowly, (c) the sender halves its window after loss, (d) the receiver advertises window 0.

<details>
<summary>Answer</summary>

(a) congestion, (b) flow, (c) congestion control reacting, (d) flow control.

</details>

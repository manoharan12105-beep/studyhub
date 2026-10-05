# Network Performance Metrics — Practice

### P1. Name the metric

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** jitter

Ping times to a server are 20, 22, 61, 19 and 58 ms. A video call to it stutters even though downloads are fast. Which metric best explains the stutter?

- A) Bandwidth
- B) Throughput
- C) Jitter
- D) Bandwidth-delay product

<details>
<summary>Answer</summary>

**Answer:** C) Jitter

**Explanation:** Latency varies widely between packets. Real-time media needs a steady arrival pace; downloads only need throughput.

</details>

### P2. Bits and bytes

**Difficulty:** Easy · **Type:** Calculation · **Concepts:** bandwidth units

What is the fastest a 200 Mbit/s connection can download a 1 GB (1,000 MB) file, ignoring overhead?

<details>
<summary>Answer</summary>

200 Mbit/s ÷ 8 = 25 MB/s. 1,000 MB ÷ 25 MB/s = **40 seconds**.

</details>

### P3. Transmission vs propagation

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** latency components

A 1,500-byte packet crosses a 10 Mbit/s link that is 2,000 km long (signal speed 200,000 km/s). Compute the transmission and propagation delays.

<details>
<summary>Answer</summary>

Transmission = 1,500 × 8 bits ÷ 10,000,000 bit/s = 12,000 ÷ 10,000,000 = **1.2 ms**.
Propagation = 2,000 ÷ 200,000 s = **10 ms**.
Propagation dominates; a faster link would cut only the 1.2 ms.

</details>

### P4. Bottleneck

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** throughput

Your laptop has a 1 Gbit/s Ethernet port, your home plan is 100 Mbit/s, and the server's uplink is 10 Gbit/s but it is busy and gives each client about 30 Mbit/s. What download throughput should you expect at most?

<details>
<summary>Answer</summary>

About **30 Mbit/s** — throughput is limited by the slowest part of the path, here the server's per-client share.

</details>

### P5. Bandwidth-delay product

**Difficulty:** Hard · **Type:** Calculation · **Concepts:** BDP

A path has 200 Mbit/s bandwidth and 80 ms RTT. How much data must TCP keep in flight to use the full bandwidth?

<details>
<summary>Answer</summary>

BDP = 200,000,000 bit/s × 0.08 s = 16,000,000 bits = **2,000,000 bytes (2 MB)**. A smaller window caps throughput at window ÷ RTT.

</details>

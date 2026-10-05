# Network Performance Metrics — Interview Questions

## Beginner

### Q1. What is the difference between bandwidth and throughput?

**Style:** Comparison

<details>
<summary>Answer</summary>

Bandwidth is the maximum capacity of a link (e.g. 1 Gbit/s). Throughput is the rate actually achieved end to end, which is lower because of the slowest link on the path, congestion, protocol overhead, packet loss and TCP's window limits.

</details>

### Q2. What is latency? What is RTT?

<details>
<summary>Answer</summary>

Latency is the time for data to travel from sender to receiver. RTT (round-trip time) is the time for a message to reach the other side and the reply to come back — what `ping` measures. Request/response protocols pay at least one RTT per exchange.

</details>

## Intermediate

### Q3. What are the components of latency?

<details>
<summary>Answer</summary>

At each hop: processing delay (examining the header), queuing delay (waiting in a busy router's buffer — the variable part), transmission delay (packet size ÷ link bandwidth) and propagation delay (distance ÷ signal speed, about 200,000 km/s in fibre). Over long distances propagation dominates; under congestion queuing dominates.

</details>

### Q4. Does doubling bandwidth halve latency?

**Style:** Follow-up

<details>
<summary>Answer</summary>

No. It halves only the transmission delay, which for small packets is already tiny. Propagation delay depends on distance, and queuing and processing are unchanged. A request from Chennai to a server in the US still needs over 200 ms per round trip on any bandwidth.

</details>

### Q5. What is jitter and which applications care about it?

<details>
<summary>Answer</summary>

Jitter is the variation in packet latency (mostly from changing queue lengths). Real-time audio, video calls and online games need packets at a steady pace; they use a jitter buffer to smooth arrival, which adds delay. File downloads and buffered streaming barely care.

</details>

## Advanced

### Q6. What is the bandwidth-delay product and why does it matter for TCP?

<details>
<summary>Answer</summary>

BDP = bandwidth × RTT: the amount of data that can be in flight on the path. To keep the pipe full, TCP must allow at least that much unacknowledged data (its window). On a 1 Gbit/s path with 100 ms RTT the BDP is 100 Mbit = 12.5 MB; with a 64 KB window, throughput would be capped at 64 KB per 100 ms ≈ 5 Mbit/s. That is why TCP window scaling exists.

</details>

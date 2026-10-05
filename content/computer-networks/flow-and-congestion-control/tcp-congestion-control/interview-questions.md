# TCP Congestion Control — Interview Questions

## Beginner

### Q1. What is congestion control and why is it needed?

<details>
<summary>Answer</summary>

It limits how fast a TCP sender transmits so that it does not overload routers and links on the path. Without it, overloaded routers drop packets, senders retransmit even more, and the network can collapse into carrying mostly retransmissions (congestion collapse, seen in 1986). It also shares capacity fairly among flows.

</details>

### Q2. What are slow start and congestion avoidance?

<details>
<summary>Answer</summary>

Slow start: cwnd begins small (about 10 segments today) and increases by one segment per ACK, doubling every RTT, until it reaches ssthresh or loss occurs. Congestion avoidance: above ssthresh, cwnd grows by about one segment per RTT (linear) to probe carefully for more bandwidth.

</details>

## Intermediate

### Q3. How does TCP react to three duplicate ACKs versus a timeout?

**Style:** Comparison

<details>
<summary>Answer</summary>

Three duplicate ACKs mean one segment was lost but later segments still arrive (mild congestion): TCP fast-retransmits the missing segment, sets ssthresh to cwnd/2 and continues from there (fast recovery). A retransmission timeout means nothing is getting through (severe congestion): ssthresh = cwnd/2, cwnd drops to 1 segment and slow start restarts.

</details>

### Q4. Flow control vs congestion control?

**Style:** Comparison

<details>
<summary>Answer</summary>

Flow control protects the receiver: rwnd, advertised explicitly by the receiver, reflects its free buffer space. Congestion control protects the network: cwnd, computed privately by the sender from loss/delay/ECN signals. The sender's in-flight data is limited by min(rwnd, cwnd).

</details>

### Q5. What is AIMD?

<details>
<summary>Answer</summary>

Additive Increase, Multiplicative Decrease: in congestion avoidance cwnd grows by one MSS per RTT, and on loss it is cut multiplicatively (halved). This produces the TCP sawtooth and makes competing flows converge to a fair, stable share of a bottleneck.

</details>

## Advanced

### Q6. Why do short-lived connections often fail to use the available bandwidth?

**Style:** Why

<details>
<summary>Answer</summary>

Every new connection starts in slow start with a small congestion window and needs several RTTs of doubling to reach the path's capacity. A short transfer (a typical API response) finishes before cwnd grows, so it is latency-bound: handshake RTTs + slow-start RTTs. Reusing connections (keep-alive, HTTP/2, connection pools) keeps an already-grown cwnd.

</details>

### Q7. How does BBR differ from loss-based algorithms like Reno and CUBIC?

<details>
<summary>Answer</summary>

Reno and CUBIC treat packet loss as the congestion signal, so they keep increasing until router buffers overflow — causing high queueing delay (bufferbloat) and sensitivity to random loss. BBR models the path: it estimates the bottleneck bandwidth and the minimum RTT and paces packets at the estimated bandwidth, keeping queues short. It performs much better on lossy, long paths, though fairness with loss-based flows is debated.

</details>

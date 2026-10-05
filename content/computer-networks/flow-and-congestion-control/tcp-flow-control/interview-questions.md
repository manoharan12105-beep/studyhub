# TCP Flow Control and the Sliding Window — Interview Questions

## Beginner

### Q1. What is flow control in TCP?

<details>
<summary>Answer</summary>

A mechanism that prevents the sender from overwhelming the receiver. The receiver advertises its receive window (free buffer space) in the Window field of each segment, and the sender keeps the amount of unacknowledged data at or below that window.

</details>

### Q2. What is a sliding window?

<details>
<summary>Answer</summary>

The range of bytes the sender may have in flight without waiting for acknowledgements. Its left edge is the oldest unacknowledged byte; its size is the allowed window. As ACKs arrive the left edge moves forward and the window "slides", allowing new bytes to be sent. It keeps many segments in flight, unlike stop-and-wait.

</details>

## Intermediate

### Q3. What is the difference between flow control and congestion control?

**Style:** Comparison

<details>
<summary>Answer</summary>

Flow control protects the receiver: the receiver explicitly advertises how much it can accept (rwnd). Congestion control protects the network: the sender infers network capacity from loss, delay or ECN and maintains its own congestion window (cwnd). The sender may send min(rwnd, cwnd) bytes unacknowledged.

</details>

### Q4. What happens when the receiver advertises a zero window?

**Style:** What happens internally

<details>
<summary>Answer</summary>

The sender stops sending new data and starts the persist timer, periodically sending small window probes. When the receiving application reads data and frees buffer space, the receiver advertises a non-zero window (window update) and transmission resumes. Probes prevent a deadlock if a window update is lost.

</details>

## Advanced

### Q5. Why is window scaling needed? Give a calculation.

**Style:** Why

<details>
<summary>Answer</summary>

The Window field has 16 bits, so at most 65,535 bytes. Throughput is limited to window ÷ RTT: with 100 ms RTT that is about 655 KB/s (≈ 5 Mbit/s) even on a 1 Gbit/s link, whose bandwidth-delay product is 12.5 MB. The window scale option, negotiated in the SYN, shifts the window value left by up to 14 bits, allowing windows of about 1 GB.

</details>

### Q6. A capture shows the server's segments marked "TCP ZeroWindow" from the client. Where is the bottleneck?

**Style:** Debugging

<details>
<summary>Answer</summary>

At the client application: its receive buffer is full because it is not reading data from the socket fast enough (busy or blocked thread, slow processing, slow disk). The network is not the bottleneck. Fix the consumer (read faster, process asynchronously) or enlarge buffers if bursts are expected.

</details>

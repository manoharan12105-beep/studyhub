# OSI Layers 3 and 4 — Interview Questions

## Beginner

### Q1. What is the difference between the Network layer and the Transport layer?

**Style:** Comparison

<details>
<summary>Answer</summary>

The Network layer delivers packets host to host across networks using IP addresses and routing; it is best effort and processed by every router. The Transport layer delivers data process to process using port numbers, end to end only; TCP adds connections, reliability, ordering, flow and congestion control, while UDP adds only ports and a checksum.

</details>

### Q2. What are the main functions of the Network layer?

<details>
<summary>Answer</summary>

Logical (IP) addressing, routing (building routing tables), forwarding packets to the next hop, TTL to stop loops, fragmentation (IPv4), and error reporting with ICMP.

</details>

## Intermediate

### Q3. How does the receiving host know whether a packet's payload is TCP or UDP, and which application gets it?

**Style:** What happens internally

<details>
<summary>Answer</summary>

The IP header's Protocol field says which transport protocol is inside (6 = TCP, 17 = UDP, 1 = ICMP). The transport layer then uses the destination port (and for TCP connections the full 4-tuple) to find the socket, and the data is delivered to the process that owns that socket.

</details>

### Q4. Why is IP called "best effort"?

<details>
<summary>Answer</summary>

IP tries to deliver each packet but promises nothing: packets can be lost (queue overflow), duplicated, delayed or arrive out of order, and there is no acknowledgement. Keeping the network layer simple lets routers be fast and stateless; reliability is added only where needed by TCP at the end hosts.

</details>

## Advanced

### Q5. Ping to a server works but `curl https://server` hangs. Which layers have you proven work?

**Style:** Debugging

<details>
<summary>Answer</summary>

A successful ping proves layers 1–3 end to end (ICMP echo reached the host and came back) — unless ICMP is handled by something in front of it. The hang points to Layer 4 or above: a firewall dropping TCP 443 (timeout), the service not listening on the external address, or a TLS/application stall. Next: `nc -zv server 443` or `curl -v` to see whether the TCP connection is established.

</details>

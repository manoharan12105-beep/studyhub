# TTL, ICMP, ping and traceroute — Interview Questions

## Beginner

### Q1. What is ICMP? Give examples of ICMP messages.

<details>
<summary>Answer</summary>

The Internet Control Message Protocol carries error and diagnostic messages for IP, inside IP packets (protocol 1). Examples: Echo Request/Reply (ping), Destination Unreachable (network, host, port unreachable, fragmentation needed, administratively prohibited), and Time Exceeded (TTL reached 0).

</details>

### Q2. How does ping work?

<details>
<summary>Answer</summary>

It sends ICMP Echo Request messages to the target and waits for Echo Replies, reporting the round-trip time of each, the TTL of the reply, and statistics on loss and RTT. It tests Layer 3 reachability only.

</details>

## Intermediate

### Q3. How does traceroute work?

**Style:** What happens internally

<details>
<summary>Answer</summary>

It sends probes with TTL 1, then 2, then 3, and so on. Each router that decrements a probe's TTL to 0 discards it and sends back ICMP Time Exceeded, revealing its address and the RTT. When probes reach the destination, it answers (Echo Reply for ICMP-based `tracert`, Port Unreachable for UDP-based Linux `traceroute`), ending the trace. Usually three probes are sent per hop.

</details>

### Q4. A traceroute shows `* * *` at hops 3 and 4, but hops 5–9 respond normally. Is there packet loss at hops 3–4?

**Style:** Debugging

<details>
<summary>Answer</summary>

No. Traffic clearly passes through hops 3 and 4, since later hops answer. Those routers simply do not send (or rate-limit) ICMP Time Exceeded replies. Real loss shows as loss that starts at one hop and continues to the destination.

</details>

### Q5. Ping to a server fails, but the website on it loads. How?

**Style:** Scenario

<details>
<summary>Answer</summary>

ICMP Echo is blocked by a firewall or security group (very common in clouds), while TCP 443 is allowed. Ping tests ICMP only; to test the service, use `curl -v https://host` or `nc -zv host 443`.

</details>

## Advanced

### Q6. Why is blocking all ICMP a bad idea?

**Style:** Why

<details>
<summary>Answer</summary>

ICMP carries essential control messages, not just ping. Path MTU Discovery relies on "fragmentation needed"; without it large packets silently vanish (connections hang on big transfers). IPv6 depends on ICMPv6 for neighbour discovery, router advertisements and "packet too big". Diagnostics (unreachable, time exceeded) also disappear. Filter selectively — e.g. rate-limit echo — instead of blocking everything.

</details>

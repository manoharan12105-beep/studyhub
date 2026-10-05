# TTL, ICMP, ping and traceroute — Practice

### P1. Which message?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** ICMP types

A router drops a packet because its TTL reached 0. What does it send to the source?

- A) Echo Reply
- B) Time Exceeded
- C) Port Unreachable
- D) TCP RST

<details>
<summary>Answer</summary>

**Answer:** B) Time Exceeded

</details>

### P2. Ports and ping

**Difficulty:** Easy · **Type:** Conceptual · **Concepts:** ICMP has no ports

Why can't you "ping port 443"? Name a command that tests it.

<details>
<summary>Answer</summary>

ICMP has no port numbers — ping tests only IP reachability. Use `nc -zv host 443`, `curl -v https://host`, or on Windows `Test-NetConnection host -Port 443`.

</details>

### P3. Guess the hops

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** TTL

Replies from a Windows server arrive with TTL 116. Roughly how many routers are between you?

<details>
<summary>Answer</summary>

Windows starts at 128: 128 − 116 = **12** routers.

</details>

### P4. Read the trace

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** interpreting traceroute

A traceroute shows hops 1–6 with RTTs around 10–20 ms; from hop 7 to the destination (hop 11) every hop shows 180–200 ms. What does that suggest?

<details>
<summary>Answer</summary>

The large, persistent increase starting at hop 7 indicates a long-distance link (e.g. an intercontinental cable) or congestion between hops 6 and 7. Because it persists to the destination, it is real path latency, not just one slow-to-reply router.

</details>

### P5. Path stops

**Difficulty:** Hard · **Type:** Troubleshooting · **Concepts:** traceroute and firewalls

A Linux `traceroute` to a server ends with `* * *` from hop 8 until the hop limit, but `curl https://server` works. Explain.

<details>
<summary>Answer</summary>

Linux traceroute sends UDP probes to high ports; a firewall at or after hop 8 blocks them (or the ICMP replies), so the trace looks broken although HTTPS (TCP 443) is allowed. Try `traceroute -T -p 443` (TCP probes) or `-I` (ICMP) to trace with packets the firewall allows.

</details>

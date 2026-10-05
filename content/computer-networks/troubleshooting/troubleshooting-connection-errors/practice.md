# Troubleshooting Connection Errors — Practice

### P1. Immediate failure

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** refused

`curl http://10.0.0.5:9000` fails instantly with a "could not connect / connection refused" error. What is most likely?

- A) A firewall silently drops packets
- B) Nothing is listening on port 9000 at 10.0.0.5
- C) DNS failed
- D) The TLS certificate expired

<details>
<summary>Answer</summary>

**Answer:** B) Nothing is listening on port 9000 at 10.0.0.5

**Explanation:** A refusal is an RST from a reachable host. DNS is not involved (an IP was used), and plain HTTP has no TLS.

</details>

### P2. Classify the errors

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** error meanings

Classify each and give the first check: (a) `ConnectException: Connection refused`, (b) `SocketTimeoutException: Connect timed out`, (c) `UnknownHostException: payments.internal`, (d) `SocketException: Connection reset`.

<details>
<summary>Answer</summary>

(a) Nothing listening — check the service is running and its port/bind address. (b) Dropped/unreachable — check security groups/firewalls, IP and routes. (c) DNS — check the name and the resolver/search domains. (d) Connection aborted — check server crashes and idle timeouts of LBs/NAT vs connection pool lifetimes.

</details>

### P3. Inside vs outside

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** locating a firewall

`nc -zv app01 8443` succeeds from another server in the same subnet but times out from your laptop over the VPN. What does it tell you?

<details>
<summary>Answer</summary>

The service listens and the host firewall allows same-subnet traffic; something between the VPN and the subnet drops the traffic — a security group/NACL not allowing the VPN address range, the VPN not routing that subnet, or a host-firewall rule allowing only the local subnet.

</details>

### P4. One site only

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** phase isolation

Only `https://partner.example.com` fails. `curl -v` shows it resolves and `Trying 198.51.100.40:443...` then hangs. From your phone's hotspot it works. Where is the problem?

<details>
<summary>Answer</summary>

DNS works; the TCP connection from your network to that IP:443 gets no answer, but it works from another network. Your network's egress firewall/proxy blocks that destination, or the partner allowlists source IPs and your office's public IP is not on their list.

</details>

### P5. UDP silence

**Difficulty:** Hard · **Type:** Conceptual · **Concepts:** UDP failure modes

Why might a UDP-based application report "timeout" when the server port is closed, while a TCP application gets "refused" immediately?

<details>
<summary>Answer</summary>

UDP has no handshake. A closed UDP port triggers only an ICMP port unreachable, which firewalls often block and many applications do not surface. Without it, the client just waits for its own reply timeout. TCP's RST is part of the protocol itself and is returned directly by the host's kernel.

</details>

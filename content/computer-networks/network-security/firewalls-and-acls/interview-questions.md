# Firewalls and ACLs — Interview Questions

## Beginner

### Q1. What is a firewall?

<details>
<summary>Answer</summary>

A device or software that controls network traffic with rules matching fields such as source and destination IP, protocol, port and connection state, allowing or denying each packet or connection. It enforces which hosts and services may communicate, usually with a default-deny policy.

</details>

### Q2. What is the difference between a stateful and a stateless firewall?

**Style:** Comparison

<details>
<summary>Answer</summary>

A stateless firewall evaluates every packet on its own header fields, so rules must explicitly allow return traffic (e.g. replies to ephemeral ports). A stateful firewall tracks connections in a state table; once an outbound or inbound connection is allowed, its reply packets are allowed automatically, and packets that do not belong to a valid connection are dropped. Stateful firewalls are safer and easier to configure.

</details>

## Intermediate

### Q3. In what order are ACL rules evaluated, and why does it matter?

<details>
<summary>Answer</summary>

Top to bottom; the first matching rule decides, and an implicit deny usually applies at the end. Order matters because a general rule placed above a specific one shadows it — e.g. `allow tcp any any` before `deny tcp any host 10.0.2.20 port 5432` makes the deny never apply. Put specific rules first and the most general last.

</details>

### Q4. What happens to a client connection when a firewall drops the SYN vs rejects it?

**Style:** Comparison

<details>
<summary>Answer</summary>

Drop: the client receives nothing, retransmits the SYN with back-off and finally reports a connection timeout. Reject: the firewall answers with a TCP RST or ICMP unreachable, so the client fails immediately with "connection refused" or "no route to host/administratively prohibited".

</details>

### Q5. What is a WAF and how is it different from a network firewall?

**Style:** Comparison

<details>
<summary>Answer</summary>

A web application firewall inspects HTTP requests and responses (Layer 7): URLs, headers, bodies, cookies — blocking SQL injection, XSS payloads, malicious bots and rate abuse. A network firewall decides by IPs, ports and connection state (Layers 3–4) and cannot see whether an allowed HTTPS request is malicious.

</details>

## Advanced

### Q6. In AWS, the instance's security group allows inbound 443, but HTTPS clients time out. The subnet's network ACL allows inbound 443 too. What is a likely cause?

**Style:** Debugging

<details>
<summary>Answer</summary>

Network ACLs are stateless: the outbound rules must also allow the server's responses to the clients' ephemeral ports (1024–65535). If the NACL's outbound rules do not allow that, replies are dropped and clients time out. Security groups are stateful and need no such rule. (Also verify route tables and that the service listens on the right interface.)

</details>

# NAT — Interview Questions

## Beginner

### Q1. What is NAT and why is it used?

<details>
<summary>Answer</summary>

Network Address Translation rewrites source/destination IP addresses (and usually ports) at a router, so hosts with private addresses can communicate with the Internet through one or a few public addresses. It is used mainly because public IPv4 addresses are scarce; it also hides internal addressing.

</details>

### Q2. What is PAT?

<details>
<summary>Answer</summary>

Port Address Translation (NAT overload, NAPT): many private hosts share one public IP. The router rewrites each connection's source IP to the public IP and its source port to a unique public port, records the mapping in a translation table, and uses the destination port of returning packets to translate them back to the right private IP and port.

</details>

## Intermediate

### Q3. Compare static NAT, dynamic NAT and PAT.

**Style:** Comparison

<details>
<summary>Answer</summary>

Static NAT: a permanent one-to-one mapping between a private and a public IP — used to publish an internal server. Dynamic NAT: private hosts are mapped one-to-one to addresses from a pool of public IPs as needed; when the pool is used up, others must wait. PAT: many private hosts share one public IP, distinguished by port numbers — the default for home routers and cloud NAT gateways.

</details>

### Q4. Two laptops behind the same home router both use source port 52100 to connect to the same server. How does the reply reach the right laptop?

**Style:** What happens internally

<details>
<summary>Answer</summary>

The router assigns them different public source ports, e.g. 40001 and 40002, and records `192.168.1.10:52100 ↔ public:40001` and `192.168.1.11:52100 ↔ public:40002`. The server sends replies to public:40001 and public:40002; the router looks up each destination port and translates back to the correct private IP and port.

</details>

### Q5. Is NAT a security feature?

**Style:** Follow-up

<details>
<summary>Answer</summary>

Only incidentally. Because inbound packets without a translation entry are dropped, devices behind NAT are not directly reachable — similar to a stateful firewall's default-deny for inbound. But NAT has no policy, does not inspect traffic, does nothing about outbound connections, and can be traversed (hole punching, UPnP). Real protection comes from firewalls; IPv6 networks use firewalls without NAT.

</details>

## Advanced

### Q6. Your Spring Boot service in a private cloud subnet calls a partner API that allowlists IPs. Which IP should you give the partner, and why?

**Style:** Scenario

<details>
<summary>Answer</summary>

The public IP(s) of the NAT gateway (or egress proxy) the private subnet uses for Internet access. Instances have only private addresses; their outbound packets are source-NATed to the NAT gateway's public IP, which is what the partner sees. Use a static (elastic) IP on the NAT gateway so it does not change.

</details>

### Q7. How do two peers behind NAT establish a direct connection (e.g. a WebRTC call)?

<details>
<summary>Answer</summary>

With ICE: each peer learns its public IP:port from a STUN server and exchanges these candidates through a signalling server. Both then send UDP packets to each other's public endpoints simultaneously (hole punching); each NAT creates an outbound mapping that lets the other side's packets in. If the NATs are too strict (symmetric NAT) a TURN server relays the traffic instead.

</details>

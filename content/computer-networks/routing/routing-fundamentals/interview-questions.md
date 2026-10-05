# Routing Fundamentals — Interview Questions

## Beginner

### Q1. What is a routing table?

<details>
<summary>Answer</summary>

The table a router (or host) uses to decide where to send a packet. Each entry has a destination prefix, the next hop IP (or "directly connected"), the outgoing interface and a metric. Entries come from connected interfaces, static configuration and routing protocols.

</details>

### Q2. What is a default route?

<details>
<summary>Answer</summary>

The route `0.0.0.0/0` (IPv6 `::/0`), which matches every destination and is used only when no more specific route matches. On a host it points to the default gateway; on an edge router it usually points to the ISP.

</details>

## Intermediate

### Q3. Describe what a router does with each packet.

**Style:** What happens internally

<details>
<summary>Answer</summary>

It receives the frame and checks the FCS and destination MAC, removes the Layer 2 header, validates the IP header and decrements TTL (dropping the packet with ICMP Time Exceeded at 0), looks up the destination with longest prefix match, resolves the next hop's MAC via ARP, builds a new frame and sends it out of the chosen interface. With no matching route and no default route it drops the packet and sends ICMP Destination Unreachable.

</details>

### Q4. What is the difference between routing and forwarding?

**Style:** Comparison

<details>
<summary>Answer</summary>

Routing is the control-plane process of computing routes and building the routing table (via protocols or configuration). Forwarding is the data-plane action of moving each individual packet from an input to an output interface using that table. Routing happens when topology changes; forwarding happens for every packet.

</details>

### Q5. What is administrative distance vs metric?

**Style:** Comparison

<details>
<summary>Answer</summary>

The metric compares routes to the same prefix learned from the same protocol (e.g. OSPF cost, RIP hop count). Administrative distance compares routes to the same prefix learned from different sources — how much the router trusts each source (on Cisco: connected 0, static 1, eBGP 20, OSPF 110, RIP 120). The lowest administrative distance wins, then the lowest metric.

</details>

## Advanced

### Q6. A private EC2 instance cannot reach the Internet to download packages, but it can reach other instances in the VPC. What do you check?

**Style:** Scenario

<details>
<summary>Answer</summary>

The subnet's route table: a private subnet needs a `0.0.0.0/0` route to a NAT gateway (which itself must be in a public subnet with a `0.0.0.0/0` route to the Internet gateway). Local VPC traffic works through the implicit local route, which is why internal connectivity is fine. Then check security groups/NACLs for outbound rules and DNS resolution.

</details>

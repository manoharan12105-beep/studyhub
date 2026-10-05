# Network Device Comparisons — Interview Questions

## Beginner

### Q1. What is the difference between a switch and a router?

**Style:** Comparison

<details>
<summary>Answer</summary>

A switch works at Layer 2: it forwards frames within one network using MAC addresses and a learned MAC table, and it floods broadcasts. A router works at Layer 3: it forwards packets between different networks using IP addresses and a routing table, rewrites the Layer 2 header at each hop, decrements TTL and does not forward broadcasts. Switch = inside a LAN; router = between networks.

</details>

### Q2. Why is a switch better than a hub?

**Style:** Why

<details>
<summary>Answer</summary>

A switch sends each frame only to the destination port, so every port is its own collision domain with full-duplex, dedicated bandwidth, and hosts cannot passively see each other's traffic. A hub repeats everything to every port: one shared collision domain, half duplex, shared bandwidth and no privacy.

</details>

## Intermediate

### Q3. Which devices separate collision domains, and which separate broadcast domains?

<details>
<summary>Answer</summary>

Collision domains are separated by bridges, switches and routers (every switch or router port is its own collision domain). Broadcast domains are separated only by routers (each interface) and by VLANs on switches. Hubs and repeaters separate neither.

</details>

### Q4. What is a Layer 3 switch, and how does it differ from a router?

<details>
<summary>Answer</summary>

A Layer 3 switch is a switch that can also route between VLANs/subnets in hardware, using IP addresses. It gives many fast Ethernet ports and fast inter-VLAN routing inside a campus or data centre. A router typically has fewer ports but WAN features: NAT, VPN, firewalling, varied WAN interfaces and full routing protocols such as BGP at the edge.

</details>

### Q5. Count the domains: 2 switches, each with 6 PCs, both connected to different interfaces of one router.

**Style:** Output/prediction

<details>
<summary>Answer</summary>

Broadcast domains: **2** — one per router interface. Collision domains: every switched or routed link is its own collision domain. Each switch has 6 PC links plus 1 uplink to the router = 7 links, so 2 × 7 = **14** collision domains. (The router's two interfaces are the far ends of the two uplinks, already counted.)

</details>

## Advanced

### Q6. Why can't the Internet be built from switches alone?

**Style:** Why

<details>
<summary>Answer</summary>

MAC addresses are flat — they carry no location — so a switch must learn every address individually and floods frames to unknown ones. Broadcasts (ARP, DHCP) would reach every device on Earth. IP addresses are hierarchical, so routers can summarise millions of hosts as one prefix, choose paths, stop broadcasts and protect against loops with TTL.

</details>

# Collision Domains and Broadcast Domains — Interview Questions

## Beginner

### Q1. What is the difference between a collision domain and a broadcast domain?

**Style:** Comparison

<details>
<summary>Answer</summary>

A collision domain is a group of devices whose transmissions can collide because they share one medium (e.g. all devices on a hub). A broadcast domain is a group of devices that all receive each other's broadcast frames (e.g. all devices in one VLAN). Switches separate collision domains; routers and VLANs separate broadcast domains.

</details>

### Q2. Which devices break up broadcast domains?

<details>
<summary>Answer</summary>

Routers (each interface is a separate broadcast domain) and Layer 3 switches routing between VLANs. On a Layer 2 switch, each VLAN is a separate broadcast domain. Hubs and plain switches without VLANs do not break them up.

</details>

## Intermediate

### Q3. Explain CSMA/CD.

<details>
<summary>Answer</summary>

Carrier Sense Multiple Access with Collision Detection, used on shared half-duplex Ethernet: a station listens until the medium is idle, transmits, and keeps listening; if it detects a collision it sends a jam signal, waits a random back-off (binary exponential: after n collisions, 0 to 2ⁿ−1 slot times, capped), and retries, giving up after 16 attempts. Full-duplex switched Ethernet has no collisions and does not use it.

</details>

### Q4. Why is a very large broadcast domain a problem?

**Style:** Why

<details>
<summary>Answer</summary>

Every broadcast (ARP, DHCP, discovery protocols) is delivered to and processed by every host, wasting bandwidth and CPU; ARP tables grow; a single loop or faulty NIC can cause a broadcast storm that takes down the whole domain; and security isolation is weak. Splitting into VLANs/subnets contains all of these.

</details>

## Advanced

### Q5. Count the domains: a router with two interfaces; interface 1 to a 24-port switch with 10 PCs; interface 2 to a hub with 5 PCs.

**Style:** Output/prediction

<details>
<summary>Answer</summary>

Broadcast domains: **2** (one per router interface). Collision domains: the switch has 10 PC links + 1 uplink = 11; the hub, its 5 PCs and its uplink = 1. Total **12**.

</details>

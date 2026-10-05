# Fundamentals, Devices and Models — Interview Questions

## Beginner

### Q1. What is the OSI model, and why do we use layered models?

**Style:** Direct

<details>
<summary>Answer</summary>

A 7-layer reference model (Physical, Data Link, Network, Transport, Session, Presentation, Application) that divides communication into separate responsibilities. Layering lets each layer evolve independently (Wi-Fi under the same HTTP), lets vendors interoperate, provides a common vocabulary ("Layer 2 issue") and makes troubleshooting systematic.

</details>

### Q2. OSI vs TCP/IP — what is the difference?

**Style:** Comparison

<details>
<summary>Answer</summary>

OSI is a 7-layer conceptual model from ISO; TCP/IP is the 4- or 5-layer architecture of the protocols the Internet actually runs. TCP/IP merges Session, Presentation and Application into one Application layer (and, in the 4-layer form, Data Link and Physical into Link). OSI is used for teaching and its layer numbers survive as vocabulary (L4/L7 load balancers); TCP/IP won because it was implemented first, simpler and open.

</details>

### Q3. Hub vs switch vs router?

**Style:** Comparison

<details>
<summary>Answer</summary>

Hub (L1): repeats every signal to every port — one collision domain, shared bandwidth. Switch (L2): learns MAC addresses and forwards each frame only to the destination port — a collision domain per port, still one broadcast domain. Router (L3): forwards packets between different networks by IP using a routing table, decrements TTL, rewrites the frame, and separates broadcast domains.

</details>

### Q4. MAC address vs IP address?

**Style:** Comparison

<details>
<summary>Answer</summary>

MAC: 48-bit, flat, assigned to the NIC, used to deliver frames on the local link; it changes at every hop. IP: 32/128-bit, hierarchical (network + host), assigned by the network, used for end-to-end routing; it stays the same along the path (unless NAT). IP decides which host; MAC decides which device on this wire.

</details>

### Q5. What are the PDUs at each layer?

**Style:** Direct

<details>
<summary>Answer</summary>

Application: data/message; Transport: segment (TCP) or datagram (UDP); Network: packet; Data Link: frame; Physical: bits.

</details>

## Intermediate

### Q6. What is ARP and why is it needed?

**Style:** Why

<details>
<summary>Answer</summary>

ARP maps an IPv4 address to a MAC address on the local link. Hosts know the next hop's IP (the destination or the default gateway), but Ethernet needs a MAC to deliver the frame. ARP broadcasts "Who has 192.168.1.1?", the owner replies with its MAC, and the mapping is cached. For remote destinations the host ARPs for its gateway, not the remote server.

</details>

### Q7. Collision domain vs broadcast domain — which devices separate each?

**Style:** Comparison

<details>
<summary>Answer</summary>

A collision domain is where simultaneous transmissions collide (shared medium); switches and routers separate them (one per port), hubs do not. A broadcast domain is where a broadcast frame reaches every device; routers (per interface) and VLANs separate them, switches do not.

</details>

### Q8. Explain encapsulation with an HTTP request.

**Style:** What happens internally

<details>
<summary>Answer</summary>

The browser's HTTP request (encrypted by TLS) gets a TCP header (ports, sequence numbers) → segment; an IP header (source/destination IP, TTL, protocol 6) → packet; an Ethernet/Wi-Fi header (MACs, EtherType) and FCS trailer → frame; then bits on the medium. The receiver decapsulates in reverse; routers in between only go up to Layer 3 and rebuild the frame for the next link.

</details>

### Q9. Bandwidth vs throughput vs latency?

**Style:** Comparison

<details>
<summary>Answer</summary>

Bandwidth is the maximum capacity of a link (bits/s); throughput is the rate actually achieved end to end (limited by the bottleneck, loss, congestion, protocol overhead); latency is the time for data to travel (ms), made of propagation, transmission, queuing and processing delays. More bandwidth does not reduce propagation delay — a page with many round trips stays slow on a fast link.

</details>

### Q10. Modem vs router?

**Style:** Comparison

<details>
<summary>Answer</summary>

A modem (L1) converts digital data to the signal the ISP's medium uses (DSL, cable, fibre ONT, cellular) and back. A router (L3) forwards packets between networks — your LAN and the ISP — and at home also does NAT, DHCP and firewalling. Home boxes usually combine both plus a switch and Wi-Fi access point.

</details>

### Q11. How does a switch learn and forward?

**Style:** What happens internally

<details>
<summary>Answer</summary>

It learns by recording each incoming frame's source MAC against the incoming port, with ageing (~300 s). For forwarding it looks up the destination MAC: known on another port → forward there; on the same port → filter; unknown or broadcast → flood to all other ports in the VLAN. It does not modify the frame.

</details>

## Advanced

### Q12. Why can't the Internet be one big switched network?

**Style:** Why

<details>
<summary>Answer</summary>

MAC addresses are flat, so switches cannot summarise them; every switch would need entries for every device and would flood unknown destinations worldwide. Broadcasts (ARP, DHCP) would reach billions of hosts, and Layer 2 loops have no TTL. IP's hierarchical addressing lets routers aggregate prefixes, stop broadcasts and kill looping packets with TTL.

</details>

### Q13. Why do MAC addresses change at every hop while IP addresses do not?

**Style:** Why

<details>
<summary>Answer</summary>

Layer 2 only delivers across one link. Each router removes the received frame and creates a new one addressed from its outgoing interface to the next hop. The IP header carries the end-to-end source and destination, which routers use but do not change (apart from TTL and checksum) — NAT is the exception.

</details>

### Q14. Circuit switching vs packet switching — why does the Internet use packet switching?

**Style:** Comparison

<details>
<summary>Answer</summary>

Circuit switching reserves a fixed path and capacity (constant quality, but wasted capacity, setup delay, fragile). Packet switching sends independent packets over shared links (efficient for bursty traffic, no setup, reroutes around failures, but variable delay and possible loss). The Internet uses datagram packet switching; TCP adds reliability at the ends.

</details>

### Q15. Follow-up chain: "Your laptop sends a frame to the router — what if the router's MAC is not in the ARP cache? What if nobody answers?"

**Style:** Follow-up

<details>
<summary>Answer</summary>

The laptop queues the packet and broadcasts an ARP request for the gateway's IP; the router replies with its MAC, which is cached and the frame is sent. If nobody answers (wrong gateway IP, router down, wrong VLAN), the laptop retries a few times and then reports the destination unreachable — local traffic still works, everything remote fails.

</details>

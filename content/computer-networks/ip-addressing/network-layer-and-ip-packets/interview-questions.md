# The Network Layer and IP Packets — Interview Questions

## Beginner

### Q1. What does "IP is best effort" mean?

<details>
<summary>Answer</summary>

IP tries to deliver each packet but guarantees nothing: packets may be lost, duplicated, delayed or arrive out of order, and IP does not acknowledge or retransmit them. Reliability, if needed, is added by TCP at the end hosts.

</details>

### Q2. What is TTL and why is it needed?

<details>
<summary>Answer</summary>

Time To Live is an 8-bit IPv4 header field that each router decrements by 1. When it reaches 0 the router drops the packet and sends an ICMP Time Exceeded message to the source. It prevents packets from circulating forever in routing loops; `traceroute` exploits it to discover each hop. IPv6 calls it Hop Limit.

</details>

## Intermediate

### Q3. Name the important fields of the IPv4 header.

<details>
<summary>Answer</summary>

Version, header length, DSCP/ECN, total length, identification/flags/fragment offset (fragmentation, the DF bit), TTL, protocol (6 TCP, 17 UDP, 1 ICMP), header checksum, source IP, destination IP, and optional options. The minimum header is 20 bytes.

</details>

### Q4. What is the difference between the control plane and the data plane?

**Style:** Comparison

<details>
<summary>Answer</summary>

The control plane decides how traffic should flow: it runs routing protocols (OSPF, BGP) or uses static configuration to build the routing table. The data plane forwards each packet using that table — lookup, TTL decrement, send to the next hop — in hardware at line rate. Routing = control plane; forwarding = data plane.

</details>

### Q5. What is IP fragmentation and why is it avoided?

<details>
<summary>Answer</summary>

When an IPv4 packet is bigger than the next link's MTU and the Don't Fragment bit is clear, a router splits it into fragments that the destination reassembles. It is avoided because losing any fragment loses the whole packet, reassembly costs memory, and firewalls/NAT handle fragments poorly. Instead, senders use Path MTU Discovery (DF set, ICMP "fragmentation needed") and TCP limits segment size with the MSS. IPv6 routers never fragment.

</details>

## Advanced

### Q6. Why does the IPv4 header checksum have to be recomputed at every router, and why did IPv6 remove it?

**Style:** Why

<details>
<summary>Answer</summary>

The checksum covers the header, and every router changes the TTL field, so the checksum changes too. IPv6 removed it because the link layer (Ethernet CRC) and the transport layer (TCP/UDP checksums, mandatory for UDP over IPv6) already detect errors, so recomputing a checksum at each hop was redundant work.

</details>

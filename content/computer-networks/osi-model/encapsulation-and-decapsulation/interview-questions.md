# Encapsulation and Decapsulation — Interview Questions

## Beginner

### Q1. What is encapsulation in networking?

<details>
<summary>Answer</summary>

As data moves down the layers at the sender, each layer adds its own header (and the Data Link layer also a trailer) around the data from the layer above: application data → TCP segment → IP packet → Ethernet frame → bits. Decapsulation is the reverse at the receiver, each layer removing its header and passing the payload up.

</details>

### Q2. Which layer adds a trailer, and what is in it?

<details>
<summary>Answer</summary>

The Data Link layer. The Ethernet trailer is the Frame Check Sequence — a CRC-32 computed over the frame so the receiver can detect corruption and drop bad frames.

</details>

## Intermediate

### Q3. What does a router change when it forwards a packet?

**Style:** What happens internally

<details>
<summary>Answer</summary>

It decapsulates the frame up to Layer 3, decrements the IP TTL (and recomputes the IPv4 header checksum), then encapsulates the packet in a new frame: source MAC = its outgoing interface, destination MAC = the next hop, new FCS. Source and destination IP, ports and data are unchanged unless the router also does NAT.

</details>

### Q4. What is the difference between MTU and MSS?

**Style:** Comparison

<details>
<summary>Answer</summary>

MTU is the largest Layer 3 packet a link can carry (1,500 bytes on Ethernet), including IP and TCP headers. MSS is the largest amount of TCP *data* in one segment: MTU − IP header − TCP header = 1,500 − 20 − 20 = 1,460 bytes typically. MSS is announced in the TCP handshake.

</details>

## Advanced

### Q5. Small API calls through a VPN work, but large responses hang. Explain using encapsulation.

**Style:** Debugging

<details>
<summary>Answer</summary>

The VPN encapsulates each packet inside another (extra IP/UDP/VPN headers), so the effective MTU drops below 1,500. Large packets no longer fit; with the "don't fragment" bit set they are dropped, and the router should send ICMP "fragmentation needed". If a firewall blocks that ICMP, the sender never learns to send smaller packets (a path-MTU black hole). Fixes: allow ICMP, lower the MTU on the tunnel, or clamp the TCP MSS.

</details>

# Local vs Remote Delivery — Interview Questions

## Beginner

### Q1. What is a default gateway and when is it used?

<details>
<summary>Answer</summary>

The IP address of a router in the host's own subnet. The host uses it whenever the destination is outside its subnet: it sends the frame to the gateway's MAC address, and the router forwards the packet onwards. Traffic to hosts in the same subnet does not use the gateway.

</details>

### Q2. How does a host decide whether a destination is local or remote?

<details>
<summary>Answer</summary>

It applies its subnet mask (bitwise AND) to its own IP and to the destination IP. If the network parts are equal, the destination is local and is reached directly; otherwise the packet goes to the default gateway. In practice, the OS looks the destination up in its routing table: the connected subnet route versus the default route.

</details>

## Intermediate

### Q3. Describe what happens when a host sends a packet to another host on the same subnet.

**Style:** What happens internally

<details>
<summary>Answer</summary>

The host sees the destination is local, checks its ARP cache, and if needed broadcasts an ARP request for the destination's IP. The destination replies with its MAC. The host then sends the frame with the destination's MAC; the switch forwards it to the right port. No router is involved and the TTL does not change.

</details>

### Q4. What happens when the destination is in another network?

**Style:** What happens internally

<details>
<summary>Answer</summary>

The host sees the destination is remote, so the next hop is the default gateway. It ARPs for the gateway's IP (not the destination's), then sends a frame addressed to the gateway's MAC containing an IP packet addressed to the final destination. The router removes the frame, routes by destination IP, decrements TTL and re-encapsulates for the next hop, until the last router delivers it on the destination's LAN.

</details>

## Advanced

### Q5. A host is configured with mask `255.255.0.0` instead of `255.255.255.0` in a `/24` network. What breaks?

**Style:** Debugging

<details>
<summary>Answer</summary>

The host believes every `x.y.*.*` address is local. Destinations inside its real `/24` still work. Destinations in other `/24`s of the same `/16` (other subnets, maybe the DNS server) are wrongly treated as local: the host ARPs for them, nobody on the LAN answers, and those connections fail with "host unreachable". Destinations outside the `/16` (the Internet) still go via the gateway and work. The symptom is "some internal subnets are unreachable but the Internet works".

</details>

### Q6. Two PCs are plugged into the same switch. One is `10.0.1.5/24`, the other `10.0.2.5/24`. Can they talk directly?

**Style:** Scenario

<details>
<summary>Answer</summary>

Not directly. Each sees the other as remote and sends to its own default gateway. They can communicate only if a router (or L3 switch) has interfaces/addresses in both subnets and each PC's gateway points to it. Being on the same switch does not matter — the subnet decides.

</details>

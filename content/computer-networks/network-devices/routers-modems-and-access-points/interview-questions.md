# Routers, Gateways, Modems and Access Points — Interview Questions

## Beginner

### Q1. What does a router do?

<details>
<summary>Answer</summary>

It forwards packets between different networks. For each packet it reads the destination IP address, finds the best matching route in its routing table (longest prefix match), decrements the TTL, and sends the packet out of the right interface in a new frame addressed to the next hop. It also separates broadcast domains.

</details>

### Q2. What is a default gateway?

<details>
<summary>Answer</summary>

The IP address of the router, in the host's own subnet, to which the host sends every packet whose destination is outside its subnet. Typically `192.168.1.1` at home, provided by DHCP. Without it, the host can reach only its local subnet.

</details>

### Q3. What is the difference between a modem and a router?

**Style:** Comparison

<details>
<summary>Answer</summary>

A modem (Layer 1) converts between your digital data and the ISP line's signal (DSL, cable, fibre, cellular). A router (Layer 3) forwards packets between networks by IP address — your LAN and the ISP's network — and at home also does NAT, DHCP and firewalling. Most ISP boxes combine both.

</details>

## Intermediate

### Q4. Router vs gateway — are they the same?

**Style:** Comparison

<details>
<summary>Answer</summary>

Often the same box, different concepts. A router is a Layer 3 device forwarding packets between IP networks. A gateway is the role of being the exit from one network to another; a default gateway is simply the router a host uses for non-local traffic. "Gateway" can also mean a device that translates between protocols (email gateway, VoIP gateway, API gateway), working up to Layer 7.

</details>

### Q5. What changes in a packet when it passes through a router?

**Style:** What happens internally

<details>
<summary>Answer</summary>

The Layer 2 header is replaced: new source MAC (the router's outgoing interface) and new destination MAC (the next hop), plus a new frame check sequence. In the IP header, TTL is decremented and the header checksum recalculated. Source and destination IP addresses stay the same — unless the router also performs NAT.

</details>

## Advanced

### Q6. A host has the wrong default gateway configured. What works and what fails?

**Style:** Scenario

<details>
<summary>Answer</summary>

Communication with hosts in the same subnet works, because it does not use the gateway (ARP resolves them directly). Everything outside the subnet fails: pinging the Internet, DNS servers outside the subnet (so names fail to resolve), and other subnets. If the configured "gateway" is not in the host's subnet, many OSes refuse the route outright; if it is a non-router host, packets are sent to it and dropped.

</details>

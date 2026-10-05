# IP Addressing, Subnetting, Routing, NAT and DHCP — Interview Questions

## Beginner

### Q1. Public vs private IP addresses?

**Style:** Comparison

<details>
<summary>Answer</summary>

Public addresses are globally unique and routable on the Internet. Private addresses (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`) are reusable inside any network and not routed on the Internet; hosts using them reach the Internet through NAT, which maps them to a public address.

</details>

### Q2. IPv4 vs IPv6?

**Style:** Comparison

<details>
<summary>Answer</summary>

32-bit dotted decimal vs 128-bit hexadecimal; ~4.3 billion vs ~3.4 × 10³⁸ addresses. IPv6 has no broadcast (multicast instead), uses NDP instead of ARP, supports SLAAC, has a fixed 40-byte header without checksum, lets only the sender fragment, and does not need NAT. They are not directly interoperable (dual stack, tunnelling, NAT64).

</details>

### Q3. What is a default gateway?

**Style:** Direct

<details>
<summary>Answer</summary>

The router address in a host's own subnet to which the host sends all traffic for destinations outside its subnet. The frame goes to the gateway's MAC; the packet keeps the final destination IP.

</details>

### Q4. Static vs dynamic IP address?

**Style:** Comparison

<details>
<summary>Answer</summary>

Static addresses are configured manually and do not change — for servers, routers, DNS servers, printers. Dynamic addresses are leased by DHCP and may change — for clients. DHCP reservations give fixed addresses with central management.

</details>

## Intermediate

### Q5. For `192.168.10.77/26`, give the network address, broadcast address, host range and number of hosts.

**Style:** Output/prediction

<details>
<summary>Answer</summary>

/26 → mask `255.255.255.192`, block 64. 77 is in 64–127. Network `192.168.10.64`, broadcast `192.168.10.127`, hosts `.65`–`.126`, **62** usable.

</details>

### Q6. You need at least 10 subnets of at least 12 hosts from `192.168.1.0/24`. Is it possible, and with which prefix?

**Style:** Output/prediction

<details>
<summary>Answer</summary>

12 hosts → 2⁴ − 2 = 14 ≥ 12 → /28 (16 addresses). A /24 holds 2⁴ = 16 /28 subnets ≥ 10. **Yes, use /28.** (A /27 would give only 8 subnets.)

</details>

### Q7. What is CIDR and why did it replace classful addressing?

**Style:** Why

<details>
<summary>Answer</summary>

Classless Inter-Domain Routing allows any prefix length (`/21`, `/27`) instead of fixed Class A/B/C sizes. Classes wasted addresses (a 2,000-host company received 65,534 addresses) and bloated routing tables; CIDR right-sizes allocations and lets routes be aggregated (supernetting).

</details>

### Q8. How does a router choose between `10.0.0.0/8`, `10.1.0.0/16` and `0.0.0.0/0` for destination `10.1.2.3`?

**Style:** What happens internally

<details>
<summary>Answer</summary>

All three match; longest prefix match selects `10.1.0.0/16` as the most specific. Metrics and administrative distance only break ties between routes for the same prefix.

</details>

### Q9. Routing vs forwarding?

**Style:** Comparison

<details>
<summary>Answer</summary>

Routing is the control-plane process of building the routing table (static configuration or protocols like OSPF and BGP). Forwarding is the data-plane action of sending each packet to the next hop using that table (lookup, TTL decrement, new frame).

</details>

### Q10. Explain DHCP DORA.

**Style:** What happens internally

<details>
<summary>Answer</summary>

Discover (client broadcasts from 0.0.0.0), Offer (server proposes IP, mask, gateway, DNS, lease), Request (client broadcasts acceptance of one offer), Acknowledge (server confirms). Leases renew at 50 % (unicast) and rebind at 87.5 % (broadcast); relays forward DHCP across routers.

</details>

### Q11. DNS vs DHCP? ARP vs DNS?

**Style:** Comparison

<details>
<summary>Answer</summary>

DHCP configures the host itself (its IP, mask, gateway, DNS servers); DNS translates other hosts' names into IP addresses. ARP translates an IPv4 address into a MAC address on the local link; DNS translates names into IP addresses globally. A typical request uses all three: DHCP once, then DNS (name → IP), then ARP (gateway IP → MAC).

</details>

## Advanced

### Q12. How do 20 devices at home share one public IP? What breaks because of it?

**Style:** What happens internally

<details>
<summary>Answer</summary>

PAT on the home router rewrites each outbound connection's private source IP:port to the public IP with a unique port and records the mapping; replies are translated back by port. Side effects: devices are not reachable from the Internet without port forwarding, peer-to-peer needs traversal (STUN/TURN/ICE), idle mappings expire, and with ISP CGNAT even port forwarding is impossible.

</details>

### Q13. What is TTL, and how does traceroute use it?

**Style:** How

<details>
<summary>Answer</summary>

TTL is decremented by each router; at 0 the packet is dropped and ICMP Time Exceeded is returned — preventing endless loops. Traceroute sends probes with TTL 1, 2, 3 …, so each successive router reveals itself through its Time Exceeded message until the destination replies.

</details>

### Q14. Summarise `172.16.12.0/24` through `172.16.15.0/24`.

**Style:** Output/prediction

<details>
<summary>Answer</summary>

Four networks (12–15); 12 = `00001100`, 15 = `00001111` share 6 leading bits in the third octet → /22. 12 is a multiple of 4, so the summary is **`172.16.12.0/22`**.

</details>

### Q15. Follow-up chain: "A host has IP `10.1.5.20/24` and gateway `10.1.6.1`. What happens? And if the mask were /16?"

**Style:** Follow-up

<details>
<summary>Answer</summary>

With /24, the gateway `10.1.6.1` is outside the host's subnet `10.1.5.0/24`, so the host cannot ARP for it — most OSes reject the route, and remote traffic fails. With /16, the host's subnet is `10.1.0.0/16`, the gateway is local and reachable, and remote traffic works — but then any `10.1.x.x` host is considered local, which breaks reaching other `10.1.*` subnets that are really behind routers.

</details>

# IPv6 Addressing and IPv4 vs IPv6 — Interview Questions

## Beginner

### Q1. What are the main differences between IPv4 and IPv6?

**Style:** Comparison

<details>
<summary>Answer</summary>

Address size (32 vs 128 bits) and notation (dotted decimal vs colon-separated hex). IPv6 has no broadcast (uses multicast), replaces ARP with NDP, supports stateless autoconfiguration (SLAAC), has a simpler fixed 40-byte header with no checksum, lets only the sender fragment, uses Hop Limit instead of TTL, and has enough addresses that NAT is unnecessary.

</details>

### Q2. Why was IPv6 introduced?

**Style:** Why

<details>
<summary>Answer</summary>

IPv4's ~4.3 billion addresses were exhausted (IANA's free pool ran out in 2011). NAT delayed the problem but broke end-to-end connectivity and complicated peer-to-peer and server hosting. IPv6 provides a practically unlimited address space and simplifies parts of the protocol.

</details>

## Intermediate

### Q3. Compress `2001:0db8:0000:0000:0001:0000:0000:0010`.

**Style:** Output/prediction

<details>
<summary>Answer</summary>

Drop leading zeros: `2001:db8:0:0:1:0:0:10`. Two zero runs of equal length — `::` may replace only one; by convention the first (leftmost) longest run: `2001:db8::1:0:0:10`.

</details>

### Q4. What is a link-local IPv6 address?

<details>
<summary>Answer</summary>

An address in `fe80::/10` that every IPv6 interface automatically has. It is valid only on its own link (routers never forward it) and is used for neighbour discovery and router communication — routers advertise themselves from their link-local address, and hosts use it as the default gateway address.

</details>

### Q5. How does an IPv6 host find a neighbour's MAC address?

**Style:** What happens internally

<details>
<summary>Answer</summary>

With NDP: it sends an ICMPv6 Neighbor Solicitation to the target's solicited-node multicast address (`ff02::1:ffXX:XXXX`, built from the last 24 bits of the target address), so only hosts with matching endings process it. The target answers with a Neighbor Advertisement containing its MAC.

</details>

## Advanced

### Q6. Can an IPv4-only client talk to an IPv6-only server? How does the Internet handle the transition?

**Style:** Scenario

<details>
<summary>Answer</summary>

Not directly — the packet formats are incompatible. The transition uses dual stack (hosts and networks run both; DNS returns A and AAAA records; clients try IPv6 and fall back to IPv4 quickly), tunnelling (one protocol carried inside the other across incompatible segments), and translation such as NAT64/DNS64 (IPv6-only clients reaching IPv4-only servers, common on mobile networks).

</details>

# Interview Questions: IP Addressing, Subnetting, Routing, NAT and DHCP

**Module:** Interview Preparation · **Interview priority:** Core

## What Is It?

A cross-topic bank of [interview questions](interview-questions.md) on the network layer: IPv4 and IPv6, public and private addresses, subnetting and CIDR, routing tables and longest prefix match, TTL, NAT and DHCP — including the calculation questions common in placement tests.

## Why It Matters

Placement tests love subnetting calculations; backend interviews ask how a packet leaves a private network (gateway, NAT) and why a service is unreachable (routes, masks). Both need fluent addressing.

## Core Concept

### Answer patterns

- **Calculation questions:** state the block size, the network, broadcast, range and count — and show one line of working ([block-size method](../../subnetting/subnetting-block-size-method/content.md)).
- **"How does a packet leave my network?":** subnet mask → default gateway → ARP for the gateway → routing table (longest prefix match) → NAT at the edge.
- **Comparisons:** IPv4/IPv6, public/private, static/dynamic, routing/forwarding, static/dynamic routing, DNS/DHCP, ARP/DNS.

### Coverage

| Area | Lessons |
|------|---------|
| Addressing | [IPv4](../../ip-addressing/ipv4-addressing/content.md), [Special Addresses](../../ip-addressing/public-private-and-special-ip-addresses/content.md), [Masks and CIDR](../../ip-addressing/subnet-masks-and-cidr/content.md), [IPv6](../../ip-addressing/ipv6-addressing/content.md) |
| Subnetting | [Fundamentals](../../subnetting/subnetting-fundamentals/content.md), [Block Size](../../subnetting/subnetting-block-size-method/content.md), [VLSM](../../subnetting/vlsm-and-supernetting/content.md), [Problems](../../subnetting/subnetting-problems/content.md) |
| Routing | [Fundamentals](../../routing/routing-fundamentals/content.md), [LPM](../../routing/longest-prefix-match/content.md), [Protocols](../../routing/static-and-dynamic-routing/content.md), [TTL and ICMP](../../routing/ttl-and-icmp/content.md) |
| Services | [DHCP](../../dhcp/dhcp-dora/content.md), [NAT](../../nat/network-address-translation/content.md), [Local vs Remote](../../arp-and-local-delivery/local-vs-remote-delivery/content.md) |

## Key Takeaways

- Show the working for calculations; it earns credit and catches mistakes.
- Connect addressing to forwarding: mask → gateway → route → NAT.
- Know the private ranges, special addresses and the IPv4/IPv6 differences by heart.
